<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderCustomerRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminOrderController extends Controller
{
    public function __construct(private readonly OrderService $orders)
    {
    }

    /**
     * Semua pesanan (untuk admin). Bisa difilter berdasarkan status.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()->with(['items', 'payment', 'user'])->latest();

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        return OrderResource::collection($query->paginate(15));
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['items', 'payment', 'user', 'confirmedBy']));
    }

    /**
     * Konfirmasi pesanan (generate resi).
     */
    public function confirm(Request $request, Order $order): OrderResource
    {
        $order = $this->orders->confirm($order, $request->user());

        return new OrderResource($order->load(['items', 'payment', 'user']));
    }

    /**
     * Selesaikan transaksi (validasi resi + terima uang tunai).
     */
    public function complete(Request $request, Order $order): OrderResource
    {
        $validated = $request->validate([
            'paid_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $order = $this->orders->complete($order, $request->user(), (float) $validated['paid_amount']);

        return new OrderResource($order->load(['items', 'payment', 'user']));
    }

    public function cancel(Order $order): OrderResource
    {
        $order = $this->orders->cancel($order);

        return new OrderResource($order->load(['items', 'payment', 'user']));
    }

    /**
     * Admin memperbaiki data pemesan (nama/email/HP) bila ada salah input.
     * Nilai disimpan di kolom customer_* pesanan (tidak mengubah akun user).
     */
    public function updateCustomer(UpdateOrderCustomerRequest $request, Order $order): OrderResource
    {
        $order->update([
            'customer_name' => $request->validated('customer_name'),
            'customer_email' => $request->validated('customer_email'),
            'customer_phone' => $request->validated('customer_phone'),
        ]);

        return new OrderResource($order->load(['items', 'payment', 'user']));
    }
}
