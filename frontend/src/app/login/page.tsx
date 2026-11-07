"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Icon } from "@/components/Icon";

const BENEFITS = [
  { icon: "clock", text: "Pantau antrean dan status pesanan real-time" },
  { icon: "shield", text: "Resi digital PDF tersedia kapan saja" },
  { icon: "drop", text: "Pesan cuci mobil, motor, helm, dan beli oli" },
] as const;

// Akun demo untuk pengunjung yang masih ragu / belum tahu cara memesan.
// Hanya akun pelanggan yang ditampilkan di halaman publik.
const DEMO_ACCOUNT = { label: "Budi Pelanggan (akun demo)", email: "pelanggan@cuci.test", password: "password" };

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-slate-400 transition-colors focus:border-[#3b5391] focus:outline-none focus:ring-4 focus:ring-[#3b5391]/10";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-slate-500">Memuat...</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      // Prioritaskan tujuan asal (?redirect=), lalu fallback ke default per role.
      if (redirect) {
        router.push(redirect);
      } else {
        router.push(
          user.role === "admin" || user.role === "kasir" ? "/admin/orders" : "/orders"
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-8 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[5fr_6fr]">
        {/* Panel kiri (desktop) */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#13224a] p-10 lg:flex">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/15" />
            <div className="absolute -left-20 top-1/2 h-56 w-56 rounded-full border border-blue-300/15" />
            <div className="absolute -bottom-12 right-8 h-36 w-36 rounded-full border border-blue-300/10" />
          </div>

          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-blue-200 ring-1 ring-white/15">
              <Icon name="drop" className="h-6 w-6" />
            </span>
            <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight text-white">
              Selamat datang
              <span className="block text-blue-300">kembali</span>
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-300">
              Masuk untuk memesan layanan cuci kendaraan dan melihat riwayat pesanan Anda.
            </p>
          </div>

          <ul className="relative mt-10 space-y-4">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-200">
                  <Icon name={b.icon} className="h-4 w-4" />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        </aside>

        {/* Form */}
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Masuk</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk ke akun Anda untuk memesan.</p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-24`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 rounded-md px-2.5 py-1 text-xs font-semibold text-[#3b5391] hover:bg-slate-100"
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b5391] text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-[#3b5391] hover:underline">
              Daftar
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-600">
            Mau pesan sungguhan tanpa akun?{" "}
            <Link href="/orders/new" className="font-semibold text-[#3b5391] hover:underline">
              Pesan langsung
            </Link>
          </p>

          {/* Akun demo: untuk yang ingin mencoba alur pemesanan */}
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-700">Masih ragu atau belum tahu cara memesan?</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Coba dulu dengan akun demo. Pesanan demo hanya untuk latihan, bukan pesanan sungguhan.
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_ACCOUNT.email);
                setPassword(DEMO_ACCOUNT.password);
              }}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-[#3b5391]"
            >
              <span className="block text-xs font-semibold text-neutral-900">{DEMO_ACCOUNT.label}</span>
              <span className="block truncate text-[11px] text-slate-500">{DEMO_ACCOUNT.email}</span>
            </button>
            <p className="mt-2 text-[11px] text-slate-400">Klik untuk mengisi form otomatis, lalu tekan Masuk.</p>
          </div>
        </div>
      </div>
    </div>
  );
}