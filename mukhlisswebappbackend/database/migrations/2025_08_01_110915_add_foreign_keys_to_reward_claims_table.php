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
        Schema::table('reward_claims', function (Blueprint $table) {
            $table->foreign(['client_id'], 'clientoffre_client_id_fkey')->references(['id'])->on('clients')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['reward_id'], 'reward_claims_reward_id_fkey')->references(['id'])->on('rewards')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reward_claims', function (Blueprint $table) {
            $table->dropForeign('clientoffre_client_id_fkey');
            $table->dropForeign('reward_claims_reward_id_fkey');
        });
    }
};
