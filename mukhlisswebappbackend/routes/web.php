<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MagazinController;

Route::get('/', function () {
    return view('welcome');
});

