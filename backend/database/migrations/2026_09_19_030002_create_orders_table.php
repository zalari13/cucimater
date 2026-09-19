<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Kriteria kendaraan dari pelanggan (dari flowmap: "Input Data Pesanan dan Kriteria Kendaraan")
            $table->string('vehicle_type');            // mobil / motor
            $table->string('vehicle_brand')->nullable();
            $table->string('vehicle_plate')->nullable();
            $table->text('vehicle_criteria')->nullable(); // catatan/kriteria tambahan

            $table->text('notes')->nullable();

            // Alur status sesuai flowmap
            // pending    -> pesanan masuk, menunggu konfirmasi admin
            // confirmed  -> admin konfirmasi, resi PDF di-generate
            // completed  -> transaksi selesai (resi & uang tunai divalidasi)
            // cancelled  -> dibatalkan
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled'])
                ->default('pending');

            $table->string('resi_number')->nullable()->unique();

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
