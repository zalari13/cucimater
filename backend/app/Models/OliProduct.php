<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OliProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'brand',
        'description',
        'price',
        'stock',
        'unit',
        'image_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
