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
        Schema::create('clientmagasin', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->timestampTz('created_at')->default(DB::raw("now()"));
            $table->uuid('client_id')->nullable();
            $table->uuid('magasin_id')->nullable();
            $table->smallInteger('cumulpoint')->nullable();
            $table->float('solde')->nullable();

            $table->unique(['client_id', 'magasin_id'], 'clientmagasin_client_magasin_key');
            $table->index(['client_id', 'magasin_id'], 'idx_clientmagasin_client_magasin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientmagasin');
    }
};
