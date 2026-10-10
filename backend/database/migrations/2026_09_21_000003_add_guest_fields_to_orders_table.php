<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Pemesan tamu (tanpa login): user_id boleh null,
            // identitas pemesan disimpan langsung di order.
            $table->foreignId('user_id')->nullable()->change();
            $table->string('customer_name')->nullable()->after('user_id');
            $table->string('customer_email')->nullable()->after('customer_name');

            // Token akses publik agar tamu bisa membuka detail & resi tanpa login.
            $table->string('access_token', 64)->nullable()->unique()->after('customer_email');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['customer_name', 'customer_email', 'access_token']);
            // Catatan: user_id dikembalikan ke non-nullable hanya jika diperlukan.
        });
    }
};
