import Link from "next/link";
import { Icon, type IconName } from "../components/Icon";
import HeroNote from "../components/HeroNote";

/* ---------- Data (contoh statis, sambungkan ke API/database) ---------- */
type Service = {
  name: string;
  price: string;
  duration: string;
  icon: IconName;
  features: string[];
  popular?: boolean;
};

const SERVICES: Service[] = [
  { name: "Cuci Motor", price: "Rp 15rb", duration: "15-30 menit", icon: "bolt", features: ["Cuci eksterior", "Pembersih body", "Bilas tekanan tinggi", "Pengeringan cepat"] },
  { name: "Cuci Mobil", price: "Rp 50rb", duration: "60-70 menit", icon: "car", popular: true, features: ["Antar-jemput", "Pengeringan", "Semir", "Bisa cuci saja"] },
  { name: "Cuci Helm Premium", price: "Rp 15rb", duration: "2-3 hari", icon: "helmet", features: ["Cuci bagian luar & dalam", "Anti-bakteri & pengharum", "Poles visor", "Pengeringan"] },
];

const ADVANTAGES = [
  { icon: "shield", title: "Teknisi bersertifikat", desc: "Dikerjakan tim terlatih dan berpengalaman." },
  { icon: "clock", title: "Update real-time", desc: "Pantau antrean dan status pesanan langsung." },
  { icon: "drop", title: "Ramah lingkungan", desc: "Hemat air dan sabun yang aman untuk cat." },
] as const;

const QUEUE = [
  { area: "Area Motor", waiting: 3, wait: "10 mnt", load: 45 },
  { area: "Area Mobil", waiting: 2, wait: "25 mnt", load: 70 },
  { area: "Area Helm", waiting: 0, wait: "-", load: 10 },
] as const;

const OILS = [
  { name: "UltraFlow 5W-30", desc: "Sintetik penuh, performa tinggi.", price: "Rp 185rb" },
  { name: "MaticPro 10W-30", desc: "Khusus motor matic.", price: "Rp 60rb" },
] as const;

/* ---------- Profil perusahaan (Tri Tunggal Jaya) ---------- */
const COMPANY = {
  story: [
    "Tri Tunggal Jaya pertama kali didirikan pada tanggal 29 Maret 2005 oleh Bapak Rinto. Pada awal perjalanannya, usaha ini dikelola secara mandiri oleh sang pemilik sebelum akhirnya berkembang pesat dari tahun ke tahun hingga kini didukung oleh tim dan sejumlah karyawan yang berdedikasi.",
    "Tri Tunggal Jaya tidak hanya dibangun sebagai sebuah lini usaha, tetapi juga dilandasi oleh keinginan besar untuk menciptakan lapangan pekerjaan dan memberdayakan masyarakat di sekitar daerahnya.",
    "Sebagai pionir di wilayah tersebut, Tri Tunggal Jaya merupakan pelopor pertama yang membuka usaha layanan cuci mobil dan motor, jauh sebelum bisnis serupa mulai banyak bermunculan di kawasan ini.",
  ],
  milestones: [
    { year: "2005", text: "Tri Tunggal Jaya resmi didirikan oleh Bapak Rinto." },
    { year: "2012", text: "Perluasan area layanan dan penambahan tenaga kerja lokal." },
    { year: "2018", text: "Pengembangan fasilitas cuci dan perawatan kendaraan modern." },
    { year: "2026", text: "Transformasi digital dengan pemesanan online dan resi mandiri." },
  ],
  owner: {
    name: "Rinto",
    role: "Pendiri & Pemilik",
    quote: "Kendaraan bersih, pelanggan tenang. Komitmen itu yang kami jaga sejak hari pertama.",
  },
  location: {
    address: [
      "Jl. Sultan Ageng Tirtayasa",
      "Kedungjaya, Kec. Kedawung",
      "Kabupaten Cirebon, Jawa Barat 45153",
    ],
    // Alamat lengkap + kode plus untuk peta Google (biarkan "" untuk menyembunyikan peta).
    mapQuery: "7GMG+787, Jl. Sultan Ageng Tirtayasa, Kedungjaya, Kec. Kedawung, Kabupaten Cirebon, Jawa Barat 45153",
  },
};

