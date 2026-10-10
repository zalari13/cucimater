<?php

namespace App\Mail;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing(['items', 'payment', 'user']);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rincian Pembayaran Pesanan '.$this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order_invoice',
            with: [
                'order' => $this->order,
            ],
        );
    }

    /**
     * Lampirkan rincian pembayaran dalam bentuk PDF.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $pdf = Pdf::loadView('resi.invoice', [
            'order' => $this->order,
        ])->setPaper('a5');

        return [
            Attachment::fromData(
                fn () => $pdf->output(),
                'Rincian-'.$this->order->order_number.'.pdf'
            )->withMime('application/pdf'),
        ];
    }
}
