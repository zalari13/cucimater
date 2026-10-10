import Link from "next/link";

/* ---------- Icons (inline, tanpa dependensi) ---------- */
const PATHS = {
  drop: "M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  check: "M8.5 12l2.5 2.5 4.5-5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  right: "M9 6l6 6-6 6",
  users: "M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  can: "M8 3h8l1 4H7zM7 7h10v14H7zM10 11h4",
} as const;

function Icon({ name, className = "h-4 w-4" }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ---------- Data ---------- */
const SERVICES = [
  {
    name: "Cuci Motor",
    price: "Rp 15rb",
    duration: "15-30 menit",
    icon: "bolt",
    features: ["Cuci eksterior", "Pembersih body", "Bilas tekanan tinggi", "Pengeringan cepat"],
  },
  {
    name: "Cuci Mobil",
    price: "Rp 50rb",
    duration: "60-70 menit",
    icon: "drop",
    popular: true,
    features: ["Antar-jemput", "Pengeringan", "Semir", "Bisa cuci saja"],
  },
  {
    name: "Cuci Helm",
    price: "Rp 15rb",
    duration: "2-3 hari",
    icon: "shield",
    features: ["Manual", "Pengeringan"],
  },
] as const;

const ADVANTAGES = [
  { icon: "shield", title: "Teknisi bersertifikat", desc: "Dikerjakan tim terlatih dan berpengalaman." },
  { icon: "clock", title: "Update real-time", desc: "Pantau antrean dan status pesanan langsung." },
  { icon: "drop", title: "Teknologi ramah lingkungan", desc: "Hemat air dan sabun yang aman untuk cat." },
] as const;

const FOOTER_LINKS = [
  { href: "/orders/new", label: "Layanan" },
  { href: "/catalog", label: "Katalog" },
  { href: "/orders", label: "Pesanan Saya" },
  { href: "/register", label: "Daftar" },
] as const;

/* ---------- Bagian halaman ---------- */
function Hero() {
  return (
    <section className="relative flex min-h-[520px] flex-col justify-end overflow-hidden bg-[#13224a] bg-[url('/images/hero-car.jpg')] bg-cover bg-center p-8 sm:p-12 lg:min-h-0">
      <div className="absolute inset-0 bg-[#1b3366]/80" aria-hidden="true" />
      <div className="relative max-w-lg">
        <span className="inline-block rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
          Perawatan kendaraan premium
        </span>
        <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
          Layanan Elite untuk
          <span className="block text-blue-400">Setiap Kendaraan</span>
        </h1>
        <p className="mt-5 leading-relaxed text-slate-200">
          Rasakan perawatan mobil dan motor profesional dengan manajemen antrean cerdas dan
          proteksi cat yang tahan lama.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/orders/new" className="rounded-lg bg-[#3b5391] px-6 py-3 font-semibold text-white ring-1 ring-white/10 hover:bg-[#4a64a6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Pesan sekarang
          </Link>
          <Link href="/catalog" className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Katalog oli
          </Link>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2" aria-hidden="true">
            {["A", "B", "C", "D"].map((l) => (
              <span key={l} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1b3366] bg-slate-200 text-xs font-bold text-slate-600">
                {l}
              </span>
            ))}
          </div>
          <div className="text-xs text-slate-300">
            <p className="font-bold text-white">
              <span className="text-amber-400">★★★★★</span> 4.9/5
            </p>
            <p>Dipercaya oleh 2.500+ pemilik kendaraan</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-slate-200 bg-slate-200/70 px-6 py-3 text-xs">
      <p className="flex items-center gap-2 font-semibold uppercase tracking-wide text-[#3b5391]">
        <Icon name="pulse" className="h-4 w-4" />
        Status layanan langsung
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-slate-600">
        <span className="flex items-center gap-1.5">
          <Icon name="users" /> <b className="text-neutral-900">4</b> area aktif
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="clock" /> Tunggu: <b className="text-neutral-900">15 mnt</b>
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-semibold text-emerald-700">Buka sekarang</span>
      </div>
    </div>
  );
}

function ServiceCard({ s }: { s: (typeof SERVICES)[number] }) {
  const popular = "popular" in s && s.popular;
  return (
    <article className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {popular && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-[#3b5391] px-2.5 py-0.5 text-[11px] font-semibold text-white">
          Paling populer
        </span>
      )}
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#3b5391]">
          <Icon name={s.icon} className="h-5 w-5" />
        </span>
        <div className="text-right">
          <p className="font-bold text-neutral-900">{s.price}</p>
          <p className="text-[11px] uppercase text-slate-400">{s.duration}</p>
        </div>
      </div>
      <h3 className="mt-3 font-semibold text-neutral-900">{s.name}</h3>
      <ul className="mt-2 flex-1 space-y-1.5">
        {s.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-slate-500">
            <Icon name="check" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/orders/new"
        className={`mt-4 rounded-md py-2 text-center text-sm font-semibold ${
          popular
            ? "bg-[#3b5391] text-white hover:bg-[#4a64a6]"
            : "border border-slate-300 text-neutral-900 hover:bg-slate-50"
        }`}
      >
        Pesan
      </Link>
    </article>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="flex flex-col items-center gap-4 px-6 py-4 text-xs text-slate-500 md:flex-row md:justify-between">
        <span className="flex items-center gap-2 font-semibold text-neutral-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b5391] text-white">
            <Icon name="drop" className="h-3.5 w-3.5" />
          </span>
          Tri Tunggal Jaya
        </span>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-6 font-medium uppercase tracking-wide">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-neutral-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>© 2026 Tri Tunggal Jaya. Hak cipta dilindungi.</p>
      </div>
    </footer>
  );
}

/* ---------- Halaman ---------- */
export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-100">
      <main className="grid flex-1 lg:grid-cols-[3fr_4fr]">
        <Hero />
        <div className="flex flex-col">
          <StatusBar />
          <div className="grid flex-1 md:grid-cols-2">
            {/* Layanan unggulan */}
            <section aria-labelledby="layanan-heading" className="space-y-4 p-6">
              <h2 id="layanan-heading" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Layanan unggulan
              </h2>
              {SERVICES.map((s) => (
                <ServiceCard key={s.name} s={s} />
              ))}
            </section>

            {/* Keunggulan + katalog */}
            <div className="flex flex-col border-t border-slate-200 bg-slate-200/60 md:border-l md:border-t-0">
              <section aria-labelledby="unggul-heading" className="flex-1 space-y-5 p-6">
                <h2 id="unggul-heading" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Keunggulan kami
                </h2>
                {ADVANTAGES.map((a) => (
                  <div key={a.title} className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[#3b5391]">
                      <Icon name={a.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">{a.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </section>

              <section aria-labelledby="katalog-heading" className="bg-[#0d1b4a] p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 id="katalog-heading" className="font-bold">Katalog pelumas</h2>
                  <Link href="/catalog" className="flex items-center gap-1 text-xs text-blue-300 hover:text-white">
                    Lihat semua <Icon name="right" className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <Link href="/catalog" className="mt-4 flex items-center gap-3 rounded-lg p-1 hover:bg-white/5">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#0d1b4a]">
                    <Icon name="can" className="h-8 w-8" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">UltraFlow 5W-30</p>
                    <p className="text-xs text-slate-300">Sintetik penuh untuk performa tinggi mesin Anda.</p>
                  </div>
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
