<?php

namespace App\Http\Controllers;
 use App\Services\CategoryService;
use Illuminate\Http\Request;
use App\Models\Category;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index()
    {
        $categories = $this->categoryService->getAllCategories();
        return response()->json($categories);
    }

    public function show($id)
    {
        $category = $this->categoryService->getCategoryById($id);
        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }
        return response()->json($category);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'nameFr' => 'nullable|string|max:255',
            'nameAr' => 'nullable|string|max:255',
            'nameEn' => 'nullable|string|max:255',
        ]);

        $category = $this->categoryService->createCategory($data);
        return response()->json($category, 201);
    }

    public function update(Request $request)
{
    $data = $request->validate([
        'id' => 'required',
        'name' => 'sometimes|required|string|max:255',
        'nameFr' => 'nullable|string|max:255',
        'nameAr' => 'nullable|string|max:255',
        'nameEn' => 'nullable|string|max:255',
    ]);

    // Extract the id from the validated data
    $id = $data['id'];

    $category = $this->categoryService->getCategoryById($id);
    if (!$category) {
        return response()->json(['message' => 'Category not found'], 404);
    }

    foreach ($data as $key => $value) {
        if ($value !== null) {
            $category->$key = $value;
        }
    }

    if ($this->categoryService->updateCategory($category)) {
        return response()->json($category);
    } else {
        return response()->json(['message' => 'Failed to update category'], 500);
    }
}

  public function destroy($id)
{
    try {
        if ($this->categoryService->deleteCategory($id)) {
            return response()->json(['message' => 'Category deleted successfully']);
        } else {
            return response()->json(['message' => 'Failed to delete category'], 500);
        }
    } catch (\Exception $e) {
        return response()->json([
            'message' => $e->getMessage()
        ], 422); // Use 422 for validation/business logic errors
    }
}

}













?>