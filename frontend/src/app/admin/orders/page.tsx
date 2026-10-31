"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, openResi } from "@/lib/api";
import { formatDate, formatDateOnly, rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import StatusBadge from "@/components/StatusBadge";
import type { Order, OrderStatus, Paginated } from "@/lib/types";

const FILTERS: { label: string; value: OrderStatus | "" }[] = [
  { label: "Semuas", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Dikonfirmasi", value: "confirmed" },
  { label: "Selesai", value: "completed" },
  { label: "Dibatalkan", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin", "kasir"]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Modal pembayaran saat menyelesaikan pesanan
  const [payFor, setPayFor] = useState<Order | null>(null);
  const [cashInput, setCashInput] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  // Modal edit data pemesan (admin saja)
  const isAdmin = user?.role === "admin";
  const [editFor, setEditFor] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "kasir";

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Paginated<Order>>("/admin/orders", { query: { status: filter || undefined } })
      .then((res) => setOrders(res.data))
      .catch(() => {
        /* diabaikan: non-staf akan dialihkan oleh useRequireAuth */
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    // Hanya muat data untuk staf. Pelanggan akan dialihkan oleh guard,
    // jadi jangan menembak endpoint admin (mencegah error 403).
    if (user && isStaff) load();
  }, [user, isStaff, load]);

  async function action(id: number, kind: "confirm" | "cancel") {
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

  function openPayment(order: Order) {
    setPayFor(order);
    setCashInput("");
    setPayError(null);
  }

  async function handleResi(id: number) {
    try {
      await openResi(id);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Gagal membuka resi.");
    }
  }

  // Ubah nomor lokal (08xx) ke format internasional wa.me (62xx).
  function toWaNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("62")) return digits;
    return digits;
  }

  // Link WhatsApp berisi pesan "pesanan selesai" (teks saja).
  function waDoneLink(o: Order): string {
    const lines = [
      `Halo ${o.customer?.name ?? ""}, pesanan Anda sudah SELESAI.`,
      `No. Pesanan: ${o.order_number}`,
      o.resi_number ? `No. Resi: ${o.resi_number}` : "",
      `Kendaraan: ${o.vehicle_type}${o.vehicle_plate ? ` (${o.vehicle_plate})` : ""}`,
      `Total: ${rupiah(o.total)}`,
      `Terima kasih telah menggunakan layanan kami.`,
    ].filter(Boolean);
    const number = o.customer?.phone ? toWaNumber(o.customer.phone) : "";
    return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const cashNumber = Number(cashInput) || 0;
  const change = payFor ? cashNumber - payFor.total : 0;

  async function submitPayment() {
    if (!payFor) return;
    if (cashNumber < payFor.total) {
      setPayError("Uang yang dibayar kurang dari total tagihan.");
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      await apiFetch(`/admin/orders/${payFor.id}/complete`, {
        method: "POST",
        body: { paid_amount: cashNumber },
      });
      setPayFor(null);
      load();
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : "Gagal menyelesaikan pembayaran.");
    } finally {
      setPaying(false);
    }
  }

  function openEdit(o: Order) {
    setEditFor(o);
    setEditForm({
      name: o.customer?.name ?? "",
      email: o.customer?.email ?? "",
      phone: o.customer?.phone ?? "",
    });
    setEditError(null);
  }

  async function submitEdit() {
    if (!editFor) return;
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      setEditError("Nama, email, dan nomor wajib diisi.");
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      await apiFetch(`/admin/orders/${editFor.id}/customer`, {
        method: "PATCH",
        body: {
          customer_name: editForm.name.trim(),
          customer_email: editForm.email.trim(),
          customer_phone: editForm.phone.trim(),
        },
      });
      setEditFor(null);
      load();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSavingEdit(false);
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
                  <p className="text-xs text-gray-400">
                    {o.customer?.email ?? "-"} • {o.customer?.phone ?? "-"}
                  </p>
                  {o.scheduled_date && (
                    <p className="text-sm font-medium text-blue-700">
                      Jadwal: {formatDateOnly(o.scheduled_date)} • Antrian #{o.queue_number}
                    </p>
                  )}
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
                    onClick={() => openPayment(o)}
                    disabled={busyId === o.id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-white text-sm hover:bg-green-700 disabled:opacity-60"
                  >
                    Selesaikan (Terima Tunai)
                  </button>
                )}
                {o.resi_number && (
                  <button
                    onClick={() => handleResi(o.id)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                  >
                    Lihat Resi PDF
                  </button>
                )}
                {o.status === "completed" && o.customer?.phone && (
                  <a
                    href={waDoneLink(o)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-white text-sm hover:bg-green-700"
                  >
                    Kirim WA Selesai
                  </a>
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
                {isAdmin && (
                  <button
                    onClick={() => openEdit(o)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                  >
                    Edit Pemesan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {payFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !paying && setPayFor(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Pembayaran Tunai</h3>
            <p className="mt-1 text-sm text-gray-500">
              {payFor.order_number} • {payFor.customer?.name}
            </p>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Total Tagihan</span>
              <span className="text-lg font-bold text-blue-700">{rupiah(payFor.total)}</span>
            </div>

            <label className="mt-4 block text-sm font-medium">Uang Dibayar Pelanggan</label>
            <input
              type="text"
              inputMode="numeric"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ""))}
              autoFocus
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />

            <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
              <span className="text-sm text-gray-600">Kembalian</span>
              <span className={`text-lg font-bold ${change < 0 ? "text-red-600" : "text-green-700"}`}>
                {rupiah(change < 0 ? 0 : change)}
              </span>
            </div>

            {payError && <p className="mt-3 text-sm text-red-600">{payError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayFor(null)}
                disabled={paying}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitPayment}
                disabled={paying || cashNumber < payFor.total}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
              >
                {paying ? "Memproses..." : "Terima & Selesaikan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !savingEdit && setEditFor(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Edit Data Pemesan</h3>
            <p className="mt-1 text-sm text-gray-500">{editFor.order_number}</p>

            <label className="mt-4 block text-sm font-medium">Nama Pemesan</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />

            <label className="mt-3 block text-sm font-medium">Email Pemesan</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />

            <label className="mt-3 block text-sm font-medium">No. Telepon / WhatsApp</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/[^\d]/g, "") })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="628xxxxxxxxxx"
            />
            <p className="mt-1 text-xs text-gray-400">Format internasional, contoh: 6281234567890</p>

            {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditFor(null)}
                disabled={savingEdit}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={savingEdit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingEdit ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
