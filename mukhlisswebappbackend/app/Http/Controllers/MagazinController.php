<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Magazin;
use App\Models\MagasinSubscription;
use App\Services\MagazinService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
class MagazinController extends Controller
{
    protected $magazinservice;

    public function __construct(MagazinService $magazinservice)
    {
        $this->magazinservice = $magazinservice;
    }

    public function storemagazin(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id' => 'nullable|string',
                'nom_enseigne' => 'nullable|string',
                'siret' => 'nullable|string',
                'adresse' => 'nullable|string',
                'ville' => 'nullable|string',
                'code_postal' => 'nullable|string',
                'telephone' => 'nullable|string',
                'email' => 'required|email',
                'geom' => 'nullable|string',
                'latitude' => 'nullable|numeric',
                'longitude' => 'nullable|numeric',
                'description' => 'nullable|string',
                'logoUrl' => 'nullable|file|mimes:pdf,jpeg,png',
                'Categorieid' => 'nullable|integer',
            ]);
            log::info("Validation des données pour la création du magazin", $request->all());
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            try {
                $magazinData = $request->only([
                    'nom_enseigne', 'siret', 'adresse', 'ville', 
                    'code_postal', 'telephone', 'description', 
                    'email', 'geom', 'Categorieid', 'latitude', 'longitude'
                ]);

                if ($request->hasFile('logoUrl')) {
                    $storage = app('supabase')->storage();
                    $logoUrl = $storage->uploadLogo(
                        'store-logo',
                        $request->file('logoUrl'),
                        'logos'
                    );
                    $magazinData['logoUrl'] = $logoUrl;
                }

                $result = $this->magazinservice->createUserWithMagazin(
                    $request->only(['email', 'password', 'nom_enseigne']), 
                    $magazinData
                );

                // Créer automatiquement un abonnement de test de 30 jours
                if (isset($result['magazin']) && isset($result['magazin']['id'])) {
                    try {
                        MagasinSubscription::create([
                            'magasin_id' => $result['magazin']['id'],
                            'magasin_name' => $result['magazin']['nom_enseigne'] ?? 'Nouveau magasin',
                            'contact_phone' => $request->telephone,
                            'contact_email' => $request->email,
                            'start_date' => now(),
                            'end_date' => now()->addDays(30),
                            'plan_type' => 'trial',
                            'plan_price' => 0,
                            'is_active' => true,
                            'status' => 'active',
                            'admin_notes' => 'Abonnement de test de 30 jours créé automatiquement',
                            'created_by' => null,
                        ]);
                        
                        Log::info("Abonnement de test de 30 jours créé pour le magasin: " . $result['magazin']['id']);
                    } catch (\Exception $e) {
                        Log::error("Erreur lors de la création de l'abonnement de test: " . $e->getMessage());
                        // On ne bloque pas la création du magasin si l'abonnement échoue
                    }
                }

                return response()->json([
                    'success' => true,
                    'data' => $result
                ], 201);

            } catch (\Exception $e) {
                Log::error("Erreur lors de la création du magazin : " . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la création du magazin'
                ], 500);
            }

        } catch (ModelNotFoundException $e) {
            Log::error("Mission non trouvée : " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ressource non trouvée'
            ], 404);
        }
    }

