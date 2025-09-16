<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->timestampTz('created_at')->default(DB::raw("now()"));
            $table->text('name')->nullable();
            $table->text('nameFr')->nullable();
            $table->text('nameEn')->nullable();
            $table->text('nameAr')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
