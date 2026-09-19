<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\OliProduct
 */
class OliProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'brand' => $this->brand,
            'description' => $this->description,
            'price' => (float) $this->price,
            'stock' => $this->stock,
            'unit' => $this->unit,
            'image_url' => $this->image_url,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
        ];
    }
}
