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
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('email')->nullable();
            $table->text('prenom')->nullable();
            $table->text('nom')->nullable();
            $table->text('telephone')->nullable();
            $table->timestampTz('created_at')->nullable()->default(DB::raw("now()"));
            $table->timestampTz('updated_at')->nullable()->default(DB::raw("now()"));
            $table->text('adresse')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
