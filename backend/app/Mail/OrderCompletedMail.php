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

class OrderCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing(['items', 'payment', 'user']);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pesanan Selesai '.$this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order_completed',
            with: ['order' => $this->order],
        );
    }

    /**
     * Lampirkan resi digital (PDF) yang sudah lunas.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        // Lampirkan resi hanya bila sudah terbit (order dikonfirmasi/selesai).
        if (! $this->order->resi_number) {
            return [];
        }

        $pdf = Pdf::loadView('resi.receipt', [
            'order' => $this->order,
        ])->setPaper('a5');

        return [
            Attachment::fromData(
                fn () => $pdf->output(),
                'Resi-'.$this->order->resi_number.'.pdf'
            )->withMime('application/pdf'),
        ];
    }
}
