"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLogout } from "@/hooks/useLogout";
import { isDemoUser } from "@/lib/demo";

// ASUMSI backend: PATCH /profile menerima { name, email, phone } dan
// mengembalikan data user terbaru. Sesuaikan jika endpoint Anda berbeda.
const PROFILE_ENDPOINT = "/profile";
const SAVED_KEY = "cuciku_profile_saved";

type FormKey = "name" | "email" | "phone";

const inputBase =
  "mt-1.5 h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-neutral-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-4 read-only:bg-slate-50 read-only:text-slate-500";

function roleLabel(role?: string, demo?: boolean) {
  if (demo) return "Akun demo";
  if (role === "admin") return "Admin";
  if (role === "kasir") return "Kasir";
  return "Pelanggan";
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useRequireAuth();
  // refreshUser bersifat opsional: jika AuthContext Anda punya fungsi ini, nama di navbar langsung ikut berubah.
  const auth = useAuth() as ReturnType<typeof useAuth> & { refreshUser?: () => Promise<unknown> | void };
  const logout = useLogout();

  const [form, setForm] = useState<Record<FormKey, string>>({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Isi form dari data akun
  useEffect(() => {
    if (user) {
      setForm({ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "" });
    }
  }, [user]);

  // Tampilkan pesan sukses setelah halaman dimuat ulang (fallback sinkronisasi)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SAVED_KEY)) {
        sessionStorage.removeItem(SAVED_KEY);
        setSuccess(true);
      }
    } catch {
      /* abaikan */
    }
  }, []);

  if (authLoading || !user) {
    return (
      <p suppressHydrationWarning className="p-10 text-center text-slate-500">
        Memuat...
      </p>
    );
  }

  const demo = isDemoUser(user.email);
  const staff = user.role === "admin" || user.role === "kasir";
  const display = user.name || user.email;
  const dirty =
    form.name !== (user.name ?? "") || form.email !== (user.email ?? "") || form.phone !== (user.phone ?? "");
  const fieldError = (key: string) => fieldErrors[key]?.[0];

  function update(key: FormKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    if (!form.name.trim() || !form.email.trim()) {
      setError("Nama dan email wajib diisi.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Masukkan alamat email yang valid, contoh: nama@email.com.");
      return;
    }

    setSaving(true);
    try {
      await apiFetch(PROFILE_ENDPOINT, {
        method: "PATCH",
        body: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || null },
      });
      if (auth.refreshUser) {
        await auth.refreshUser();
        setSuccess(true);
      } else {
        // Fallback: muat ulang agar nama di navbar ikut berubah
        try {
          sessionStorage.setItem(SAVED_KEY, "1");
        } catch {
          /* abaikan */
        }
        window.location.reload();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.errors) setFieldErrors(err.errors);
      } else {
        setError("Gagal menyimpan profil.");
      }
    } finally {
      setSaving(false);
    }
  }

  const fields: { key: FormKey; label: string; type: string; placeholder: string; autoComplete: string; hint?: string }[] = [
    { key: "name", label: "Nama Lengkap", type: "text", placeholder: "Nama lengkap", autoComplete: "name" },
    { key: "email", label: "Email", type: "email", placeholder: "nama@email.com", autoComplete: "email", hint: "Rincian pesanan dikirim ke email ini." },
    { key: "phone", label: "No. Telepon", type: "tel", placeholder: "081234567890", autoComplete: "tel", hint: "Digunakan untuk konfirmasi lewat WhatsApp." },
  ];

  return (
    <div suppressHydrationWarning className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl bg-[#13224a] p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/15" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full border border-blue-300/15" />
        </div>
        <div className="relative flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-extrabold text-white ring-1 ring-white/15">
            {display.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-extrabold tracking-tight text-white">Profil Saya</h1>
            <p className="truncate text-sm text-slate-300">{user.email}</p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Form profil */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
          <h2 className="text-lg font-bold text-neutral-900">Data Profil</h2>
          <p className="mt-0.5 text-sm text-slate-500">Ubah nama, email, atau nomor telepon Anda.</p>

          {demo && (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-[#3b5391]">
              Ini <b>akun demo</b> yang dipakai bersama, jadi datanya tidak bisa diubah. Keluar lalu pesan langsung
              tanpa login untuk memakai data Anda sendiri.
            </div>
          )}
          {success && (
            <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Profil berhasil diperbarui.
            </div>
          )}
          {error && (
            <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {fields.map((f) => {
              const err = fieldError(f.key);
              return (
                <div key={f.key}>
                  <label htmlFor={f.key} className="block text-sm font-medium text-neutral-900">
                    {f.label}
                    {f.key === "phone" && <span className="ml-1 text-xs font-normal text-slate-400">(opsional)</span>}
                  </label>
                  <input
                    id={f.key}
                    type={f.type}
                    required={f.key !== "phone"}
                    readOnly={demo}
                    autoComplete={f.autoComplete}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => update(f.key, f.key === "phone" ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? `${f.key}-error` : undefined}
                    className={`${inputBase} ${
                      err
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                        : "border-slate-300 focus:border-[#3b5391] focus:ring-[#3b5391]/10"
                    }`}
                  />
                  {err ? (
                    <p id={`${f.key}-error`} className="mt-1.5 text-xs text-red-600">{err}</p>
                  ) : (
                    f.hint && <p className="mt-1.5 text-xs text-slate-400">{f.hint}</p>
                  )}
                </div>
              );
            })}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || demo || !dirty}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#3b5391] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              {dirty && !demo && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ name: user.name ?? "", email: user.email ?? "", phone: user.phone ?? "" });
                    setFieldErrors({});
                    setError(null);
                  }}
                  className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-neutral-900 hover:bg-slate-50"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Akun & keluar */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Akun</h2>
            <p className="mt-4 truncate font-semibold text-neutral-900">{display}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                demo ? "bg-blue-100 text-[#3b5391]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {roleLabel(user.role, demo)}
            </span>

            <div className="mt-5 space-y-1 border-t border-slate-100 pt-4">
              <Link
                href={staff ? "/admin/orders" : "/orders"}
                className="flex rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-100"
              >
                {staff ? "Kelola Pesanan" : "Pesanan Saya"}
              </Link>
              <Link href="/orders/new" className="flex rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-100">
                Pesan Baru
              </Link>
            </div>
          </section>

          <button
            type="button"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              await logout();
              setLoggingOut(false);
            }}
            className="h-11 w-full rounded-lg border border-red-300 bg-white text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {loggingOut ? "Keluar..." : "Keluar dari Akun"}
          </button>
        </aside>
      </div>
    </div>
  );
}