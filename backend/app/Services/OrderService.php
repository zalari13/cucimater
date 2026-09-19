<?php

namespace App\Services;

use App\Models\OliProduct;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Buat pesanan baru dari pelanggan.
     * Status awal: pending (sesuai flowmap: "Informasi Pesanan Masuk (Pending)").
     *
     * @param  array<string, mixed>  $data
     */
    public function create(User $customer, array $data): Order
    {
        $services = $data['services'] ?? [];
        $oliItems = $data['oli_items'] ?? [];

        if (empty($services) && empty($oliItems)) {
            throw ValidationException::withMessages([
                'items' => 'Pesanan harus memiliki minimal satu layanan cuci atau produk oli.',
            ]);
        }

        return DB::transaction(function () use ($customer, $data, $services, $oliItems) {
            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'user_id' => $customer->id,
                'vehicle_type' => $data['vehicle_type'],
                'vehicle_brand' => $data['vehicle_brand'] ?? null,
                'vehicle_plate' => $data['vehicle_plate'] ?? null,
                'vehicle_criteria' => $data['vehicle_criteria'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => Order::STATUS_PENDING,
                'subtotal' => 0,
                'total' => 0,
            ]);

            $subtotal = 0;

            // Layanan cuci
            foreach ($services as $service) {
                $qty = (int) ($service['quantity'] ?? 1);
                $price = (float) $service['price'];
                $lineTotal = $price * $qty;
                $subtotal += $lineTotal;

                $order->items()->create([
                    'item_type' => 'service',
                    'name' => $service['name'],
                    'price' => $price,
                    'quantity' => $qty,
                    'subtotal' => $lineTotal,
                ]);
            }

            // Produk oli (kurangi stok)
            foreach ($oliItems as $item) {
                $qty = (int) $item['quantity'];
                /** @var OliProduct $product */
                $product = OliProduct::lockForUpdate()->findOrFail($item['oli_product_id']);

                if (! $product->is_active) {
                    throw ValidationException::withMessages([
                        'oli_items' => "Produk {$product->name} tidak tersedia.",
                    ]);
                }

                if ($product->stock < $qty) {
                    throw ValidationException::withMessages([
                        'oli_items' => "Stok {$product->name} tidak mencukupi (tersisa {$product->stock}).",
                    ]);
                }

                $product->decrement('stock', $qty);

                $price = (float) $product->price;
                $lineTotal = $price * $qty;
                $subtotal += $lineTotal;

                $order->items()->create([
                    'item_type' => 'oli',
                    'oli_product_id' => $product->id,
                    'name' => $product->name,
                    'price' => $price,
                    'quantity' => $qty,
                    'subtotal' => $lineTotal,
                ]);
            }

            $order->update([
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);

            // Buat payment record (belum dibayar)
            $order->payment()->create([
                'amount' => $subtotal,
                'method' => 'cash',
                'status' => Payment::STATUS_UNPAID,
            ]);

            return $order->fresh(['items', 'payment', 'user']);
        });
    }

    /**
     * Admin mengonfirmasi pesanan.
     * (flowmap: "Input Data Konfirmasi Pesanan" -> "Proses Konfirmasi Pesanan" -> "Resi Digital PDF")
     */
    public function confirm(Order $order, User $admin): Order
    {
        if ($order->status !== Order::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'status' => 'Hanya pesanan berstatus pending yang dapat dikonfirmasi.',
            ]);
        }

        $order->update([
            'status' => Order::STATUS_CONFIRMED,
            'confirmed_by' => $admin->id,
            'confirmed_at' => now(),
            'resi_number' => $this->generateResiNumber(),
        ]);

        return $order->fresh(['items', 'payment', 'user', 'confirmedBy']);
    }

    /**
     * Admin menyelesaikan transaksi.
     * (flowmap: "Validasi Resi Digital PDF" + "Terima Uang Tunai Fisik" -> "Input Data Transaksi Selesai")
     */
    public function complete(Order $order, User $admin): Order
    {
        if ($order->status !== Order::STATUS_CONFIRMED) {
            throw ValidationException::withMessages([
                'status' => 'Hanya pesanan yang sudah dikonfirmasi yang dapat diselesaikan.',
            ]);
        }

        return DB::transaction(function () use ($order, $admin) {
            // Validasi & terima uang tunai fisik
            $payment = $order->payment;
            if ($payment) {
                $payment->update([
                    'status' => Payment::STATUS_PAID,
                    'validated_by' => $admin->id,
                    'paid_at' => now(),
                ]);
            }

            $order->update([
                'status' => Order::STATUS_COMPLETED,
                'completed_at' => now(),
            ]);

            return $order->fresh(['items', 'payment', 'user', 'confirmedBy']);
        });
    }

    public function cancel(Order $order): Order
    {
        if (in_array($order->status, [Order::STATUS_COMPLETED, Order::STATUS_CANCELLED], true)) {
            throw ValidationException::withMessages([
                'status' => 'Pesanan ini tidak dapat dibatalkan.',
            ]);
        }

        return DB::transaction(function () use ($order) {
            // Kembalikan stok oli
            foreach ($order->items()->where('item_type', 'oli')->get() as $item) {
                if ($item->oli_product_id) {
                    OliProduct::where('id', $item->oli_product_id)->increment('stock', $item->quantity);
                }
            }

            $order->update(['status' => Order::STATUS_CANCELLED]);

            return $order->fresh(['items', 'payment', 'user']);
        });
    }

    protected function generateOrderNumber(): string
    {
        return 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
    }

    protected function generateResiNumber(): string
    {
        return 'RESI-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
    }
}
