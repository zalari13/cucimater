"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Icon } from "@/components/Icon";

type FormKey = "name" | "email" | "phone" | "password" | "password_confirmation";

const FIELDS: {
  key: FormKey;
  label: string;
  type: "text" | "email" | "tel" | "password";
  placeholder: string;
  autoComplete: string;
  required: boolean;
  half?: boolean;
}[] = [
  { key: "name", label: "Nama Lengkap", type: "text", placeholder: "Nama sesuai identitas", autoComplete: "name", required: true },
  { key: "email", label: "Email", type: "email", placeholder: "nama@email.com", autoComplete: "email", required: true },
  { key: "phone", label: "No. Telepon", type: "tel", placeholder: "08xxxxxxxxxx", autoComplete: "tel", required: false },
  { key: "password", label: "Password", type: "password", placeholder: "Buat password", autoComplete: "new-password", required: true, half: true },
  { key: "password_confirmation", label: "Konfirmasi Password", type: "password", placeholder: "Ulangi password", autoComplete: "new-password", required: true, half: true },
];

const BENEFITS = [
  { icon: "clock", text: "Pesan online tanpa antre panjang" },
  { icon: "check", text: "Bayar tunai di lokasi setelah pesanan dikonfirmasi" },
  { icon: "shield", text: "Resi digital PDF tersimpan di akun Anda" },
] as const;

const inputBase =
  "mt-1.5 h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-neutral-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Record<FormKey, string>>({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  function update(key: FormKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await register(form);
      router.push("/orders");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) setFieldErrors(err.errors);
      } else {
        setError("Gagal mendaftar.");
      }
    } finally {
      setLoading(false);
    }
  }

  const fieldError = (key: string) => fieldErrors[key]?.[0];

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
              Bergabung bersama
              <span className="block text-blue-300">Tri Tunggal Jaya</span>
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-300">
              Buat akun pelanggan untuk memesan cuci mobil, motor, helm, dan membeli oli dengan mudah.
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
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Daftar Akun Pelanggan</h1>
          <p className="mt-1 text-sm text-slate-500">Isi data berikut untuk membuat akun baru.</p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
            {FIELDS.map((f) => {
              const err = fieldError(f.key);
              const isPassword = f.type === "password";
              return (
                <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                  <label htmlFor={f.key} className="block text-sm font-medium text-neutral-900">
                    {f.label}
                    {!f.required && <span className="ml-1 text-xs font-normal text-slate-400">(opsional)</span>}
                  </label>

                  <div className="relative">
                    <input
                      id={f.key}
                      type={isPassword && showPassword ? "text" : f.type}
                      required={f.required}
                      autoComplete={f.autoComplete}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={err ? `${f.key}-error` : undefined}
                      className={`${inputBase} ${isPassword ? "pr-12" : ""} ${
                        err
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-300 focus:border-[#3b5391] focus:ring-[#3b5391]/10"
                      }`}
                    />
                    {f.key === "password" && (
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-pressed={showPassword}
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        className="absolute right-1.5 top-1/2 mt-[3px] -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-[#3b5391] hover:bg-slate-100"
                      >
                        {showPassword ? "Tutup" : "Lihat"}
                      </button>
                    )}
                  </div>

                  {err && (
                    <p id={`${f.key}-error`} className="mt-1.5 text-xs text-red-600">
                      {err}
                    </p>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b5391] text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-[#3b5391] hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}