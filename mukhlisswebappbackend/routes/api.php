<?php
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MagazinController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ClientsController ;


Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register']);
  Route::post('/magazinadd', [MagazinController::class, 'storemagazin']);
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/magazinget', [MagazinController::class, 'getallmagazin']);
  
    Route::get('/magazin/{id}', [MagazinController::class, 'getmagasinbyid']);
    Route::post('/magazinupdate/{id}', [MagazinController::class, 'updatemagazin']);
    Route::get('/users', [AuthController::class, 'getallusers']);
    Route::get('/categoryget',[CategoryController::class, 'index']);
    Route::delete('magazindelete/{id}',[MagazinController::class , 'delete']);
    Route::post('/categoryadd',[CategoryController::class, 'store']);
    Route::get('/category/{id}', [CategoryController::class, 'show']);
    Route::post('/categoryupdate/{id}', [CategoryController::class, 'update']);
    Route::delete('/categorydelete/{id}', [CategoryController::class, 'destroy']);
    Route::get('/allclients', [ClientsController::class,'index']);
});
?>
