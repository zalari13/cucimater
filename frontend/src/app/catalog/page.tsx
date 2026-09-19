"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { OliProduct, Paginated } from "@/lib/types";

export default function CatalogPage() {
  const [products, setProducts] = useState<OliProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(searchTerm = "") {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Paginated<OliProduct>>("/oli-products", {
        auth: false,
        query: { search: searchTerm },
      });
      setProducts(res.data);
    } catch {
      setError("Gagal memuat katalog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Katalog Oli</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(search);
          }}
          className="flex gap-2"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / merek..."
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-blue-600 px-4 text-white text-sm hover:bg-blue-700">
            Cari
          </button>
        </form>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {loading ? (
        <p className="mt-6 text-gray-500">Memuat...</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-gray-500">Tidak ada produk.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.brand}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${p.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  Stok: {p.stock}
                </span>
              </div>
              {p.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{p.description}</p>
              )}
              <p className="mt-3 text-lg font-bold text-blue-700">
                {rupiah(p.price)}
                <span className="text-xs font-normal text-gray-500"> / {p.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
