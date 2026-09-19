<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();

            // item_type: 'service' (jasa cuci) atau 'oli' (produk oli)
            $table->enum('item_type', ['service', 'oli']);
            $table->foreignId('oli_product_id')->nullable()->constrained('oli_products')->nullOnDelete();

            $table->string('name');            // snapshot nama item saat pemesanan
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('subtotal', 12, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
