<?php
namespace App\Repositories;
use App\Models\Magazin;
use App\Repositories\Interfaces\MagazinRepositoryInterface;
class MagazinRepository implements  MagazinRepositoryInterface {

    public function createmagazin(array $data): Magazin{
        // Ensure the 'id' field is set to the user's UUID
        if (!isset($data['id'])) {
            throw new \InvalidArgumentException('User ID is required to create a magazin.');
        }
        return Magazin::create($data);
    }

    public function getAllWithCategories()
{
    return Magazin::with('category')
        ->select([
            'id as uuid',
            'nom_enseigne',
            'siret',
            'adresse',
            'ville',
            'code_postal',
            'telephone',
            'email',
            'geom',
            'description',
            'logoUrl',
            'Categorieid',
        ])
        ->get();
}

    public function getById($id): ?Magazin{
        return Magazin::with('category')->find($id);
    }
    
    public function update(Magazin $magazin): bool{
        return $magazin->save();
    }

    public function delete($id): bool{
        $magazin = $this->getById($id);
        return $magazin ? $magazin->delete() : false;
    }

}














?>