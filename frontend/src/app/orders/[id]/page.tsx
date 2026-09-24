"use client";

import { use, useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, openResi } from "@/lib/api";
import { formatDate, rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import StatusBadge from "@/components/StatusBadge";
import type { Order } from "@/lib/types";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useRequireAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ data: Order }>(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat pesanan."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function handleCancel() {
    if (!confirm("Batalkan pesanan ini?")) return;
    setBusy(true);
    try {
      await apiFetch(`/orders/${id}/cancel`, { method: "POST" });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Gagal membatalkan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResi() {
    try {
      await openResi(Number(id));
    } catch {
      alert("Gagal membuka resi.");
    }
  }

  if (authLoading || loading) return <p className="text-gray-500">Memuat...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-gray-500">Pesanan tidak ditemukan.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-gray-500">Dibuat {formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">Kendaraan</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-500">Jenis</dt>
          <dd>{order.vehicle_type}</dd>
          <dt className="text-gray-500">Merek/Tipe</dt>
          <dd>{order.vehicle_brand ?? "-"}</dd>
          <dt className="text-gray-500">Plat</dt>
          <dd>{order.vehicle_plate ?? "-"}</dd>
          <dt className="text-gray-500">Kriteria</dt>
          <dd>{order.vehicle_criteria ?? "-"}</dd>
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">Item Pesanan</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Item</th>
              <th>Jenis</th>
              <th className="text-right">Harga</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((it) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="py-2">{it.name}</td>
                <td>{it.item_type === "service" ? "Jasa" : "Oli"}</td>
                <td className="text-right">{rupiah(it.price)}</td>
                <td className="text-right">{it.quantity}</td>
                <td className="text-right">{rupiah(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end gap-8 text-lg font-bold">
          <span>Total</span>
          <span className="text-blue-700">{rupiah(order.total)}</span>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">Pembayaran &amp; Resi</h2>
        <p className="mt-2 text-sm text-gray-600">
          Metode: Tunai •{" "}
          {order.payment?.status === "paid" ? (
            <span className="text-green-700 font-medium">Lunas</span>
          ) : (
            <span className="text-amber-700 font-medium">Belum bayar</span>
          )}
        </p>
        {order.resi_number ? (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm">No. Resi: {order.resi_number}</span>
            <button
              onClick={handleResi}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            >
              Lihat / Unduh Resi PDF
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            Resi akan tersedia setelah pesanan dikonfirmasi admin.
          </p>
        )}
      </section>

      {(order.status === "pending" || order.status === "confirmed") && (
        <button
          onClick={handleCancel}
          disabled={busy}
          className="rounded-lg border border-red-300 px-4 py-2 text-red-600 text-sm hover:bg-red-50 disabled:opacity-60"
        >
          Batalkan Pesanan
        </button>
      )}
    </div>
  );
}
