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

// Pemesanan publik (tamu tanpa login) + akses detail/resi via access_token.
// auth.optional: jika ada token valid, user di-resolve; jika tidak, tetap jalan sebagai tamu.
Route::post('/orders', [OrderController::class, 'store'])->middleware('auth.optional');
Route::get('/public/orders/{order:access_token}', [OrderController::class, 'showPublic']);
Route::get('/public/orders/{order:access_token}/resi', [ResiController::class, 'downloadPublic']);

// ---------------------------------------------------------------------------
// Terautentikasi (Sanctum)
// ---------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Pesanan pelanggan
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

    // Resi PDF (pelanggan pemilik atau admin)
    Route::get('/orders/{order}/resi', [ResiController::class, 'download']);

    // -----------------------------------------------------------------------
    // Panel staf (prefix /admin)
    // -----------------------------------------------------------------------
    Route::prefix('admin')->group(function () {
        // Kelola katalog oli — KHUSUS ADMIN
        Route::middleware('admin')->group(function () {
            Route::post('/oli-products', [OliProductController::class, 'store']);
            Route::match(['put', 'patch'], '/oli-products/{oliProduct}', [OliProductController::class, 'update']);
            Route::delete('/oli-products/{oliProduct}', [OliProductController::class, 'destroy']);

            // Edit data pemesan (perbaiki salah input nama/email/HP) — KHUSUS ADMIN
            Route::patch('/orders/{order}/customer', [AdminOrderController::class, 'updateCustomer']);
        });

        // Kelola pesanan — admin ATAU kasir
        Route::middleware('staff')->group(function () {
            Route::get('/orders', [AdminOrderController::class, 'index']);
            Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
            Route::post('/orders/{order}/confirm', [AdminOrderController::class, 'confirm']);
            Route::post('/orders/{order}/complete', [AdminOrderController::class, 'complete']);
            Route::post('/orders/{order}/cancel', [AdminOrderController::class, 'cancel']);
        });
    });
});
