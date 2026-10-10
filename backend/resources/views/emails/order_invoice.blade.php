<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h2 style="color:#1b3366;">Terima kasih atas pesanan Anda</h2>

    <p>Halo {{ $order->customerName() }},</p>

    <p>Pesanan Anda telah kami terima dengan rincian berikut:</p>

    <table style="border-collapse: collapse;">
        <tr><td style="padding:2px 8px;color:#6b7280;">No. Pesanan</td><td style="padding:2px 8px;"><strong>{{ $order->order_number }}</strong></td></tr>
        <tr><td style="padding:2px 8px;color:#6b7280;">Kendaraan</td><td style="padding:2px 8px;">{{ $order->vehicle_type }}@if($order->vehicle_plate) ({{ $order->vehicle_plate }})@endif</td></tr>
        @if($order->scheduled_date)
        <tr><td style="padding:2px 8px;color:#6b7280;">Jadwal Cuci</td><td style="padding:2px 8px;">{{ $order->scheduled_date->format('d/m/Y') }} — Antrian #{{ $order->queue_number }}</td></tr>
        @endif
        <tr><td style="padding:2px 8px;color:#6b7280;">Total</td><td style="padding:2px 8px;"><strong>Rp {{ number_format($order->total, 0, ',', '.') }}</strong></td></tr>
    </table>

    <p style="margin-top:16px;">
        Rincian pembayaran lengkap terlampir dalam berkas PDF. Pembayaran dilakukan
        secara tunai di lokasi saat kendaraan dicuci.
    </p>

    <p style="color:#6b7280;font-size:13px;">
        Email ini dibuat otomatis oleh sistem {{ config('app.name') }}.
    </p>
</body>
</html>
