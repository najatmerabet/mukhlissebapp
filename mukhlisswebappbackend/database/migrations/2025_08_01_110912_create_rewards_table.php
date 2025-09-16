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
        Schema::create('rewards', function (Blueprint $table) {
            $table->uuid('id')->default('extensions.uuid_generate_v4()')->primary();
            $table->uuid('magasin_id')->nullable();
            $table->text('name');
            $table->integer('points_required');
            $table->integer('stock_quantity')->nullable();
            $table->boolean('is_active')->nullable()->default(true);
            $table->text('description')->nullable();
            $table->timestampTz('created_at')->nullable()->default(DB::raw("now()"));
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
};
