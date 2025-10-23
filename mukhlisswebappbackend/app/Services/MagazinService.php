<?php
namespace App\Services;

use Illuminate\Support\Facades\Log; 
use App\Repositories\Interfaces\MagazinRepositoryInterface;
use App\Models\Magazin;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MagazinService 
{
    protected $repository;

    public function __construct(MagazinRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function createUserWithMagazin(array $userData, array $magazinData)
    {
        try {
            // 1️⃣ Extraire et valider les coordonnées
            $coordinates = $this->extractCoordinates($magazinData);
            
            if (!$coordinates['latitude'] || !$coordinates['longitude']) {
                throw new \Exception('Coordonnées invalides ou manquantes');
            }

            // Ajouter les coordonnées au magazinData
            $magazinData['latitude'] = $coordinates['latitude'];
            $magazinData['longitude'] = $coordinates['longitude'];

            // 2️⃣ Créer l'utilisateur dans Supabase
            $user = $this->createSupabaseUser($userData);
            
            // 3️⃣ Créer le magazin avec Eloquent
            $magazin = $this->createMagazin($user['id'], $magazinData);
            
            Log::info("✅ Magazin créé avec succès - ID: {$user['id']}");

            return [
                'user' => $user,
                'magazin' => $magazin
            ];
        } catch (\Exception $e) {
            Log::error("❌ Erreur dans createUserWithMagazin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Extraire les coordonnées depuis différents formats
     */
    private function extractCoordinates(array $magazinData): array
    {
        $latitude = null;
        $longitude = null;

        // Format direct : latitude/longitude
        if (isset($magazinData['latitude']) && isset($magazinData['longitude'])) {
            $latitude = (float) $magazinData['latitude'];
            $longitude = (float) $magazinData['longitude'];
            
            Log::info("📍 Coordonnées reçues - Lat: $latitude, Lng: $longitude");
        } 
        // Format WKT
        elseif (isset($magazinData['geom'])) {
            [$longitude, $latitude] = $this->parseWktPoint($magazinData['geom']);
            Log::info("📍 Coordonnées extraites WKT - Lat: $latitude, Lng: $longitude");
        }

        return [
            'latitude' => $latitude,
            'longitude' => $longitude
        ];
    }

    /**
     * Parser un point WKT
     */
    private function parseWktPoint(string $wkt): array
    {
        if (preg_match('/POINT\(([-\d.]+)\s+([-\d.]+)\)/', $wkt, $matches)) {
            return [(float) $matches[1], (float) $matches[2]]; // [longitude, latitude]
        }
        
        Log::error("❌ Format WKT invalide: " . $wkt);
        return [null, null];
    }

    /**
     * Créer un utilisateur dans Supabase
     */
    private function createSupabaseUser(array $userData): array
    {
        $response = Http::withHeaders([
            'apikey' => config('services.supabase.key'),
            'Authorization' => 'Bearer ' . config('services.supabase.service_role_key'),
            'Content-Type' => 'application/json',
        ])->post(config('services.supabase.url') . '/auth/v1/admin/users', [
            'email' => $userData['email'],
            'password' => $userData['password'] ?? Str::random(12),
            'email_confirm' => true,
            'user_metadata' => [
                'name' => $userData['nom_enseigne'],
                'role' => 'magazin'
            ]
        ]);
        
        if (!$response->successful()) {
            $errorData = $response->json();
            $errorMessage = $errorData['msg'] ?? $errorData['error'] ?? $response->body();
            throw new \Exception('Failed to create user: ' . $errorMessage);
        }

        return $response->json();
    }

    /**
     * Créer un magazin avec Eloquent
     */
    protected function createMagazin(string $userId, array $data)
    {
        if (Magazin::where('id', $userId)->exists()) {
            throw new \Exception('Un magazin existe déjà pour cet utilisateur');
        }

        $latitude = $data['latitude'] ?? null;
        $longitude = $data['longitude'] ?? null;
        
        if (!$latitude || !$longitude) {
            throw new \Exception('Coordonnées manquantes');
        }

        try {
            // ✅ Utiliser Eloquent avec DB::raw pour la géométrie
            $magazin = new Magazin();
            $magazin->id = $userId;
            $magazin->nom_enseigne = $data['nom_enseigne'] ?? null;
            $magazin->siret = $data['siret'] ?? null;
            $magazin->adresse = $data['adresse'] ?? null;
            $magazin->ville = $data['ville'] ?? null;
            $magazin->code_postal = $data['code_postal'] ?? null;
            $magazin->telephone = $data['telephone'] ?? null;
            $magazin->description = $data['description'] ?? null;
            $magazin->email = $data['email'] ?? null;
            $magazin->Categorieid = $data['Categorieid'] ?? null;
            $magazin->logoUrl = $data['logoUrl'] ?? null;
            
            // 🗺️ Géométrie avec DB::raw pour PostGIS/Supabase
            $magazin->geom = DB::raw("extensions.ST_GeomFromText('POINT($longitude $latitude)', 4326)");
            
            $magazin->save();
            
            Log::info("✅ Magasin créé via Eloquent - ID: $userId, Coords: ($longitude, $latitude)");
            
            return $magazin->fresh(); // Recharger depuis la DB
            
        } catch (\Exception $e) {
            Log::error("❌ Erreur lors de la création du magasin: " . $e->getMessage());
            
            // Nettoyage du logo si échec
            if (isset($data['logoUrl'])) {
                $this->cleanupLogo($data['logoUrl']);
            }
            
            throw $e;
        }
    }

    /**
     * Nettoyer le logo en cas d'erreur
     */
    private function cleanupLogo(string $logoUrl): void
    {
        try {
            $path = parse_url($logoUrl, PHP_URL_PATH);
            $fileName = basename($path);
            Log::info("🧹 Nettoyage du logo: " . $fileName);
            // Ajoutez ici votre logique de suppression (Storage::delete(), etc.)
        } catch (\Exception $e) {
            Log::error("Erreur suppression logo: " . $e->getMessage());
        }
    }

    /**
     * Mettre à jour un magazin
     */
    public function UpdateMagazin(Magazin $magazin)
    {
        $this->repository->update($magazin);
    }

    /**
     * Récupérer tous les magazins
     */
    public function GetallMagazin()
    {
        return $this->repository->getAllWithCategories();
    }

    /**
     * Récupérer un magazin par ID
     */
    public function GetMagazinById($id)
    {
        try {
            $magasin = $this->repository->getById($id);
            
            if (!$magasin) {
                return null;
            }
            
            Log::info("✅ Magazin trouvé: " . $magasin->id);
            return $magasin;
            
        } catch (\Exception $e) {
            Log::error("❌ Erreur dans GetMagazinById: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Supprimer un magazin
     */
    public function DeleteMagazin($id)
    {
        return $this->repository->delete($id);
    }
}