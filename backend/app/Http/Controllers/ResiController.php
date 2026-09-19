<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ResiController extends Controller
{
    /**
     * Tampilkan / unduh resi digital PDF.
     * Hanya untuk pesanan yang sudah dikonfirmasi (punya resi_number).
     * (flowmap: "Tampilkan dan Unduh Resi Digital PDF")
     */
    public function download(Request $request, Order $order): Response
    {
        abort_unless(
            $order->user_id === $request->user()->id || $request->user()->isAdmin(),
            403,
            'Anda tidak memiliki akses ke resi ini.'
        );

        abort_if(
            $order->resi_number === null,
            404,
            'Resi belum tersedia. Pesanan belum dikonfirmasi admin.'
        );

        $order->load(['items', 'payment', 'user']);

        $pdf = Pdf::loadView('resi.receipt', [
            'order' => $order,
        ])->setPaper('a5');

        $filename = $order->resi_number.'.pdf';

        // stream = tampil di browser; ganti ke ->download($filename) untuk paksa unduh
        return $pdf->stream($filename);
    }
}
