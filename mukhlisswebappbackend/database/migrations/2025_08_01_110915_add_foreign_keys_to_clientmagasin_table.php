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
        Schema::table('clientmagasin', function (Blueprint $table) {
            $table->foreign(['client_id'], 'clientmagasin_client_id_fkey')->references(['id'])->on('clients')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['magasin_id'], 'clientmagazin_magazin_id_fkey')->references(['id'])->on('magasins')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientmagasin', function (Blueprint $table) {
            $table->dropForeign('clientmagasin_client_id_fkey');
            $table->dropForeign('clientmagazin_magazin_id_fkey');
        });
    }
};
