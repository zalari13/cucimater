"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-700">
          CuciKu <span className="text-gray-400 font-normal">&amp; Oli</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/catalog" className="hover:text-blue-700">
            Katalog Oli
          </Link>

          {loading ? null : user ? (
            <>
              {user.role === "pelanggan" && (
                <>
                  <Link href="/orders/new" className="hover:text-blue-700">
                    Pesan
                  </Link>
                  <Link href="/orders" className="hover:text-blue-700">
                    Pesanan Saya
                  </Link>
                </>
              )}
              {user.role === "admin" && (
                <>
                  <Link href="/admin/orders" className="hover:text-blue-700">
                    Kelola Pesanan
                  </Link>
                  <Link href="/admin/products" className="hover:text-blue-700">
                    Kelola Oli
                  </Link>
                </>
              )}
              <span className="text-gray-500">
                {user.name}
                <span className="ml-1 text-xs uppercase text-blue-600">({user.role})</span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded bg-gray-100 px-3 py-1.5 hover:bg-gray-200"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-700">
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
