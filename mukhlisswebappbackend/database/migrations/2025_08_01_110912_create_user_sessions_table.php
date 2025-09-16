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
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->uuid('id')->default('gen_random_uuid()')->primary();
            $table->uuid('user_id')->nullable()->index('idx_user_sessions_user_id');
            $table->text('device_id')->index('idx_user_sessions_device');
            $table->text('session_token')->index('idx_user_sessions_token');
            $table->timestampTz('created_at')->nullable()->default(DB::raw("now()"));
            $table->timestampTz('last_activity')->nullable()->default(DB::raw("now()"));
            $table->boolean('is_active')->nullable()->default(true);
            $table->boolean('force_logout')->nullable()->default(false);

            $table->unique(['session_token'], 'user_sessions_session_token_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};
