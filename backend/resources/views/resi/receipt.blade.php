<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Resi {{ $order->resi_number }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { font-size: 11px; color: #1f2937; margin: 0; }
        .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 10px; }
        .header h1 { margin: 0; font-size: 16px; }
        .header p { margin: 2px 0; font-size: 10px; color: #6b7280; }
        .meta { width: 100%; margin-bottom: 10px; }
        .meta td { vertical-align: top; padding: 1px 0; }
        .meta .label { color: #6b7280; width: 90px; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.items th, table.items td { border-bottom: 1px solid #e5e7eb; padding: 5px 4px; text-align: left; }
        table.items th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; }
        table.items td.num, table.items th.num { text-align: right; }
        .totals { width: 100%; margin-top: 8px; }
        .totals td { padding: 2px 4px; }
        .totals .grand { font-size: 13px; font-weight: bold; border-top: 2px solid #111827; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
        .paid { background: #dcfce7; color: #166534; }
        .unpaid { background: #fef9c3; color: #854d0e; }
        .footer { margin-top: 18px; text-align: center; font-size: 9px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ config('app.name') }}</h1>
        <p>Jasa Cuci Kendaraan &amp; Penjualan Oli</p>
        <p>RESI DIGITAL</p>
    </div>

    <table class="meta">
        <tr>
            <td class="label">No. Resi</td>
            <td><strong>{{ $order->resi_number }}</strong></td>
            <td class="label">Status</td>
            <td>
                @php $paid = $order->payment && $order->payment->status === 'paid'; @endphp
                <span class="badge {{ $paid ? 'paid' : 'unpaid' }}">
                    {{ $paid ? 'LUNAS' : 'BELUM BAYAR' }}
                </span>
            </td>
        </tr>
        <tr>
            <td class="label">No. Pesanan</td>
            <td>{{ $order->order_number }}</td>
            <td class="label">Tanggal</td>
            <td>{{ optional($order->confirmed_at ?? $order->created_at)->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td class="label">Pelanggan</td>
            <td>{{ $order->user->name }}</td>
            <td class="label">Telepon</td>
            <td>{{ $order->user->phone ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Kendaraan</td>
            <td colspan="3">
                {{ $order->vehicle_type }}
                @if($order->vehicle_brand) - {{ $order->vehicle_brand }} @endif
                @if($order->vehicle_plate) ({{ $order->vehicle_plate }}) @endif
            </td>
        </tr>
        @if($order->vehicle_criteria)
        <tr>
            <td class="label">Kriteria</td>
            <td colspan="3">{{ $order->vehicle_criteria }}</td>
        </tr>
        @endif
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Item</th>
                <th>Jenis</th>
                <th class="num">Harga</th>
                <th class="num">Qty</th>
                <th class="num">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item->name }}</td>
                <td>{{ $item->item_type === 'service' ? 'Jasa' : 'Oli' }}</td>
                <td class="num">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                <td class="num">{{ $item->quantity }}</td>
                <td class="num">Rp {{ number_format($item->subtotal, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="num" style="text-align: right; width: 80%;">Subtotal</td>
            <td class="num" style="text-align: right;">Rp {{ number_format($order->subtotal, 0, ',', '.') }}</td>
        </tr>
        <tr class="grand">
            <td class="num" style="text-align: right;">TOTAL</td>
            <td class="num" style="text-align: right;">Rp {{ number_format($order->total, 0, ',', '.') }}</td>
        </tr>
    </table>

    <div class="footer">
        <p>Pembayaran dilakukan secara tunai di lokasi. Terima kasih atas kepercayaan Anda.</p>
        <p>Resi ini dibuat otomatis oleh sistem pada {{ now()->format('d/m/Y H:i') }}.</p>
    </div>
</body>
</html>
