"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { OliProduct, Paginated } from "@/lib/types";

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<OliProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OliProduct | null>(null);

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
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="mb-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      img.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <span
                  className={`text-sm text-gray-400 ${p.image_url ? "hidden" : ""}`}
                >
                  Tidak ada gambar
                </span>
              </div>
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
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              {selected.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.image_url}
                  alt={selected.name}
                  className="h-16 w-16 rounded-lg bg-gray-50 object-contain"
                />
              )}
              <div>
                <h3 className="font-semibold">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.brand}</p>
                <p className="mt-1 font-bold text-blue-700">
                  {rupiah(selected.price)}
                  <span className="text-xs font-normal text-gray-500"> / {selected.unit}</span>
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              Mau beli oli ini sekarang?
            </p>

            {selected.stock <= 0 && (
              <p className="mt-2 text-sm text-red-600">Stok produk ini sedang habis.</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Tidak
              </button>
              <button
                type="button"
                disabled={selected.stock <= 0}
                onClick={() => router.push(`/orders/new?oli=${selected.id}`)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Ya, beli oli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