/* ---------- Potongan UI ---------- */
function Panel({
  id,
  title,
  className = "",
  children,
}: {
  id: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <h2 id={id} className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h2>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 170" role="img" aria-label="Ilustrasi mobil dan helm" className="w-full max-w-md">
      <g fill="none" stroke="#93c5fd" strokeWidth="2" opacity=".6">
        <circle cx="70" cy="30" r="9" /><circle cx="96" cy="14" r="5" /><circle cx="250" cy="20" r="11" />
        <circle cx="282" cy="38" r="5" /><circle cx="170" cy="22" r="6" />
      </g>
      <path d="M24 118V104q0-12 14-14l40-8 30-28q6-6 16-6h104q12 0 20 8l28 28 54 8q14 2 14 16v10z" fill="#ffffff14" stroke="#93c5fd" strokeWidth="3" strokeLinejoin="round" />
      <path d="M122 58h48v24H98zM180 58h42q8 0 14 6l20 18h-76z" fill="#93c5fd40" />
      <g fill="#0d1b4a" stroke="#93c5fd" strokeWidth="3">
        <circle cx="92" cy="122" r="20" /><circle cx="270" cy="122" r="20" />
      </g>
      <g fill="#93c5fd"><circle cx="92" cy="122" r="7" /><circle cx="270" cy="122" r="7" /></g>
      <path d="M0 144h480" stroke="#93c5fd" strokeWidth="2" opacity=".35" />
      <g transform="translate(366 70)" strokeLinejoin="round">
        <path d="M12 52C12 22 34 8 56 8c24 0 44 18 44 44v14H40Q12 66 12 52z" fill="#ffffff14" stroke="#93c5fd" strokeWidth="3" />
        <path d="M44 38h56v20H48q-10 0-10-10 0-10 6-10z" fill="#93c5fd40" stroke="#93c5fd" strokeWidth="3" />
      </g>
    </svg>
  );
}

