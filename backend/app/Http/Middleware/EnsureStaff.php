<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hanya staf operasional (admin atau kasir) yang boleh lanjut.
 * Dipakai untuk pengelolaan pesanan (konfirmasi, pembayaran, dsb).
 */
class EnsureStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! ($request->user()?->isStaff() ?? false)) {
            return response()->json(['message' => 'Akses ditolak. Hanya staf (admin/kasir).'], 403);
        }

        return $next($request);
    }
}
