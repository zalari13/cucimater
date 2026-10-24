<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
    <h2 style="color:#166534;">Pesanan Anda Telah Selesai ✓</h2>

    <p>Halo {{ $order->customerName() }},</p>

    <p>Pesanan Anda telah <strong>selesai</strong> dan pembayaran sudah kami terima. Terima kasih!</p>

    <table style="border-collapse: collapse;">
        <tr><td style="padding:2px 8px;color:#6b7280;">No. Pesanan</td><td style="padding:2px 8px;"><strong>{{ $order->order_number }}</strong></td></tr>
        @if($order->resi_number)
        <tr><td style="padding:2px 8px;color:#6b7280;">No. Resi</td><td style="padding:2px 8px;">{{ $order->resi_number }}</td></tr>
        @endif
        <tr><td style="padding:2px 8px;color:#6b7280;">Kendaraan</td><td style="padding:2px 8px;">{{ $order->vehicle_type }}@if($order->vehicle_plate) ({{ $order->vehicle_plate }})@endif</td></tr>
        <tr><td style="padding:2px 8px;color:#6b7280;">Total</td><td style="padding:2px 8px;"><strong>Rp {{ number_format($order->total, 0, ',', '.') }}</strong></td></tr>
        @if($order->payment && $order->payment->status === 'paid')
        <tr><td style="padding:2px 8px;color:#6b7280;">Tunai Dibayar</td><td style="padding:2px 8px;">Rp {{ number_format($order->payment->paid_amount, 0, ',', '.') }}</td></tr>
        <tr><td style="padding:2px 8px;color:#6b7280;">Kembalian</td><td style="padding:2px 8px;">Rp {{ number_format($order->payment->change_amount, 0, ',', '.') }}</td></tr>
        @endif
    </table>

    <p style="margin-top:16px;">Resi digital (PDF) yang sudah lunas terlampir pada email ini.</p>

    <p style="color:#6b7280;font-size:13px;">
        Email ini dibuat otomatis oleh sistem {{ config('app.name') }}.
    </p>
</body>
</html>
