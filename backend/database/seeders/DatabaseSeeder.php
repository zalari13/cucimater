<?php

namespace Database\Seeders;

use App\Models\OliProduct;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin
        User::updateOrCreate(
            ['email' => 'admin@cuci.test'],
            [
                'name' => 'Admin Cuci',
                'phone' => '081234567890',
                'role' => 'admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Pelanggan contoh
        User::updateOrCreate(
            ['email' => 'pelanggan@cuci.test'],
            [
                'name' => 'Budi Pelanggan',
                'phone' => '081298765432',
                'role' => 'pelanggan',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Katalog oli
        $olis = [
            ['name' => 'Oli Mesin Mesran 10W-40', 'brand' => 'Pertamina', 'price' => 55000, 'stock' => 50, 'unit' => 'botol', 'description' => 'Oli mesin mineral untuk motor 4-tak.', 'image_url' => '/images/products/mesran.svg'],
            ['name' => 'Oli Fastron Techno 10W-40', 'brand' => 'Pertamina', 'price' => 95000, 'stock' => 40, 'unit' => 'liter', 'description' => 'Oli semi sintetik performa tinggi.', 'image_url' => '/images/products/fastron.svg'],
            ['name' => 'Shell Helix HX7 10W-40', 'brand' => 'Shell', 'price' => 110000, 'stock' => 30, 'unit' => 'liter', 'description' => 'Oli mesin sintetik untuk mobil.', 'image_url' => '/images/products/shell-helix.svg'],
            ['name' => 'Castrol Power1 10W-30', 'brand' => 'Castrol', 'price' => 85000, 'stock' => 35, 'unit' => 'botol', 'description' => 'Oli motor sport dengan Power Release Formula.', 'image_url' => '/images/products/castrol-power1.svg'],
            ['name' => 'Motul 5100 15W-50', 'brand' => 'Motul', 'price' => 130000, 'stock' => 20, 'unit' => 'liter', 'description' => 'Oli semi sintetik Ester untuk motor besar.', 'image_url' => '/images/products/motul-5100.svg'],
            ['name' => 'Yamalube Super Matic', 'brand' => 'Yamalube', 'price' => 48000, 'stock' => 60, 'unit' => 'botol', 'description' => 'Oli khusus motor matic Yamaha.', 'image_url' => '/images/products/yamalube.svg'],
        ];

        foreach ($olis as $oli) {
            OliProduct::updateOrCreate(
                ['name' => $oli['name']],
                array_merge($oli, ['is_active' => true])
            );
        }
    }
}
