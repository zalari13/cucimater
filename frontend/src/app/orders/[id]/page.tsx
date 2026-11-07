"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError, openResi } from "@/lib/api";
import { formatDate, formatDateOnly, rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { Icon } from "@/components/Icon";
import type { Order } from "@/lib/types";

const PROGRESS = ["Pesanan dibuat", "Dikonfirmasi", "Selesai"] as const;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useRequireAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(() => {
    apiFetch<{ data: Order }>(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Gagal memuat pesanan."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // Tutup dialog konfirmasi dengan Escape
  useEffect(() => {
    if (!confirmCancel) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && setConfirmCancel(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmCancel, busy]);

  async function handleCancel() {
    setBusy(true);
    setNotice(null);
    try {
      await apiFetch(`/orders/${id}/cancel`, { method: "POST" });
      setConfirmCancel(false);
      load();
    } catch (err) {
      setConfirmCancel(false);
      setNotice(err instanceof ApiError ? err.message : "Gagal membatalkan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResi() {
    setNotice(null);
    try {
      await openResi(Number(id));
    } catch {
      setNotice("Gagal membuka resi.");
    }
  }

  if (authLoading || loading) {
    return (
      <p suppressHydrationWarning className="p-10 text-center text-slate-500">
        Memuat...
      </p>
    );
  }
  if (error) {
    return (
      <div suppressHydrationWarning className="mx-auto max-w-xl px-4 py-10">
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
          <Link href="/orders" className="mt-3 block font-semibold underline">
            Kembali ke Pesanan Saya
          </Link>
        </div>
      </div>
    );
  }
  if (!order) {
    return (
      <p suppressHydrationWarning className="p-10 text-center text-slate-500">
        Pesanan tidak ditemukan.
      </p>
    );
  }

  const cancelled = order.status === "cancelled";
  const stage = order.status === "completed" ? 3 : order.status === "confirmed" ? 2 : 1;
  const canCancel = order.status === "pending" || order.status === "confirmed";
  const paid = order.payment?.status === "paid";

  return (
    <div suppressHydrationWarning className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl bg-[#13224a] p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/15" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full border border-blue-300/15" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/orders" className="inline-flex items-center gap-1 text-xs font-medium text-blue-200 hover:text-white">
              <Icon name="right" className="h-3.5 w-3.5 rotate-180" /> Pesanan Saya
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">{order.order_number}</h1>
            <p suppressHydrationWarning className="mt-1 text-sm text-slate-300">
              Dibuat {formatDate(order.created_at)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </section>

      {notice && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {notice}
          <button type="button" onClick={() => setNotice(null)} className="font-semibold underline">
            Tutup
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Kolom kiri */}
        <div className="space-y-6 lg:col-span-2">
          {/* Progres */}
          {cancelled ? (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <Icon name="clock" className="h-5 w-5 shrink-0" />
              Pesanan ini telah dibatalkan.
            </div>
          ) : (
            <Card title="Progres pesanan">
              <ol className="flex items-start">
                {PROGRESS.map((label, i) => {
                  const done = i + 1 <= stage;
                  return (
                    <li key={label} className="relative flex flex-1 flex-col items-center text-center">
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className={`absolute right-1/2 top-4 h-0.5 w-full ${i + 1 <= stage ? "bg-[#3b5391]" : "bg-slate-200"}`}
                        />
                      )}
                      <span
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          done ? "bg-[#3b5391] text-white" : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {done ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className={`mt-2 text-xs font-medium ${done ? "text-neutral-900" : "text-slate-400"}`}>
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Card>
          )}

          {/* Jadwal */}
          {order.scheduled_date && (
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3b5391] to-[#13224a] p-6 text-white shadow-sm">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-200">
                    <Icon name="clock" className="h-4 w-4" /> Jadwal cuci
                  </p>
                  <p suppressHydrationWarning className="mt-2 text-xl font-bold">
                    {formatDateOnly(order.scheduled_date)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 px-5 py-3 text-center ring-1 ring-white/15">
                  <p className="text-[11px] text-blue-200">No. Antrian</p>
                  <p className="text-3xl font-extrabold leading-tight">#{order.queue_number}</p>
                </div>
              </div>
            </section>
          )}

          {/* Kendaraan */}
          <Card title="Kendaraan">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Row label="Jenis">{order.vehicle_type}</Row>
              <Row label="Merek / Tipe">{order.vehicle_brand ?? "-"}</Row>
              <Row label="Plat">
                <span className="font-mono tracking-wider">{order.vehicle_plate ?? "-"}</span>
              </Row>
              <Row label="Kriteria">{order.vehicle_criteria ?? "-"}</Row>
            </dl>
          </Card>

          {/* Item pesanan */}
          <Card title="Item pesanan">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="pb-2 font-semibold">Jenis</th>
                    <th className="pb-2 text-right font-semibold">Harga</th>
                    <th className="pb-2 text-right font-semibold">Qty</th>
                    <th className="pb-2 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((it) => (
                    <tr key={it.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-neutral-900">{it.name}</td>
                      <td>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {it.item_type === "service" ? "Jasa" : "Oli"}
                        </span>
                      </td>
                      <td className="text-right text-slate-600">{rupiah(it.price)}</td>
                      <td className="text-right text-slate-600">{it.quantity}</td>
                      <td className="text-right font-semibold text-neutral-900">{rupiah(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-end gap-8 border-t border-slate-200 pt-4">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="text-2xl font-extrabold text-[#3b5391]">{rupiah(order.total)}</span>
            </div>
          </Card>
        </div>

        {/* Kolom kanan */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card title="Pembayaran & resi">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Metode: Tunai</span>
              {paid ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Lunas</span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Belum bayar</span>
              )}
            </div>

            {paid && order.payment && (
              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <Row label="Total Tagihan">{rupiah(order.total)}</Row>
                <Row label="Tunai Dibayar">{rupiah(order.payment.paid_amount)}</Row>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                  <dt className="font-medium text-slate-700">Kembalian</dt>
                  <dd className="font-bold text-emerald-700">{rupiah(order.payment.change_amount)}</dd>
                </div>
              </dl>
            )}

            <div className="mt-4 border-t border-slate-100 pt-4">
              {order.resi_number ? (
                <>
                  <p className="text-xs text-slate-500">No. Resi</p>
                  <p className="mt-0.5 break-all font-mono text-sm font-semibold text-neutral-900">{order.resi_number}</p>
                  <button
                    onClick={handleResi}
                    className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-[#3b5391] text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391]"
                  >
                    Lihat / Unduh Resi PDF
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-500">Resi akan tersedia setelah pesanan dikonfirmasi admin.</p>
              )}
            </div>
          </Card>

          {canCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={busy}
              className="h-11 w-full rounded-lg border border-red-300 bg-white text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              Batalkan Pesanan
            </button>
          )}
        </aside>
      </div>

      {/* Konfirmasi pembatalan */}
      {confirmCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1b4a]/60 p-4 backdrop-blur-sm"
          onClick={() => !busy && setConfirmCancel(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="cancel-title" className="text-lg font-bold text-neutral-900">Batalkan pesanan ini?</h3>
            <p className="mt-1 text-sm text-slate-500">
              {order.order_number} akan dibatalkan dan tidak bisa dikembalikan.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={busy}
                className="h-10 rounded-lg border border-slate-300 text-sm font-semibold text-neutral-900 hover:bg-slate-50 disabled:opacity-60"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="h-10 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Memproses..." : "Ya, batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}