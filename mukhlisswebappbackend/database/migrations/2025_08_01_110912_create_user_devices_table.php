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
        Schema::create('user_devices', function (Blueprint $table) {
            $table->uuid('id')->default('gen_random_uuid()')->primary();
            $table->uuid('user_id')->nullable()->index('idx_user_devices_user_id');
            $table->text('device_id')->index('idx_user_devices_device_id');
            $table->text('device_name');
            $table->text('device_type');
            $table->text('platform');
            $table->text('app_version')->nullable();
            $table->timestampTz('last_active_at')->nullable()->default(DB::raw("now()"));
            $table->timestampTz('created_at')->nullable()->default(DB::raw("now()"));
            $table->boolean('is_active')->nullable()->default(true);
            $table->text('push_token')->nullable();
            $table->jsonb('device_info')->nullable();
            $table->text('session_token')->nullable();
            $table->boolean('force_logout')->nullable()->default(false);
            $table->timestampTz('logout_requested_at')->nullable();

            $table->index(['user_id', 'is_active'], 'idx_user_devices_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
