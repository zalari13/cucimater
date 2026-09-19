"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, openResi } from "@/lib/api";
import { formatDate, rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import StatusBadge from "@/components/StatusBadge";
import type { Order, OrderStatus, Paginated } from "@/lib/types";

const FILTERS: { label: string; value: OrderStatus | "" }[] = [
  { label: "Semua", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Dikonfirmasi", value: "confirmed" },
  { label: "Selesai", value: "completed" },
  { label: "Dibatalkan", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Paginated<Order>>("/admin/orders", { query: { status: filter || undefined } })
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function action(id: number, kind: "confirm" | "complete" | "cancel") {
    setBusyId(id);
    try {
      await apiFetch(`/admin/orders/${id}/${kind}`, { method: "POST" });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Aksi gagal.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !user) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Kelola Pesanan</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              filter === f.value ? "bg-blue-600 text-white" : "bg-white border border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-6 text-gray-500">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-gray-500">Tidak ada pesanan.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{o.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {o.customer?.name} • {o.vehicle_type}
                    {o.vehicle_brand ? ` (${o.vehicle_brand})` : ""} • {formatDate(o.created_at)}
                  </p>
                  {o.resi_number && (
                    <p className="text-xs text-gray-400">Resi: {o.resi_number}</p>
                  )}
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <p className="mt-1 font-semibold">{rupiah(o.total)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {o.status === "pending" && (
                  <button
                    onClick={() => action(o.id, "confirm")}
                    disabled={busyId === o.id}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    Konfirmasi &amp; Terbitkan Resi
                  </button>
                )}
                {o.status === "confirmed" && (
                  <button
                    onClick={() => action(o.id, "complete")}
                    disabled={busyId === o.id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-white text-sm hover:bg-green-700 disabled:opacity-60"
                  >
                    Selesaikan (Validasi + Terima Tunai)
                  </button>
                )}
                {o.resi_number && (
                  <button
                    onClick={() => openResi(o.id)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                  >
                    Lihat Resi PDF
                  </button>
                )}
                {(o.status === "pending" || o.status === "confirmed") && (
                  <button
                    onClick={() => action(o.id, "cancel")}
                    disabled={busyId === o.id}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600 text-sm hover:bg-red-50 disabled:opacity-60"
                  >
                    Batalkan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
