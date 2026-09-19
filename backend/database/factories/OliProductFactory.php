<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\OliProduct>
 */
class OliProductFactory extends Factory
{
    public function definition(): array
    {
        $brands = ['Pertamina', 'Shell', 'Castrol', 'Motul', 'Yamalube', 'AHM'];

        return [
            'name' => 'Oli '.fake()->randomElement(['Mesin', 'Gardan', 'Transmisi']).' '.fake()->randomElement(['10W-40', '10W-30', '20W-50', '5W-30']),
            'brand' => fake()->randomElement($brands),
            'description' => fake()->sentence(10),
            'price' => fake()->numberBetween(35, 150) * 1000,
            'stock' => fake()->numberBetween(5, 100),
            'unit' => fake()->randomElement(['botol', 'liter']),
            'is_active' => true,
        ];
    }
}
