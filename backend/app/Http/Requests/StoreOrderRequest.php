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
            'vehicle_plate' => ['nullable', 'string', 'max:20', 'regex:/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/i'],
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

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_plate.regex' => 'Format plat nomor tidak valid. Contoh: B 1234 XYZ.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Normalisasi plat: huruf besar & rapikan spasi ganda.
        if ($this->filled('vehicle_plate')) {
            $this->merge([
                'vehicle_plate' => strtoupper(trim(preg_replace('/\s+/', ' ', $this->input('vehicle_plate')))),
            ]);
        }
    }
}
