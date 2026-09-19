"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatDate, rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import StatusBadge from "@/components/StatusBadge";
import type { Order, Paginated } from "@/lib/types";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<Paginated<Order>>("/orders")
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <p className="text-gray-500">Memuat...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pesanan Saya</h1>
        <Link
          href="/orders/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
        >
          + Pesan Baru
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-gray-500">Memuat pesanan...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-gray-500">Belum ada pesanan.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-400"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{o.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {o.vehicle_type} • {formatDate(o.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <p className="mt-1 font-semibold">{rupiah(o.total)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
