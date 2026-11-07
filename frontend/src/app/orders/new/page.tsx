"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { rupiah } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/Icon";
import type { OliProduct, Order, Paginated } from "@/lib/types";

const DEMO_EMAIL = "pelanggan@cuci.test";

interface ServiceOption {
  name: string;
  price: number;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  { name: "Cuci Motor", price: 15000 },
  { name: "Cuci Mobil Premium (luar dalam)", price: 50000 },
  { name: "Cuci Helm", price: 15000 },
  { name: "Cuci Sepatu Trail", price: 15000 },
];

// Rapikan input plat nomor Indonesia menjadi pola "B 1234 XYZ":
// [kode wilayah 1-2 huruf] [nomor 1-4 angka] [seri 1-3 huruf].
function formatPlate(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const match = clean.match(/^([A-Z]{0,2})(\d{0,4})([A-Z]{0,3})/);
  if (!match) return clean;

  const [, area, number, series] = match;
  return [area, number, series].filter(Boolean).join(" ");
}

// Normalisasi nomor WA: simpan hanya bagian SETELAH kode negara 62.
// Prefix "+62" ditampilkan statis di UI, jadi di sini kita buang 0/62 di depan
// supaya tidak dobel. Contoh: "08123" -> "8123", "628123" -> "8123".
function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

// Batas jam pemesanan cuci = 16:00 WIB. Dihitung dalam zona Asia/Jakarta
// agar tidak terpengaruh timezone perangkat pengguna.
function isPastCutoff(): boolean {
  const wibHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
  return wibHour >= 16;
}

/* ---------- Gaya & potongan UI ---------- */
const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-slate-400 transition-colors focus:border-[#3b5391] focus:outline-none focus:ring-4 focus:ring-[#3b5391]/10 read-only:bg-slate-50 read-only:text-slate-500";

function Section({
  step,
  title,
  desc,
  children,
}: {
  step: number;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3b5391] text-sm font-bold text-white"
        >
          {step}
        </span>
        <div>
          <h2 className="text-lg font-bold leading-8 text-neutral-900">{title}</h2>
          {desc && <p className="-mt-1 text-sm text-slate-500">{desc}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-900">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-slate-500">Memuat...</p>}>
      <NewOrderForm />
    </Suspense>
  );
}

