<?php

use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OliProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ResiController;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------------------
// Auth publik
// ---------------------------------------------------------------------------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Katalog oli publik (read-only)
Route::get('/oli-products', [OliProductController::class, 'index']);
Route::get('/oli-products/{oliProduct}', [OliProductController::class, 'show']);

// ---------------------------------------------------------------------------
// Terautentikasi (Sanctum)
// ---------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Pesanan pelanggan
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

    // Resi PDF (pelanggan pemilik atau admin)
    Route::get('/orders/{order}/resi', [ResiController::class, 'download']);

    // -----------------------------------------------------------------------
    // Admin
    // -----------------------------------------------------------------------
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Kelola katalog oli
        Route::post('/oli-products', [OliProductController::class, 'store']);
        Route::match(['put', 'patch'], '/oli-products/{oliProduct}', [OliProductController::class, 'update']);
        Route::delete('/oli-products/{oliProduct}', [OliProductController::class, 'destroy']);

        // Kelola pesanan
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
        Route::post('/orders/{order}/confirm', [AdminOrderController::class, 'confirm']);
        Route::post('/orders/{order}/complete', [AdminOrderController::class, 'complete']);
        Route::post('/orders/{order}/cancel', [AdminOrderController::class, 'cancel']);
    });
});
