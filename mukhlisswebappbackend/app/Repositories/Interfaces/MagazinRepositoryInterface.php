<?php


namespace App\Repositories\Interfaces;
use  App\Models\Magazin ;
interface MagazinRepositoryInterface 
{
    public function createmagazin(array $data): Magazin;
    public function getAllWithCategories();
    public function getById($id): ?Magazin;
    public function update(Magazin $magazin): bool;
    public function delete($id): bool;
    

}



?>