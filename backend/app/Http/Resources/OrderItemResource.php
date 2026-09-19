<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\OrderItem
 */
class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'item_type' => $this->item_type,
            'oli_product_id' => $this->oli_product_id,
            'name' => $this->name,
            'price' => (float) $this->price,
            'quantity' => $this->quantity,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
