"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
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
    <div className="max-w-md mx-auto">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold">Daftar Akun Pelanggan</h1>

        {error && (
          <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {[
            { key: "name", label: "Nama Lengkap", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "No. Telepon", type: "text" },
            { key: "password", label: "Password", type: "password" },
            { key: "password_confirmation", label: "Konfirmasi Password", type: "password" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium">{f.label}</label>
              <input
                type={f.type}
                required={f.key !== "phone"}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => update(f.key as keyof typeof form, e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              {fieldError(f.key) && (
                <p className="mt-1 text-xs text-red-600">{fieldError(f.key)}</p>
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
