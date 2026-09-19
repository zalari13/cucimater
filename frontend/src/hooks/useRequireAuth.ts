"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";

/**
 * Melindungi halaman: redirect ke /login jika belum login,
 * atau ke / jika role tidak sesuai.
 */
export function useRequireAuth(role?: Role) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (role && user.role !== role) {
      router.replace("/");
    }
  }, [user, loading, role, router]);

  return { user, loading };
}