function NewOrderForm() {
  // Dua jalur pemesanan:
  // 1) Tamu (tanpa login): nama, email, dan WA diisi sendiri; rincian (teks + PDF)
  //    dikirim ke email yang diketik.
  // 2) Login (mis. akun demo): nama & email mengikuti akun, hanya WA yang diisi.
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectOli = searchParams.get("oli");

  const isGuest = !user;
  const isDemo = user?.email === DEMO_EMAIL;

  const [products, setProducts] = useState<OliProduct[]>([]);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
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

  // Prefill data pemesan dari akun ketika login (tamu tetap kosong).
  useEffect(() => {
    if (user) {
      setCustomer({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ? normalizePhone(user.phone) : "",
      });
    }
  }, [user]);

  useEffect(() => {
    apiFetch<Paginated<OliProduct>>("/oli-products", { auth: false }).then((res) => {
      setProducts(res.data);

      if (preselectOli) {
        const id = Number(preselectOli);
        const product = res.data.find((p) => p.id === id);
        if (product && product.stock > 0) {
          setSelectedOli((prev) => ({ ...prev, [id]: prev[id] ?? 1 }));
        }
      }
    });
  }, [preselectOli]);

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

    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim()) {
      setError("Nama, email, dan nomor WhatsApp pemesan wajib diisi.");
      return;
    }

    // Validasi format email (pola standar: ada "@" dan domain berakhiran).
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(customer.email.trim())) {
      setError("Masukkan alamat email yang valid, contoh: nama@email.com.");
      return;
    }

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

    const body: Record<string, unknown> = { ...vehicle, services, oli_items };
    if (isGuest) {
      body.customer_name = customer.name.trim();
      body.customer_email = customer.email.trim();
      body.customer_phone = "62" + customer.phone.trim();
    } else {
      // User login: nama & email ikut akun, tapi nomor WA bisa diisi di sini.
      body.customer_phone = "62" + customer.phone.trim();
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ data: Order }>("/orders", {
        method: "POST",
        body,
        auth: !isGuest,
      });
      const order = res.data;
      if (isGuest && order.access_token) {
        router.push(`/orders/success?token=${order.access_token}`);
      } else {
        router.push(`/orders/${order.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <p suppressHydrationWarning className="p-10 text-center text-slate-500">
        Memuat...
      </p>
    );
  }

  // Baris ringkasan pesanan
  const serviceLines = SERVICE_OPTIONS.filter((o) => selectedServices[o.name]);
  const oliLines = products.filter((p) => selectedOli[p.id]);
  const hasItems = serviceLines.length + oliLines.length > 0;

  return (
    <div suppressHydrationWarning className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header halaman */}
      <section className="relative overflow-hidden rounded-2xl bg-[#13224a] p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-400/15" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full border border-blue-300/15" />
        </div>
        <div className="relative">
          <span className="inline-block rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
            {isGuest ? "Pesan tanpa akun" : isDemo ? "Mode demo" : "Pesanan baru"}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Buat Pesanan</h1>
          <p className="mt-1 text-sm text-slate-300">
            Isi data, pilih layanan, lalu bayar tunai di lokasi. Resi digital dikirim ke email Anda.
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Data pemesan */}
          <Section step={1} title="Data Pemesan" desc={isGuest ? "Isi dengan data Anda sendiri. Rincian pesanan (teks dan PDF) dikirim ke email ini." : "Rincian pesanan (teks dan PDF) dikirim ke email akun."}>
            {isDemo && (
              <div className="mb-4 flex gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-[#3b5391]">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Anda sedang memakai <b>akun demo</b>. Data pemesan mengikuti akun demo dan pesanan ini hanya untuk
                  latihan. Untuk memesan sungguhan, keluar dari akun lalu pesan langsung dengan nama, email, dan
                  nomor Anda sendiri.
                </p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="name" label="Nama Pemesan">
                <input
                  id="name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  required
                  readOnly={!isGuest}
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Nama lengkap"
                />
              </Field>
              <Field id="email" label="Email Pemesan">
                <input
                  id="email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  required
                  readOnly={!isGuest}
                  autoComplete="email"
                  className={inputClass}
                  placeholder="email@contoh.com"
                />
              </Field>
              <Field id="phone" label="No. WhatsApp" hint="Tanpa angka 0 di depan. Contoh: 81234567890">
                <div className="mt-1.5 flex h-11 overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-[#3b5391] focus-within:ring-4 focus-within:ring-[#3b5391]/10">
                  <span className="flex items-center border-r border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                    +62
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: normalizePhone(e.target.value) })}
                    required
                    autoComplete="tel-national"
                    className="w-full px-3 text-sm focus:outline-none"
                    placeholder="81234567890"
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* 2. Data kendaraan */}
          <Section step={2} title="Data Kendaraan">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="block text-sm font-medium text-neutral-900">Jenis Kendaraan</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2" role="group" aria-label="Jenis kendaraan">
                  {(["Mobil", "Motor"] as const).map((t) => {
                    const active = vehicle.vehicle_type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setVehicle({ ...vehicle, vehicle_type: t })}
                        className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors ${
                          active
                            ? "border-[#3b5391] bg-[#3b5391] text-white"
                            : "border-slate-300 bg-white text-slate-600 hover:border-[#3b5391]"
                        }`}
                      >
                        <Icon name={t === "Mobil" ? "car" : "bolt"} className="h-4 w-4" />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field id="brand" label="Merek / Tipe">
                <input
                  id="brand"
                  value={vehicle.vehicle_brand}
                  onChange={(e) => setVehicle({ ...vehicle, vehicle_brand: e.target.value })}
                  className={inputClass}
                  placeholder="Toyota Avanza"
                />
              </Field>
              <Field id="plate" label="Plat Nomor" hint="Format otomatis, contoh: B 1234 XYZ">
                <input
                  id="plate"
                  value={vehicle.vehicle_plate}
                  onChange={(e) => setVehicle({ ...vehicle, vehicle_plate: formatPlate(e.target.value) })}
                  maxLength={11}
                  inputMode="text"
                  autoCapitalize="characters"
                  className={`${inputClass} font-mono uppercase tracking-wider`}
                  placeholder="B 1234 XYZ"
                />
              </Field>
              <Field id="criteria" label="Kriteria / Catatan Kendaraan" className="sm:col-span-2">
                <textarea
                  id="criteria"
                  value={vehicle.vehicle_criteria}
                  onChange={(e) => setVehicle({ ...vehicle, vehicle_criteria: e.target.value })}
                  className={`${inputClass} h-auto py-2.5`}
                  rows={2}
                  placeholder="Kondisi kendaraan, permintaan khusus, dll."
                />
              </Field>
            </div>
          </Section>

          {/* 3. Layanan cuci */}
          <Section step={3} title="Layanan Cuci" desc="Pilih satu atau lebih layanan.">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {SERVICE_OPTIONS.map((opt) => {
                const checked = !!selectedServices[opt.name];
                return (
                  <label
                    key={opt.name}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      checked
                        ? "border-[#3b5391] bg-blue-50 ring-2 ring-[#3b5391]/15"
                        : "border-slate-200 bg-white hover:border-[#3b5391]"
                    }`}
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-neutral-900">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleService(opt)}
                        className="h-4 w-4 accent-[#3b5391]"
                      />
                      {opt.name}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-[#3b5391]">{rupiah(opt.price)}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* 4. Produk oli */}
          <Section step={4} title="Produk Oli" desc="Opsional. Tambahkan oli ke pesanan Anda.">
            <div className="space-y-2.5">
              {products.length === 0 && <p className="text-sm text-slate-500">Tidak ada produk oli.</p>}
              {products.map((p) => {
                const qty = selectedOli[p.id] ?? 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      qty > 0 ? "border-[#3b5391] bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#3b5391]">
                        <Icon name="can" className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.brand} • {rupiah(p.price)}/{p.unit} • stok {p.stock}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
                      <button
                        type="button"
                        onClick={() => setOliQty(p, qty - 1)}
                        disabled={qty <= 0}
                        aria-label={`Kurangi ${p.name}`}
                        className="h-9 w-9 text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      >
                        −
                      </button>
                      <span aria-live="polite" className="w-9 text-center text-sm font-semibold text-neutral-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOliQty(p, qty + 1)}
                        disabled={qty >= p.stock}
                        aria-label={`Tambah ${p.name}`}
                        className="h-9 w-9 text-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Ringkasan */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-neutral-900">Ringkasan</h2>

            {hasItems ? (
              <ul className="mt-4 space-y-2.5 border-b border-slate-100 pb-4 text-sm">
                {serviceLines.map((o) => (
                  <li key={o.name} className="flex justify-between gap-3">
                    <span className="text-slate-600">{o.name}</span>
                    <span className="shrink-0 font-medium text-neutral-900">{rupiah(o.price * selectedServices[o.name])}</span>
                  </li>
                ))}
                {oliLines.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="text-slate-600">
                      {p.name} <span className="text-slate-400">×{selectedOli[p.id]}</span>
                    </span>
                    <span className="shrink-0 font-medium text-neutral-900">{rupiah(p.price * selectedOli[p.id])}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 border-b border-slate-100 pb-4 text-sm text-slate-400">
                Belum ada layanan atau oli yang dipilih.
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold text-neutral-900">Total</span>
              <span className="text-2xl font-extrabold text-[#3b5391]">{rupiah(total)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Pembayaran tunai di lokasi.</p>

            <div
              suppressHydrationWarning
              className="mt-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800"
            >
              <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Pemesanan cuci dibatasi sampai pukul 16:00 WIB. Pesanan setelah jam tersebut otomatis
                dijadwalkan ke hari berikutnya.
                {isPastCutoff() && (
                  <span className="mt-1 block font-semibold">
                    Saat ini sudah lewat pukul 16:00 WIB — pesanan ini akan masuk antrian besok.
                  </span>
                )}
              </p>
            </div>

            {error && (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#3b5391] text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {submitting ? "Mengirim..." : "Kirim Pesanan"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}