"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { rupiah } from "@/lib/format";
import type { OliProduct, Paginated } from "@/lib/types";
import { Icon } from "@/components/Icon";

/* ---------- Potongan UI ---------- */
function ProductImage({ src, alt, className }: { src?: string | null; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="flex flex-col items-center gap-1 text-xs text-slate-400">
        <Icon name="can" className="h-8 w-8" />
        Tidak ada gambar
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}

function StockBadge({ stock }: { stock: number }) {
  const empty = stock <= 0;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        empty ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {empty ? "Stok habis" : `Stok: ${stock}`}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-44 bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-5 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}

/* ---------- Halaman ---------- */
export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<OliProduct[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("Semua");
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
      setBrand("Semua");
    } catch {
      setError("Gagal memuat katalog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Diperbaiki: Memastikan array brand bertipe string murni dan memfilter nilai kosong/null
  const brands = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))
    );
    return ["Semua", ...uniqueBrands];
  }, [products]);

  const visible = brand === "Semua" ? products : products.filter((p) => p.brand === brand);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header halaman */}
      <section className="relative overflow-hidden rounded-2xl bg-[#13224a] p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/15" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full border border-blue-300/15" />
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="inline-block rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
              Pelumas kendaraan
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Katalog Oli</h1>
            <p className="mt-1 text-sm text-slate-300">
              Pilih oli untuk mobil dan motor Anda, bayar tunai saat diambil.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(search);
            }}
            className="flex w-full gap-2 sm:w-auto"
            role="search"
          >
            <label className="flex-1 sm:flex-none">
              <span className="sr-only">Cari nama atau merek oli</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / merek..."
                className="h-11 w-full rounded-lg border border-white/10 bg-white px-4 text-sm text-neutral-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:w-72"
              />
            </label>
            <button className="h-11 rounded-lg bg-[#4a64a6] px-5 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-[#5a74b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Cari
            </button>
          </form>
        </div>
      </section>

      {/* Filter merek */}
      {!loading && brands.length > 2 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter merek">
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(b)}
              aria-pressed={brand === b}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                brand === b
                  ? "bg-[#3b5391] text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:border-[#3b5391] hover:text-neutral-900"
              }`}
            >
              {b}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">{visible.length} produk</span>
        </div>
      )}

      {/* Status: error, loading, kosong, daftar */}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button type="button" onClick={() => load(search)} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : visible.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#3b5391]">
            <Icon name="can" className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-neutral-900">Tidak ada produk</p>
          <p className="mt-1 text-sm text-slate-500">Coba kata kunci atau merek lain.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#3b5391] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391]"
            >
              <div className="relative flex h-44 w-full items-center justify-center bg-slate-50 p-3">
                <ProductImage src={p.image_url} alt={p.name} className="h-full w-full object-contain" />
                <span className="absolute right-3 top-3">
                  <StockBadge stock={p.stock} />
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{p.brand}</p>
                <h3 className="mt-1 font-semibold leading-snug text-neutral-900">{p.name}</h3>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{p.description}</p>
                )}

                <div className="mt-auto flex items-end justify-between pt-4">
                  <p className="text-lg font-bold leading-none text-[#3b5391]">
                    {rupiah(p.price)}
                    <span className="ml-1 text-xs font-normal text-slate-500">/ {p.unit}</span>
                  </p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#3b5391] transition-colors group-hover:bg-[#3b5391] group-hover:text-white">
                    <Icon name="right" className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal konfirmasi beli */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1b4a]/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-36 items-center justify-center bg-slate-50 p-3">
              <ProductImage src={selected.image_url} alt={selected.name} className="h-full w-full object-contain" />
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{selected.brand}</p>
                  <h3 id="modal-title" className="mt-0.5 font-semibold text-neutral-900">{selected.name}</h3>
                </div>
                <StockBadge stock={selected.stock} />
              </div>

              <p className="mt-2 text-xl font-bold text-[#3b5391]">
                {rupiah(selected.price)}
                <span className="ml-1 text-xs font-normal text-slate-500">/ {selected.unit}</span>
              </p>

              <p className="mt-4 text-sm text-slate-600">Mau beli oli ini sekarang?</p>
              {selected.stock <= 0 && (
                <p className="mt-2 text-sm text-red-600">Stok produk ini sedang habis.</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-slate-50"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  disabled={selected.stock <= 0}
                  onClick={() => router.push(`/orders/new?oli=${selected.id}`)}
                  className="rounded-lg bg-[#3b5391] py-2.5 text-sm font-semibold text-white hover:bg-[#4a64a6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ya, beli oli
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}