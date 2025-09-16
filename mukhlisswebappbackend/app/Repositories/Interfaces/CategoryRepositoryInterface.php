<?php
namespace App\Repositories\Interfaces;

use App\Models\Category;


interface CategoryRepositoryInterface
{
    public function createCategory(array $data): Category;

    public function getAll(): array;

    public function getById($id): ?Category;

    public function update(Category $category): bool;

    public function delete($id): bool;
}







?>