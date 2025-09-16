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
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->bigInteger('id')->primary();
            $table->timestampTz('created_at')->default(DB::raw("now()"));
            $table->uuid('user_id')->nullable()->default('gen_random_uuid()');
            $table->text('email')->nullable();
            $table->text('message')->nullable();
            $table->text('status')->nullable();
            $table->text('response')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestampTz('updated_at')->nullable()->default(DB::raw("now()"));
            $table->text('sujet')->nullable();
            $table->text('priority')->nullable();
            $table->text('category')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
