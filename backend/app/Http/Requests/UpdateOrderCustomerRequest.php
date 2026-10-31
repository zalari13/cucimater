<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Hanya admin yang boleh mengedit data pemesan.
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_email' => ['required', 'email:rfc,dns', 'max:150'],
            'customer_phone' => ['required', 'string', 'max:20'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'Nama pemesan wajib diisi.',
            'customer_email.required' => 'Email pemesan wajib diisi.',
            'customer_email.email' => 'Masukkan alamat email yang valid dan aktif.',
            'customer_phone.required' => 'Nomor telepon/WhatsApp wajib diisi.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('customer_email')) {
            $this->merge([
                'customer_email' => strtolower(trim($this->input('customer_email'))),
            ]);
        }
    }
}
