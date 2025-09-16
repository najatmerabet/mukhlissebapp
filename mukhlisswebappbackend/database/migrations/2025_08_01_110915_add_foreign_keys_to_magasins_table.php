<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('magasins', function (Blueprint $table) {
            $table->foreign(['Categorieid'], 'magasins_Categorieid_fkey')->references(['id'])->on('categories')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['id'], 'magasins_id_fkey')->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('magasins', function (Blueprint $table) {
            $table->dropForeign('magasins_Categorieid_fkey');
            $table->dropForeign('magasins_id_fkey');
        });
    }
};
