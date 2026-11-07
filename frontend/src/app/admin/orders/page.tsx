"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError, openResi } from "@/lib/api";
import { formatDate, formatDateOnly, rupiah } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { Icon, type IconName } from "@/components/Icon";
import type { Order, OrderStatus, Paginated } from "@/lib/types";

const FILTERS: { label: string; value: OrderStatus | "" }[] = [
  { label: "Semua", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Dikonfirmasi", value: "confirmed" },
  { label: "Selesai", value: "completed" },
  { label: "Dibatalkan", value: "cancelled" },
];

/* ---------- Gaya bersama ---------- */
const btn =
  "inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btn} bg-[#3b5391] text-white hover:bg-[#4a64a6]`;
const btnSuccess = `${btn} bg-emerald-600 text-white hover:bg-emerald-700`;
const btnOutline = `${btn} border border-slate-300 text-neutral-900 hover:bg-slate-50`;
const btnDanger = `${btn} border border-red-300 text-red-600 hover:bg-red-50`;
const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-slate-400 transition-colors focus:border-[#3b5391] focus:outline-none focus:ring-4 focus:ring-[#3b5391]/10";

/* ---------- Potongan UI ---------- */
function Modal({
  title,
  subtitle,
  busy,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  busy: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1b4a]/60 p-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="modal-title" className="text-lg font-bold text-neutral-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-slate-600">
      <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-[#3b5391]" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex justify-between">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-4 w-20 rounded bg-slate-200" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="h-3 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}

/* ---------- Halaman ---------- */
export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin", "kasir"]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    setNotice(null);
    try {
      await apiFetch(`/admin/orders/${id}/${kind}`, { method: "POST" });
      load();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Aksi gagal.");
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
    setNotice(null);
    try {
      await openResi(id);
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Gagal membuka resi.");
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

  if (authLoading || !user) {
    return <p className="p-10 text-center text-slate-500">Memuat...</p>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header halaman */}
      <section className="relative overflow-hidden rounded-2xl bg-[#13224a] p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/15" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full border border-blue-300/15" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-block rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
              Panel {isAdmin ? "admin" : "kasir"}
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Kelola Pesanan</h1>
            <p className="mt-1 text-sm text-slate-300">
              Konfirmasi pesanan, terima pembayaran tunai, dan kirim kabar ke pelanggan.
            </p>
          </div>
          {!loading && (
            <p className="rounded-xl bg-white/10 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10">
              <b className="text-lg text-white">{orders.length}</b> pesanan
            </p>
          )}
        </div>
      </section>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status pesanan">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-[#3b5391] text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:border-[#3b5391] hover:text-neutral-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {notice && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {notice}
          <button type="button" onClick={() => setNotice(null)} className="font-semibold underline">
            Tutup
          </button>
        </div>
      )}

      {/* Daftar pesanan */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[#3b5391]">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <p className="mt-3 font-semibold text-neutral-900">Tidak ada pesanan</p>
          <p className="mt-1 text-sm text-slate-500">Pesanan dengan status ini belum ada.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                  <p className="text-base font-bold text-neutral-900">{o.order_number}</p>
                  <p className="text-xs text-slate-400">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <p className="text-lg font-bold text-[#3b5391]">{rupiah(o.total)}</p>
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-2 border-t border-slate-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoRow icon="users">
                  <b className="font-semibold text-neutral-900">{o.customer?.name ?? "-"}</b>
                  <span className="block text-xs text-slate-400">
                    {o.customer?.email ?? "-"} • {o.customer?.phone ?? "-"}
                  </span>
                </InfoRow>
                <InfoRow icon="car">
                  {o.vehicle_type}
                  {o.vehicle_brand ? ` (${o.vehicle_brand})` : ""}
                  {o.vehicle_plate && <span className="block text-xs text-slate-400">{o.vehicle_plate}</span>}
                </InfoRow>
                {o.scheduled_date && (
                  <InfoRow icon="clock">
                    <b className="font-semibold text-[#3b5391]">{formatDateOnly(o.scheduled_date)}</b>
                    <span className="block text-xs text-slate-400">Antrian #{o.queue_number}</span>
                  </InfoRow>
                )}
                {o.resi_number && (
                  <InfoRow icon="check">
                    Resi
                    <span className="block text-xs text-slate-400">{o.resi_number}</span>
                  </InfoRow>
                )}
              </div>

              <div className="flex flex-wrap gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-3">
                {o.status === "pending" && (
                  <button onClick={() => action(o.id, "confirm")} disabled={busyId === o.id} className={btnPrimary}>
                    Konfirmasi &amp; Terbitkan Resi
                  </button>
                )}
                {o.status === "confirmed" && (
                  <button onClick={() => openPayment(o)} disabled={busyId === o.id} className={btnSuccess}>
                    Selesaikan (Terima Tunai)
                  </button>
                )}
                {o.resi_number && (
                  <button onClick={() => handleResi(o.id)} className={btnOutline}>
                    Lihat Resi PDF
                  </button>
                )}
                {o.status === "completed" && o.customer?.phone && (
                  <a href={waDoneLink(o)} target="_blank" rel="noopener noreferrer" className={btnSuccess}>
                    Kirim WA Selesai
                  </a>
                )}
                {(o.status === "pending" || o.status === "confirmed") && (
                  <button onClick={() => action(o.id, "cancel")} disabled={busyId === o.id} className={btnDanger}>
                    Batalkan
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => openEdit(o)} className={`${btnOutline} sm:ml-auto`}>
                    Edit Pemesan
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal pembayaran tunai */}
      {payFor && (
        <Modal
          title="Pembayaran Tunai"
          subtitle={`${payFor.order_number} • ${payFor.customer?.name ?? ""}`}
          busy={paying}
          onClose={() => setPayFor(null)}
        >
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <span className="text-sm text-slate-600">Total Tagihan</span>
            <span className="text-lg font-bold text-[#3b5391]">{rupiah(payFor.total)}</span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <label htmlFor="cash" className="text-sm font-medium text-neutral-900">Uang Dibayar Pelanggan</label>
            <button
              type="button"
              onClick={() => setCashInput(String(payFor.total))}
              className="text-xs font-semibold text-[#3b5391] hover:underline"
            >
              Uang pas
            </button>
          </div>
          <input
            id="cash"
            type="text"
            inputMode="numeric"
            value={cashInput}
            onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ""))}
            autoFocus
            placeholder="0"
            className={inputClass}
          />

          <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
            <span className="text-sm text-slate-600">Kembalian</span>
            <span className={`text-lg font-bold ${change < 0 ? "text-red-600" : "text-emerald-700"}`}>
              {rupiah(change < 0 ? 0 : change)}
            </span>
          </div>

          {payError && <p role="alert" className="mt-3 text-sm text-red-600">{payError}</p>}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setPayFor(null)} disabled={paying} className={`${btnOutline} justify-center`}>
              Batal
            </button>
            <button
              type="button"
              onClick={submitPayment}
              disabled={paying || cashNumber < payFor.total}
              className={`${btnSuccess} justify-center`}
            >
              {paying ? "Memproses..." : "Terima & Selesaikan"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal edit pemesan */}
      {editFor && (
        <Modal title="Edit Data Pemesan" subtitle={editFor.order_number} busy={savingEdit} onClose={() => setEditFor(null)}>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-neutral-900">Nama Pemesan</label>
              <input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium text-neutral-900">Email Pemesan</label>
              <input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="edit-phone" className="block text-sm font-medium text-neutral-900">No. Telepon / WhatsApp</label>
              <input
                id="edit-phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/[^\d]/g, "") })}
                placeholder="628xxxxxxxxxx"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-slate-400">Format internasional, contoh: 6281234567890</p>
            </div>
          </div>

          {editError && <p role="alert" className="mt-3 text-sm text-red-600">{editError}</p>}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setEditFor(null)} disabled={savingEdit} className={`${btnOutline} justify-center`}>
              Batal
            </button>
            <button type="button" onClick={submitEdit} disabled={savingEdit} className={`${btnPrimary} justify-center`}>
              {savingEdit ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}