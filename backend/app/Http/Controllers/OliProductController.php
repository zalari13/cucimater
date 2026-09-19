<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOliProductRequest;
use App\Http\Resources\OliProductResource;
use App\Models\OliProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OliProductController extends Controller
{
    /**
     * Katalog oli. Publik hanya melihat produk aktif; admin melihat semua.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = OliProduct::query()->latest();

        if (! ($request->user()?->isAdmin() ?? false)) {
            $query->where('is_active', true);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        return OliProductResource::collection($query->paginate(12));
    }

    public function show(OliProduct $oliProduct): OliProductResource
    {
        return new OliProductResource($oliProduct);
    }

    public function store(StoreOliProductRequest $request): JsonResponse
    {
        $product = OliProduct::create($request->validated());

        return (new OliProductResource($product))
            ->response()
            ->setStatusCode(201);
    }

    public function update(StoreOliProductRequest $request, OliProduct $oliProduct): OliProductResource
    {
        $oliProduct->update($request->validated());

        return new OliProductResource($oliProduct);
    }

    public function destroy(OliProduct $oliProduct): JsonResponse
    {
        $oliProduct->delete();

        return response()->json(['message' => 'Produk oli dihapus.']);
    }
}
