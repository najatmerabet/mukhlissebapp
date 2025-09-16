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
        Schema::create('offers', function (Blueprint $table) {
            $table->uuid('id')->default('extensions.uuid_generate_v4()')->primary();
            $table->uuid('magasin_id')->nullable();
            $table->float('min_amount');
            $table->integer('points_given');
            $table->boolean('is_active')->nullable()->default(true);
            $table->timestamp('created_at')->nullable()->default(DB::raw("now()"));

            $table->index(['magasin_id', 'is_active', 'min_amount'], 'idx_offers_active');
            $table->index(['magasin_id', 'is_active'], 'idx_offers_magasin_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
