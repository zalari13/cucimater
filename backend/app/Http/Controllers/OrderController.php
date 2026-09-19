<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders)
    {
    }

    /**
     * Daftar pesanan milik pelanggan yang login.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()
            ->orders()
            ->with(['items', 'payment'])
            ->latest()
            ->paginate(10);

        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orders->create($request->user(), $request->validated());

        return (new OrderResource($order->load(['items', 'payment', 'user'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Order $order): OrderResource
    {
        $this->authorizeOwner($request, $order);

        return new OrderResource($order->load(['items', 'payment', 'user', 'confirmedBy']));
    }

    public function cancel(Request $request, Order $order): OrderResource
    {
        $this->authorizeOwner($request, $order);

        $order = $this->orders->cancel($order);

        return new OrderResource($order->load(['items', 'payment']));
    }

    private function authorizeOwner(Request $request, Order $order): void
    {
        abort_unless(
            $order->user_id === $request->user()->id || $request->user()->isAdmin(),
            403,
            'Anda tidak memiliki akses ke pesanan ini.'
        );
    }
}
