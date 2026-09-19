"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(user.role === "admin" ? "/admin/orders" : "/orders");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Masuk</h1>
        <p className="mt-1 text-sm text-gray-500">Masuk ke akun Anda untuk memesan.</p>

        {error && (
          <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Belum punya akun?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Daftar
          </Link>
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-700">Akun demo (dari seeder):</p>
        <p>Admin: admin@cuci.test / password</p>
        <p>Pelanggan: pelanggan@cuci.test / password</p>
      </div>
    </div>
  );
}
