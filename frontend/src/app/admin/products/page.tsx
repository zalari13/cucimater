"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { OliProduct, Paginated } from "@/lib/types";

interface FormState {
  id: number | null;
  name: string;
  brand: string;
  description: string;
  price: string;
  stock: string;
  unit: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  id: null,
  name: "",
  brand: "",
  description: "",
  price: "",
  stock: "",
  unit: "botol",
  is_active: true,
};

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const [products, setProducts] = useState<OliProduct[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch<Paginated<OliProduct>>("/oli-products").then((res) => setProducts(res.data));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  function edit(p: OliProduct) {
    setForm({
      id: p.id,
      name: p.name,
      brand: p.brand ?? "",
      description: p.description ?? "",
      price: String(p.price),
      stock: String(p.stock),
      unit: p.unit,
      is_active: p.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      name: form.name,
      brand: form.brand || null,
      description: form.description || null,
      price: Number(form.price),
      stock: Number(form.stock),
      unit: form.unit,
      is_active: form.is_active,
    };
    try {
      if (form.id) {
        await apiFetch(`/admin/oli-products/${form.id}`, { method: "PUT", body: payload });
      } else {
        await apiFetch("/admin/oli-products", { method: "POST", body: payload });
      }
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Hapus produk ini?")) return;
    try {
      await apiFetch(`/admin/oli-products/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Gagal menghapus.");
    }
  }

  if (authLoading || !user) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 sticky top-6">
          <h2 className="font-semibold text-lg">{form.id ? "Edit Produk" : "Tambah Produk"}</h2>
          {error && (
            <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div className="mt-4 space-y-3">
            <input
              placeholder="Nama"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              placeholder="Merek"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <textarea
              placeholder="Deskripsi"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Harga"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <input
                type="number"
                placeholder="Stok"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="botol">botol</option>
              <option value="liter">liter</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Aktif (tampil di katalog)
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : form.id ? "Perbarui" : "Tambah"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-lg border border-gray-300 px-4 hover:bg-gray-100"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold mb-4">Kelola Katalog Oli</h1>
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="font-semibold">
                  {p.name}{" "}
                  {!p.is_active && (
                    <span className="text-xs text-gray-400">(nonaktif)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {p.brand} • {rupiah(p.price)}/{p.unit} • stok {p.stock}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => edit(p)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
