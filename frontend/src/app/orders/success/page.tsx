"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, API_URL } from "@/lib/api";
import { formatDateOnly, rupiah } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Memuat...</p>}>
      <OrderSuccess />
    </Suspense>
  );
}

function OrderSuccess() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const res = await fetch(`${API_URL}/public/orders/${token}/resi`, {
      headers: { Accept: "application/pdf" },
    });
    if (!res.ok) {
      alert("Resi belum tersedia. Pesanan belum dikonfirmasi admin.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  if (loading) return <p className="text-gray-500">Memuat...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl text-white">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-green-900">Pesanan Berhasil Dibuat</h1>
        <p className="mt-2 text-sm text-green-800">
          Rincian pembayaran telah dikirim ke email <strong>{order.customer?.email}</strong>.
          Simpan halaman ini untuk memantau pesanan Anda.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-gray-500">No. Pesanan</dt>
          <dd className="text-right font-semibold">{order.order_number}</dd>
          <dt className="text-gray-500">Nama</dt>
          <dd className="text-right">{order.customer?.name}</dd>
          <dt className="text-gray-500">Kendaraan</dt>
          <dd className="text-right">
            {order.vehicle_type}
            {order.vehicle_plate ? ` (${order.vehicle_plate})` : ""}
          </dd>
          {order.scheduled_date && (
            <>
              <dt className="text-gray-500">Jadwal Cuci</dt>
              <dd className="text-right">
                {formatDateOnly(order.scheduled_date)} • Antrian #{order.queue_number}
              </dd>
            </>
          )}
          <dt className="text-gray-500">Total</dt>
          <dd className="text-right text-lg font-bold text-blue-700">{rupiah(order.total)}</dd>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {order.resi_number ? (
            <button
              onClick={openResi}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Lihat Resi PDF
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Resi akan tersedia setelah pesanan dikonfirmasi admin. Rincian pembayaran sudah
              dikirim ke email Anda.
            </p>
          )}
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
