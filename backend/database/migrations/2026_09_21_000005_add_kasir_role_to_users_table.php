<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Perluas enum role: tambah 'kasir'.
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','kasir','pelanggan') NOT NULL DEFAULT 'pelanggan'");
    }

    public function down(): void
    {
        // Kembalikan akun kasir ke pelanggan sebelum mempersempit enum.
        DB::table('users')->where('role', 'kasir')->update(['role' => 'pelanggan']);
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','pelanggan') NOT NULL DEFAULT 'pelanggan'");
    }
};
