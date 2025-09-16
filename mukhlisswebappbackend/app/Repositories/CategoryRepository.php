<?php
namespace App\Repositories;
use App\Models\Category;
use App\Repositories\Interfaces\CategoryRepositoryInterface;


class CategoryRepository implements CategoryRepositoryInterface {

    public function createCategory(array $data): Category {
       
       
        return Category::create($data);
    }

    public function getAllCategoriesWithMagazins(): array {
        // Eager load the magazins relationship to avoid N+1 query problem
        return Category::with('magazins')->get()->toArray();
    }

    public function getAll(): array {
        return Category::all()->toArray();
    }

    public function getById($id): ?Category {
        return Category::find($id);
    }

    public function update(Category $category): bool {
        return $category->save();
    }

    public function delete($id): bool {
        $category = $this->getById($id);
        return $category ? $category->delete() : false;
    }
}