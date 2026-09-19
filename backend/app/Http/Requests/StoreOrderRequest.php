<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'vehicle_type' => ['required', 'string', 'max:100'],
            'vehicle_brand' => ['nullable', 'string', 'max:100'],
            'vehicle_plate' => ['nullable', 'string', 'max:20'],
            'vehicle_criteria' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],

            // Layanan cuci
            'services' => ['nullable', 'array'],
            'services.*.name' => ['required_with:services', 'string', 'max:150'],
            'services.*.price' => ['required_with:services', 'numeric', 'min:0'],
            'services.*.quantity' => ['nullable', 'integer', 'min:1'],

            // Produk oli
            'oli_items' => ['nullable', 'array'],
            'oli_items.*.oli_product_id' => ['required_with:oli_items', 'integer', 'exists:oli_products,id'],
            'oli_items.*.quantity' => ['required_with:oli_items', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Minimal harus ada salah satu: layanan atau oli
    }
}
