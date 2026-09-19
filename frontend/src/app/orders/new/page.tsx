"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { OliProduct, Order, Paginated } from "@/lib/types";

interface ServiceOption {
  name: string;
  price: number;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  { name: "Cuci Motor", price: 15000 },
  { name: "Cuci Mobil Standar", price: 35000 },
  { name: "Cuci Mobil Premium (luar dalam)", price: 50000 },
  { name: "Cuci + Poles", price: 90000 },
];

export default function NewOrderPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [products, setProducts] = useState<OliProduct[]>([]);
  const [vehicle, setVehicle] = useState({
    vehicle_type: "Mobil",
    vehicle_brand: "",
    vehicle_plate: "",
    vehicle_criteria: "",
    notes: "",
  });
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [selectedOli, setSelectedOli] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Paginated<OliProduct>>("/oli-products", { auth: false }).then((res) =>
      setProducts(res.data)
    );
  }, []);

  function toggleService(opt: ServiceOption) {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[opt.name]) delete next[opt.name];
      else next[opt.name] = 1;
      return next;
    });
  }

  function setOliQty(product: OliProduct, qty: number) {
    setSelectedOli((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[product.id];
      else next[product.id] = Math.min(qty, product.stock);
      return next;
    });
  }

  const total = useMemo(() => {
    let sum = 0;
    for (const opt of SERVICE_OPTIONS) {
      if (selectedServices[opt.name]) sum += opt.price * selectedServices[opt.name];
    }
    for (const p of products) {
      if (selectedOli[p.id]) sum += p.price * selectedOli[p.id];
    }
    return sum;
  }, [selectedServices, selectedOli, products]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const services = Object.entries(selectedServices).map(([name, quantity]) => {
      const opt = SERVICE_OPTIONS.find((s) => s.name === name)!;
      return { name, price: opt.price, quantity };
    });
    const oli_items = Object.entries(selectedOli).map(([id, quantity]) => ({
      oli_product_id: Number(id),
      quantity,
    }));

    if (services.length === 0 && oli_items.length === 0) {
      setError("Pilih minimal satu layanan cuci atau produk oli.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiFetch<Order>("/orders", {
        method: "POST",
        body: { ...vehicle, services, oli_items },
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return <p className="text-gray-500">Memuat...</p>;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-lg">Data Kendaraan</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Jenis Kendaraan</label>
              <select
                value={vehicle.vehicle_type}
                onChange={(e) => setVehicle({ ...vehicle, vehicle_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option>Mobil</option>
                <option>Motor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Merek / Tipe</label>
              <input
                value={vehicle.vehicle_brand}
                onChange={(e) => setVehicle({ ...vehicle, vehicle_brand: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Toyota Avanza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Plat Nomor</label>
              <input
                value={vehicle.vehicle_plate}
                onChange={(e) => setVehicle({ ...vehicle, vehicle_plate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="B 1234 XYZ"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Kriteria / Catatan Kendaraan</label>
              <textarea
                value={vehicle.vehicle_criteria}
                onChange={(e) => setVehicle({ ...vehicle, vehicle_criteria: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                rows={2}
                placeholder="Kondisi kendaraan, permintaan khusus, dll."
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-lg">Layanan Cuci</h2>
          <div className="mt-4 space-y-2">
            {SERVICE_OPTIONS.map((opt) => (
              <label
                key={opt.name}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:border-blue-400"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!selectedServices[opt.name]}
                    onChange={() => toggleService(opt)}
                  />
                  {opt.name}
                </span>
                <span className="font-medium">{rupiah(opt.price)}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-lg">Produk Oli (opsional)</h2>
          <div className="mt-4 space-y-2">
            {products.length === 0 && (
              <p className="text-sm text-gray-500">Tidak ada produk oli.</p>
            )}
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-500">
                    {p.brand} • {rupiah(p.price)}/{p.unit} • stok {p.stock}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={p.stock}
                  value={selectedOli[p.id] ?? 0}
                  onChange={(e) => setOliQty(p, Number(e.target.value))}
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="lg:col-span-1">
        <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-lg">Ringkasan</h2>
          <div className="mt-4 flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-700">{rupiah(total)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Pembayaran tunai di lokasi.</p>

          {error && (
            <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Mengirim..." : "Kirim Pesanan"}
          </button>
        </div>
      </aside>
    </form>
  );
}
