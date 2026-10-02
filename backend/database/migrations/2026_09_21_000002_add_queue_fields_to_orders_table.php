<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Tanggal pesanan dijadwalkan untuk dicuci (antrian harian)
            $table->date('scheduled_date')->nullable()->after('status');
            // Nomor antrian pada tanggal tersebut (1 = pertama)
            $table->unsignedInteger('queue_number')->nullable()->after('scheduled_date');

            $table->index(['scheduled_date', 'vehicle_type']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['scheduled_date', 'vehicle_type']);
            $table->dropColumn(['scheduled_date', 'queue_number']);
        });
    }
};
