<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Order
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'resi_number' => $this->resi_number,
            'status' => $this->status,
            'vehicle_type' => $this->vehicle_type,
            'vehicle_brand' => $this->vehicle_brand,
            'vehicle_plate' => $this->vehicle_plate,
            'vehicle_criteria' => $this->vehicle_criteria,
            'notes' => $this->notes,
            'subtotal' => (float) $this->subtotal,
            'total' => (float) $this->total,
            'confirmed_at' => $this->confirmed_at,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
            'customer' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payment' => $this->whenLoaded('payment', fn () => [
                'id' => $this->payment?->id,
                'amount' => (float) ($this->payment?->amount ?? 0),
                'method' => $this->payment?->method,
                'status' => $this->payment?->status,
                'paid_at' => $this->payment?->paid_at,
            ]),
        ];
    }
}