function Hero() {
  return (
    <section className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl bg-[#13224a] p-6 shadow-lg shadow-[#13224a]/20 sm:p-9">
      {/* Latar: gradient halus + cahaya + cincin dekoratif */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3a73] via-[#13224a] to-[#0d1b4a]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_85%_0%,rgba(96,165,250,0.28),transparent)]" />
        <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full border border-blue-300/15" />
        <div className="absolute -bottom-20 right-6 h-44 w-44 rounded-full border border-blue-300/10" />
      </div>

      {/* Panel kaca berisi ilustrasi */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative flex w-full items-center justify-center rounded-2xl bg-white/[0.06] px-4 py-8 ring-1 ring-white/15 backdrop-blur-md">
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-100 ring-1 ring-white/15">
            <Icon name="check" className="h-3.5 w-3.5" /> Bayar tunai di lokasi
          </span>
          <HeroIllustration />
        </div>
      </div>

      <div className="relative mt-7">
        <span className="inline-block rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
          Perawatan kendaraan premium
        </span>
        <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
          Layanan Elite untuk
          <span className="block bg-gradient-to-r from-blue-200 to-blue-400 bg-clip-text text-transparent">
            Setiap Kendaraan Anda
          </span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
          Cuci mobil, motor, dan helm dengan antrean yang jelas. Pesan online, bayar tunai di lokasi,
          resi digital langsung tersedia.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/orders/new"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#13224a] shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Pesan Sekarang
          </Link>
          <Link
            href="/catalog"
            className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Lihat Katalog
          </Link>
        </div>

        <HeroNote />

        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 ring-1 ring-white/15 backdrop-blur">
          <div className="flex -space-x-2" aria-hidden="true">
            {["A", "B", "C"].map((l) => (
              <span key={l} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1b2f5e] bg-slate-200 text-[11px] font-bold text-slate-600">{l}</span>
            ))}
          </div>
          <p className="text-xs text-slate-300">
            <b className="text-white"><span className="text-amber-400">★★★★★</span> 4.9/5</b> · Dipercaya 2.500+ pelanggan
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl border border-slate-200/80 bg-white px-5 py-3 text-xs shadow-sm">
      <p className="flex items-center gap-2 font-semibold uppercase tracking-[0.12em] text-[#3b5391]">
        <Icon name="pulse" className="h-4 w-4" /> Status layanan langsung
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-slate-600">
        <span className="flex items-center gap-1.5"><Icon name="users" /> <b className="tabular-nums text-neutral-900">4</b> area aktif</span>
        <span className="flex items-center gap-1.5"><Icon name="clock" /> Tunggu: <b className="tabular-nums text-neutral-900">15 mnt</b></span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Buka sekarang
        </span>
      </div>
    </div>
  );
}

function ServiceCard({ s }: { s: Service }) {
  return (
    <article
      className={`relative flex flex-1 flex-col rounded-xl border p-4 transition-shadow hover:shadow-md ${
        s.popular
          ? "border-[#3b5391] bg-gradient-to-b from-blue-50/70 to-white ring-4 ring-[#3b5391]/10"
          : "border-slate-200 bg-white"
      }`}
    >
      {s.popular && (
        <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#3b5391] to-[#13224a] px-3 py-1 text-[11px] font-semibold text-white shadow-md">
          <Icon name="star" className="h-3 w-3 fill-current" /> Paling populer
        </span>
      )}
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.popular ? "bg-[#3b5391] text-white" : "bg-slate-100 text-[#3b5391]"}`}>
          <Icon name={s.icon} className="h-5 w-5" />
        </span>
        <div className="text-right">
          <p className="text-lg font-bold leading-none tracking-tight text-neutral-900">{s.price}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{s.duration}</p>
        </div>
      </div>
      <h3 className="mt-3 font-semibold tracking-tight text-neutral-900">{s.name}</h3>
      <ul className="mt-2 flex-1 space-y-1.5">
        {s.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
            <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-[#3b5391]/60" /> {f}
          </li>
        ))}
      </ul>
      <Link
        href="/orders/new"
        className={`mt-4 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391] ${
          s.popular ? "bg-[#3b5391] text-white hover:bg-[#4a64a6]" : "border border-slate-300 text-neutral-900 hover:bg-slate-50"
        }`}
      >
        Pesan
      </Link>
    </article>
  );
}

function PinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function About() {
  const { story, milestones, owner, location } = COMPANY;
  const fullAddress = location.address.join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.mapQuery || fullAddress)}`;

  return (
    <section id="tentang" aria-labelledby="about-heading" className="mt-12 scroll-mt-24">
      <div className="max-w-xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3b5391]">Tentang kami</p>
        <h2 id="about-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
          Mengenal Tri Tunggal Jaya
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Perjalanan dedikasi, visi penciptaan lapangan kerja, dan komitmen pelayanan terbaik untuk kendaraan Anda.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-5">
          {/* Sejarah */}
          <Panel id="sejarah-heading" title="Sejarah kami">
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              {story.map((p, index) => <p key={index}>{p}</p>)}
            </div>
            <ol className="mt-5 space-y-4 border-l border-slate-200 pl-5">
              {milestones.map((m) => (
                <li key={m.year} className="relative">
                  <span aria-hidden="true" className="absolute -left-[1.56rem] top-1 h-2.5 w-2.5 rounded-full bg-[#3b5391] ring-4 ring-blue-50" />
                  <p className="text-xs font-bold tabular-nums text-[#3b5391]">{m.year}</p>
                  <p className="text-sm text-slate-600">{m.text}</p>
                </li>
              ))}
            </ol>
          </Panel>

          {/* Owner */}
          <section
            aria-labelledby="owner-heading"
            className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b3366] to-[#0d1b4a] p-5 text-white shadow-sm"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/15" />
            <h2 id="owner-heading" className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
              Owner
            </h2>
            <div className="relative mt-4 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-extrabold ring-1 ring-white/20 backdrop-blur">
                {owner.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold tracking-tight">{owner.name}</p>
                <p className="text-sm text-blue-200">{owner.role}</p>
              </div>
            </div>
            <blockquote className="relative mt-4 rounded-xl bg-white/[0.06] p-3 text-sm leading-relaxed text-slate-200 ring-1 ring-white/10">
              &ldquo;{owner.quote}&rdquo;
            </blockquote>
          </section>
        </div>

        {/* Lokasi */}
        <Panel id="lokasi-heading" title="Lokasi kami">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#3b5391]">
              <PinIcon className="h-5 w-5" />
            </span>
            <address className="text-sm not-italic leading-relaxed text-slate-600">
              {location.address.map((line, i) => (
                <span key={line} className={`block ${i === 0 ? "font-semibold text-neutral-900" : ""}`}>{line}</span>
              ))}
            </address>
          </div>

          <div className="mt-4 flex min-h-[280px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {location.mapQuery ? (
              <iframe
                title="Peta lokasi Tri Tunggal Jaya"
                src={`https://www.google.com/maps?q=${encodeURIComponent(location.mapQuery)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
                <PinIcon className="h-8 w-8" />
                <p className="text-xs">Peta akan tampil setelah alamat lengkap diisi.</p>
              </div>
            )}
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#3b5391] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3b5391]"
          >
            <PinIcon /> Buka di Google Maps
          </a>
        </Panel>
      </div>
    </section>
  );
}

/* ---------- Halaman ---------- */
export default function Home() {
  return (
    <div suppressHydrationWarning className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 lg:pt-8">
      <div className="grid gap-5 lg:grid-cols-[5fr_7fr]">
        <Hero />

        <div className="flex flex-col gap-5">
          <StatusBar />

          <div className="grid flex-1 gap-5 md:grid-cols-2">
            <Panel id="layanan-heading" title="Layanan unggulan">
              <div className="flex flex-1 flex-col gap-5">
                {SERVICES.map((s) => <ServiceCard key={s.name} s={s} />)}
              </div>
            </Panel>

            <div className="flex flex-col gap-5">
              <Panel id="unggul-heading" title="Keunggulan kami">
                <div className="space-y-4">
                  {ADVANTAGES.map((a) => (
                    <div key={a.title} className="flex gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#3b5391]">
                        <Icon name={a.icon} className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold tracking-tight text-neutral-900">{a.title}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel id="antrean-heading" title="Antrean saat ini" className="flex-1">
                <div className="space-y-4">
                  {QUEUE.map((q) => (
                    <div key={q.area}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-900">{q.area}</span>
                        <span className="text-xs tabular-nums text-slate-500">{q.waiting} antre · {q.wait}</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#3b5391] to-blue-400" style={{ width: `${q.load}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <section
                aria-labelledby="katalog-heading"
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b3366] to-[#0d1b4a] p-5 text-white shadow-sm"
              >
                <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/15" />
                <div className="relative flex items-center justify-between">
                  <h2 id="katalog-heading" className="font-bold tracking-tight">Katalog pelumas</h2>
                  <Link href="/catalog" className="flex items-center gap-1 text-xs font-medium text-blue-200 hover:text-white">
                    Lihat semua <Icon name="right" className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <ul className="relative mt-3 space-y-2">
                  {OILS.map((o) => (
                    <li key={o.name}>
                      <Link
                        href="/catalog"
                        className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-2 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/10"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#0d1b4a]">
                          <Icon name="can" className="h-6 w-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">{o.name}</p>
                          <p className="truncate text-xs text-slate-300">{o.desc}</p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-blue-200">{o.price}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>

      <About />

      <p className="pt-8 text-center text-xs text-slate-500">© 2026 Tri Tunggal Jaya. Hak cipta dilindungi.</p>
    </div>
  );
}