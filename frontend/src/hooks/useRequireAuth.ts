"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";

/**
 * Melindungi halaman: redirect ke /login jika belum login (menyertakan
 * tujuan asal via query ?redirect=), atau ke / jika role tidak sesuai.
 */
export function useRequireAuth(role?: Role) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Baca lokasi saat ini dari window (hanya di client) agar hook ini tidak
      // bergantung pada useSearchParams yang mewajibkan Suspense boundary.
      const target =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      router.replace(`/login?redirect=${encodeURIComponent(target)}`);
    } else if (role && user.role !== role) {
      router.replace("/");
    }
  }, [user, loading, role, router]);

  return { user, loading };
}
