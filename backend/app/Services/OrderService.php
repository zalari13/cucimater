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

            // Jadwalkan ke antrian cuci harian jika ada layanan cuci.
            // (pesanan oli-only tidak memakai slot antrian)
            if (! empty($services)) {
                $this->assignQueueSlot($order);
            }

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
     * Tentukan tanggal & nomor antrian untuk pesanan berdasarkan kuota harian.
     * Mencari tanggal paling awal (mulai hari ini) yang kuotanya masih tersisa
     * untuk jenis kendaraan tersebut, lalu memberi nomor antrian berikutnya.
     */
    protected function assignQueueSlot(Order $order): void
    {
        $limit = $this->dailyLimitFor($order->vehicle_type);
        $activeStatuses = config('wash_queue.active_statuses', ['pending', 'confirmed', 'completed']);

        // Tanggal paling awal yang boleh dijadwalkan, memperhitungkan batas jam
        // pemesanan (cut-off). Jika sudah lewat cut-off, mulai dari besok.
        $date = $this->earliestSchedulableDate($order->vehicle_type);

        // Cari hari pertama yang masih punya slot (batasi pencarian 365 hari ke depan).
        for ($i = 0; $i < 365; $i++) {
            $used = Order::query()
                ->whereDate('scheduled_date', $date)
                ->whereRaw('LOWER(vehicle_type) = ?', [strtolower($order->vehicle_type)])
                ->whereIn('status', $activeStatuses)
                ->where('id', '!=', $order->id)
                ->count();

            if ($used < $limit) {
                $order->update([
                    'scheduled_date' => $date->toDateString(),
                    'queue_number' => $used + 1,
                ]);

                return;
            }

            $date = $date->copy()->addDay();
        }
    }

    /**
     * Kuota harian untuk sebuah jenis kendaraan (case-insensitive).
     */
    protected function dailyLimitFor(string $vehicleType): int
    {
        $limits = config('wash_queue.daily_limits', []);
        $key = strtolower($vehicleType);

        foreach ($limits as $type => $limit) {
            if (strtolower($type) === $key) {
                return (int) $limit;
            }
        }

        return (int) config('wash_queue.default_limit', 5);
    }

    /**
     * Tanggal paling awal yang boleh dijadwalkan untuk jenis kendaraan ini.
     * Jika saat ini (waktu WIB) sudah melewati batas jam (cut-off), hari ini
     * ditutup dan penjadwalan dimulai dari besok.
     */
    protected function earliestSchedulableDate(string $vehicleType): \Illuminate\Support\Carbon
    {
        $timezone = config('wash_queue.timezone', 'Asia/Jakarta');
        $nowLocal = now()->setTimezone($timezone);

        $cutoff = $this->cutoffTimeFor($vehicleType);

        if ($cutoff !== null) {
            [$hour, $minute] = array_map('intval', explode(':', $cutoff));
            $cutoffMoment = $nowLocal->copy()->setTime($hour, $minute, 0);

            if ($nowLocal->greaterThan($cutoffMoment)) {
                return now()->startOfDay()->addDay();
            }
        }

        return now()->startOfDay();
    }

    /**
     * Batas jam pemesanan ("HH:MM") untuk jenis kendaraan, atau null jika tanpa batas.
     */
    protected function cutoffTimeFor(string $vehicleType): ?string
    {
        $cutoffs = config('wash_queue.cutoff_times', []);
        $key = strtolower($vehicleType);

        foreach ($cutoffs as $type => $time) {
            if (strtolower($type) === $key) {
                return $time;
            }
        }

        return null;
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
    public function complete(Order $order, User $admin, float $paidAmount): Order
    {
        if ($order->status !== Order::STATUS_CONFIRMED) {
            throw ValidationException::withMessages([
                'status' => 'Hanya pesanan yang sudah dikonfirmasi yang dapat diselesaikan.',
            ]);
        }

        $total = (float) $order->total;

        if ($paidAmount < $total) {
            throw ValidationException::withMessages([
                'paid_amount' => 'Uang yang dibayar kurang dari total tagihan (Rp '.number_format($total, 0, ',', '.').').',
            ]);
        }

        $change = $paidAmount - $total;

        return DB::transaction(function () use ($order, $admin, $paidAmount, $change) {
            // Validasi & terima uang tunai fisik
            $payment = $order->payment;
            if ($payment) {
                $payment->update([
                    'status' => Payment::STATUS_PAID,
                    'paid_amount' => $paidAmount,
                    'change_amount' => $change,
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
