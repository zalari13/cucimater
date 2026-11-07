"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Keluar dari akun, lalu kembali ke beranda sebagai pengunjung (belum login).
export function useLogout() {
  const { logout } = useAuth();
  const router = useRouter();

  return async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  };
}