<?php

namespace App\Services;
use Illuminate\Support\Facades\Log;
use App\Repositories\Interfaces\CategoryRepositoryInterface;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class CategoryService {

    protected $repository;

    public function __construct(CategoryRepositoryInterface $repository) {
        $this->repository = $repository;
    }

    public function createCategory(array $data): Category {
        return $this->repository->createCategory($data);
    }

    public function getAllCategories(): array {
        return $this->repository->getAll();
    }

    public function getCategoryById($id): ?Category {
        return $this->repository->getById($id);
    }

    public function updateCategory(Category $category): bool {
        return $this->repository->update($category);
    }


public function deleteCategory($id): bool
{
    try {
        DB::beginTransaction();
        Log::info("Recherche de la catégorie", ['category_id' => $id]);
        
        $category = $this->repository->getById($id);
        
        if (!$category) {
            Log::warning("Catégorie non trouvée, aucune action nécessaire", ['category_id' => $id]);
            DB::commit(); // Rien à rollback car rien n'a été modifié
            return true; // Ou false selon votre logique métier
        }
        
        Log::info("Catégorie trouvée", ['category_id' => $category->id, 'category_name' => $category->name]);
        
        // Détacher les magazines
        if ($category->magazins()->exists()) {
            Log::info("Détachement des magazines", ['count' => $category->magazins()->count()]);
            $category->magazins()->update(['Categorieid' => null]);
        }
        
        // Supprimer la catégorie
        $result = $this->repository->delete($id);
        
        DB::commit();
        
        Log::info("Catégorie supprimée avec succès", ['category_id' => $id]);
        return $result;
        
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error("Erreur lors de la suppression", [
            'category_id' => $id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return false;
    }
}

}