public function updateMagazin(Request $request)
{
    Log::info("Mise à jour du magazin : " . json_encode($request->all()));
    
    // Définir les règles de base
    $rules = [
        'id' => 'required|exists:magasins,id',
        'nom_enseigne' => 'required|string',
        'siret' => 'nullable|string',
        'telephone' => 'nullable|string|max:20',
        'email' => 'nullable|email|max:255',
        'adresse' => 'required|string|max:255',
        'ville' => 'required|string|max:100',
        'code_postal' => 'required|string|max:10',
        'Categorieid' => 'required|exists:categories,id',
        'geom' => 'nullable|string',
        'description' => 'nullable|string',
        'logoUrl' => 'nullable' // On gère la validation manuellement
    ];

    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors' => $validator->errors(),
            'input_data' => $request->all()
        ], 422);
    }

    try {
        $magazin = $this->magazinservice->GetMagazinById($request->id);
        
        // Mise à jour des champs de base
        $magazin->nom_enseigne = $request->nom_enseigne;
        $magazin->siret = $request->siret;
        $magazin->telephone = $request->telephone;
        $magazin->code_postal = $request->code_postal;
        $magazin->email = $request->email;
        $magazin->adresse = $request->adresse;
        $magazin->ville = $request->ville;
        $magazin->Categorieid = $request->Categorieid;
        $magazin->geom = $request->geom;
        $magazin->description = $request->description;
        
        // GESTION DU LOGO - NOUVELLE LOGIQUE
        if ($request->hasFile('logoUrl')) {
            // Cas 1: Nouveau fichier logo uploadé
            Log::info("Nouveau fichier logo détecté");
            
            $file = $request->file('logoUrl');
            
            // Validation du fichier
            $fileValidator = Validator::make(['logoUrl' => $file], [
                'logoUrl' => 'required|file|mimes:jpeg,png,jpg|max:2048'
            ]);
            
            if ($fileValidator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $fileValidator->errors()
                ], 422);
            }
            
            // Upload du nouveau logo
            $storage = app('supabase')->storage();
            $logoUrl = $storage->uploadLogo(
                'store-logo',
                $file,
                'logos'
            );
            $magazin->logoUrl = $logoUrl;
            
            Log::info("Nouveau logo uploadé: " . $logoUrl);
            
        } elseif ($request->has('logoUrl') && is_string($request->logoUrl)) {
            // Cas 2: URL existante (pas de changement de logo)
            Log::info("Logo existant conservé: " . $request->logoUrl);
            $magazin->logoUrl = $request->logoUrl;
        } else {
            // Cas 3: Pas de logo fourni, on garde l'existant
            Log::info("Aucun changement de logo");
            // $magazin->logoUrl reste inchangé
        }
        
        $magazin = $this->magazinservice->UpdateMagazin($magazin);
      
        return response()->json([
            'success' => true,
            'message' => 'Magazin mis à jour avec succès',
            'data' => $magazin
        ], 200);

    } catch (\Exception $e) {
        Log::error("Erreur lors de la mise à jour: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la mise à jour',
            'error' => $e->getMessage()
        ], 500);
    }
}

private function uploadLogoFile($file)
    {
        // Générer un nom de fichier unique
        $fileName = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        
        // Stocker le fichier dans le dossier 'public/logos'
        $path = $file->storeAs('logos', $fileName, 'public');
        
        // Retourner l'URL complète du fichier
        return Storage::disk('public')->url($path);
    }

public function getallmagazin()
{
    try {
        $magazins = $this->magazinservice->GetallMagazin();
            
        return response()->json([
            'success' => true,
            'data' => $magazins
        ], 200);
    } catch (\Exception $e) {
        // ... gestion des erreurs
    }
}

    public function getmagasinbyid($id)
    {
        try {
            $magasin = $this->magazinservice->GetMagazinById($id);
            return response()->json([
                'success' => true,
                'data' => $magasin
            ], 200);
        } catch (ModelNotFoundException $e) {
            Log::error("Magazin non trouvé : " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Magazin non trouvé'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération du magazin : " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur'
            ], 500);
        }
    }

    public function delete($id)
    {
        try {
            $this->magazinservice->DeleteMagazin($id);
            return response()->json([
                'success' => true,
                'message' => 'Magazin supprimé avec succès'
            ], 200);
        } catch (ModelNotFoundException $e) {
            Log::error("Magazin non trouvé : " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Magazin non trouvé'
            ], 404);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la suppression du magazin : " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur serveur'
            ], 500);
        }
    }
}