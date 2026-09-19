<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! ($request->user()?->isAdmin() ?? false)) {
            return response()->json(['message' => 'Akses ditolak. Hanya admin.'], 403);
        }

        return $next($request);
    }
}
