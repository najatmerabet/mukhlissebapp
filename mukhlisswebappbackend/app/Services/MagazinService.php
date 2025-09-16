<?php
namespace App\Services ;
use Illuminate\Support\Facades\Log; 
use App\Repositories\Interfaces\MagazinRepositoryInterface;
use App\Models\Magazin; // Add this line
class MagazinService {

protected $repository;

public function __construct (MagazinRepositoryInterface $repository){
    $this->repository =$repository;
}

 public function createUserWithMagazin(array $userData, array $magazinData)
{
    // 1. Create user in Supabase Auth
    $auth = app('supabase')->auth();
    
    $response = $auth->createUser([
        'email' => $userData['email'],
        'password' => $userData['password'],
        'user_metadata' => [
            'name' => $userData['nom_enseigne']
        ]
    ]);
    
    // Check if response was successful
    if ($response->successful()) {
        $userId = $response->json()['id']; // Get user ID from response
        
        // 2. Create related magazin
        $magazin = $this->createMagazin($userId, $magazinData);
        
        return [
            'user' => $response->json(),
            'magazin' => $magazin
        ];
    }
    
    throw new \Exception('Failed to create user: ' . $response->body());
}

public function UpdateMagazin(Magazin $magazinData)
{
    // 2. Update related magazin
    $this->repository->update($magazinData);

}



    protected function createMagazin(string $userId, array $data)
{
    // Vérifier d'abord si le magazin existe déjà
    if (Magazin::where('id', $userId)->exists()) {
        throw new \Exception('Un magazin existe déjà pour cet utilisateur');
    }

    // Préparer les données avec l'ID utilisateur
    $data['id'] = $userId;
    $data['created_at'] = now();

    // Créer via le repository
    try {
        return $this->repository->createmagazin($data);
    } catch (\Exception $e) {
        // Supprimer le logo uploadé si la création échoue
        if (isset($data['logoUrl'])) {
            try {
                $path = parse_url($data['logoUrl'], PHP_URL_PATH);
                $fileName = basename($path);
                // app('supabase')->storage()->deleteLogo('store-logo', 'logos', $fileName);
            } catch (\Exception $e) {
                Log::error("Erreur suppression logo: ".$e->getMessage());
            }
        }
        throw $e;
    }
}

public function GetallMagazin(){
    return $this->repository->getAllWithCategories();
}



public function GetMagazinById($id){
    try {
        // 1. Récupérer le magazin depuis la table Database
        $magasin = $this->repository->getById($id);
        
        if (!$magasin) {
            return null;
        }
        
        // 2. Debug: Vérifier la configuration
        Log::info("Magazin trouvé: " . $magasin->id);
        return $magasin;
        
    } catch (\Exception $e) {
        Log::error("Erreur dans GetMagazinById: " . $e->getMessage());
        throw $e;
    }
}

public function DeleteMagazin($id){
    return $this->repository->delete($id);

}
}
?>