<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            $table->decimal('amount', 12, 2)->default(0);
            $table->string('method')->default('cash'); // pembayaran tunai offline

            // unpaid -> belum bayar; paid -> uang tunai fisik diterima & divalidasi admin
            $table->enum('status', ['unpaid', 'paid'])->default('unpaid');

            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
