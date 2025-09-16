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
        Schema::create('magasins', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('nom_enseigne');
            $table->text('siret')->unique('magasins_siret_key');
            $table->text('adresse');
            $table->text('ville')->nullable();
            $table->text('code_postal')->nullable();
            $table->text('telephone');
            $table->text('description')->nullable();
            $table->timestampTz('created_at')->nullable()->default(DB::raw("now()"));
            $table->bigInteger('Categorieid')->nullable();
            $table->geometry('geom', 'point', 4326)->nullable();
            $table->text('logoUrl')->nullable();
            $table->string('email')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('magasins');
    }
};
