"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatDate, formatDateOnly, rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { Icon } from "@/components/Icon";
import type { Order, Paginated } from "@/lib/types";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
      <p className="text-lg font-bold leading-none text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-300">{label}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="h-11 w-11 rounded-lg bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-56 rounded bg-slate-100" />
      </div>
      <div className="h-4 w-20 rounded bg-slate-200" />
    </div>
  );
}

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

  if (authLoading || !user) {
    return (
      <p suppressHydrationWarning className="p-10 text-center text-slate-500">
        Memuat...
      </p>
    );
  }

  const active = orders.filter((o) => o.status === "pending" || o.status === "confirmed").length;
  const done = orders.filter((o) => o.status === "completed").length;

  return (
    <div suppressHydrationWarning className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
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
              Akun pelanggan
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Pesanan Saya</h1>
            <p className="mt-1 text-sm text-slate-300">Pantau status, jadwal, dan resi semua pesanan Anda.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!loading && (
              <>
                <Stat label="Total" value={orders.length} />
                <Stat label="Aktif" value={active} />
                <Stat label="Selesai" value={done} />
              </>
            )}
            <Link
              href="/orders/new"
              className="inline-flex h-11 items-center rounded-lg bg-[#4a64a6] px-5 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-[#5a74b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              + Pesan Baru
            </Link>
          </div>
        </div>
      </section>

      {/* Daftar pesanan */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#3b5391]">
            <Icon name="car" className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-neutral-900">Belum ada pesanan</p>
          <p className="mt-1 text-sm text-slate-500">Pesanan pertama Anda hanya butuh beberapa menit.</p>
          <Link
            href="/orders/new"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#3b5391] px-5 text-sm font-semibold text-white hover:bg-[#4a64a6]"
          >
            Buat pesanan
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="group flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#3b5391] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#3b5391] transition-colors group-hover:bg-[#3b5391] group-hover:text-white">
                  <Icon name="car" className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-neutral-900">{o.order_number}</p>
                  <p suppressHydrationWarning className="text-sm text-slate-500">
                    {o.vehicle_type} • {formatDate(o.created_at)}
                  </p>
                  {o.scheduled_date && (
                    <p
                      suppressHydrationWarning
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#3b5391]"
                    >
                      <Icon name="clock" className="h-3.5 w-3.5" />
                      Jadwal cuci: {formatDateOnly(o.scheduled_date)} • Antrian #{o.queue_number}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <StatusBadge status={o.status} />
                    <p className="mt-1.5 text-lg font-bold text-[#3b5391]">{rupiah(o.total)}</p>
                  </div>
                  <Icon name="right" className="h-5 w-5 text-slate-300 transition-colors group-hover:text-[#3b5391]" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}