"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, API_URL } from "@/lib/api";
import { formatDateOnly, rupiah } from "@/lib/format";
import { Icon } from "@/components/Icon";
import type { Order } from "@/lib/types";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <p suppressHydrationWarning className="p-10 text-center text-slate-500">
          Memuat...
        </p>
      }
    >
      <OrderSuccess />
    </Suspense>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

function OrderSuccess() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token pesanan tidak ditemukan.");
      setLoading(false);
      return;
    }
    apiFetch<{ data: Order }>(`/public/orders/${token}`, { auth: false })
      .then((res) => setOrder(res.data))
      .catch(() => setError("Pesanan tidak ditemukan."))
      .finally(() => setLoading(false));
  }, [token]);

  async function openResi() {
    setNotice(null);
    try {
      const res = await fetch(`${API_URL}/public/orders/${token}/resi`, {
        headers: { Accept: "application/pdf" },
      });
      if (!res.ok) {
        setNotice("Resi belum tersedia. Pesanan belum dikonfirmasi admin.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setNotice("Gagal membuka resi.");
    }
  }

  // Ubah nomor lokal (08xx) ke format internasional wa.me (62xx).
  function toWaNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    return digits;
  }

  function waLink(o: Order): string {
    // Kirim ringkasan pesanan sebagai teks saja (tanpa link PDF).
    // Rincian pembayaran lengkap tetap dikirim ke email pemesan.
    const lines = [
      `Halo, saya ingin konfirmasi pesanan:`,
      `No. Pesanan: ${o.order_number}`,
      `Nama: ${o.customer?.name ?? "-"}`,
      `Kendaraan: ${o.vehicle_type}${o.vehicle_plate ? ` (${o.vehicle_plate})` : ""}`,
      o.scheduled_date
        ? `Jadwal cuci: ${formatDateOnly(o.scheduled_date)} - Antrian #${o.queue_number}`
        : "",
      `Total: ${rupiah(o.total)}`,
    ].filter(Boolean);

    const number = o.customer?.phone ? toWaNumber(o.customer.phone) : "";
    return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  if (loading) {
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
          <Link href="/" className="mt-3 block font-semibold underline">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }
  if (!order) return null;

  return (
    <div suppressHydrationWarning className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6">
      {/* Banner sukses */}
      <section className="relative overflow-hidden rounded-2xl bg-[#13224a] px-6 py-10 text-center sm:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/15" />
          <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full border border-blue-300/15" />
        </div>
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg ring-8 ring-emerald-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
              <path d="M5 12l4.5 4.5L19 7" />
            </svg>
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Pesanan Berhasil Dibuat
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Rincian pembayaran telah dikirim ke email{" "}
            <strong className="break-all font-semibold text-white">{order.customer?.email}</strong>. Anda juga
            bisa mengirim ringkasan ini ke WhatsApp.
          </p>
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

      {/* Ringkasan pesanan */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Ringkasan pesanan</h2>

        {order.scheduled_date && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-blue-50 p-4 ring-1 ring-blue-100">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#3b5391]">
                <Icon name="clock" className="h-4 w-4" /> Jadwal cuci
              </p>
              <p suppressHydrationWarning className="mt-1 font-bold text-neutral-900">
                {formatDateOnly(order.scheduled_date)}
              </p>
            </div>
            <div className="rounded-lg bg-[#3b5391] px-4 py-2 text-center text-white">
              <p className="text-[10px] text-blue-200">No. Antrian</p>
              <p className="text-2xl font-extrabold leading-tight">#{order.queue_number}</p>
            </div>
          </div>
        )}

        <dl className="mt-5 space-y-3">
          <Row label="No. Pesanan">
            <span className="font-mono font-bold">{order.order_number}</span>
          </Row>
          <Row label="Nama">{order.customer?.name}</Row>
          <Row label="Kendaraan">
            {order.vehicle_type}
            {order.vehicle_plate ? ` (${order.vehicle_plate})` : ""}
          </Row>
        </dl>

        <div className="mt-5 flex items-center justify-between border-t border-dashed border-slate-300 pt-5">
          <span className="font-semibold text-neutral-900">Total</span>
          <span className="text-2xl font-extrabold text-[#3b5391]">{rupiah(order.total)}</span>
        </div>
        <p className="mt-1 text-right text-xs text-slate-500">Bayar tunai di lokasi.</p>

        {/* Aksi */}
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {order.customer?.phone && (
            <a
              href={waLink(order)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Kirim ke WhatsApp
            </a>
          )}
          {order.resi_number && (
            <button
              onClick={openResi}
              className="flex h-11 items-center justify-center rounded-lg bg-[#3b5391] text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391]"
            >
              Lihat Resi PDF
            </button>
          )}
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-neutral-900 transition-colors hover:bg-slate-50 sm:col-span-2"
          >
            Kembali ke Beranda
          </Link>
        </div>

        {!order.resi_number && (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Resi akan tersedia setelah pesanan dikonfirmasi admin. Rincian pembayaran sudah dikirim ke email
            Anda.
          </p>
        )}
      </section>

      <p className="text-center text-xs text-slate-500">Simpan halaman ini untuk memantau pesanan Anda.</p>
    </div>
  );
}