<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Autentikasi opsional: jika request membawa token Sanctum yang valid,
 * user di-set ke request. Jika tidak ada/invalid, request tetap lanjut
 * sebagai tamu (tanpa error). Dipakai untuk endpoint yang terbuka untuk
 * tamu maupun pengguna login (mis. pembuatan pesanan).
 */
class OptionalSanctumAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->bearerToken()) {
            $user = Auth::guard('sanctum')->user();
            if ($user) {
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
