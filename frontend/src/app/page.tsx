import Link from "next/link";

export default function Home() {
  const steps = [
    {
      title: "1. Pelanggan Memesan",
      desc: "Input data pesanan & kriteria kendaraan. Bisa tambah produk oli dari katalog.",
    },
    {
      title: "2. Admin Konfirmasi",
      desc: "Admin menerima pesanan masuk (pending) lalu mengonfirmasi dan menerbitkan resi digital PDF.",
    },
    {
      title: "3. Bayar Tunai & Validasi",
      desc: "Pelanggan menunjukkan resi & membayar tunai. Admin memvalidasi resi dan menyelesaikan transaksi.",
    },
    {
      title: "4. Resi Digital",
      desc: "Pelanggan dapat menampilkan dan mengunduh resi digital PDF kapan saja.",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="text-center py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Pemesanan Jasa Cuci Kendaraan &amp; Penjualan Oli
        </h1>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
          Pesan layanan cuci kendaraan dan beli oli secara online. Pembayaran tunai di lokasi,
          resi digital langsung tersedia.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/orders/new"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700"
          >
            Buat Pesanan
          </Link>
          <Link
            href="/catalog"
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium hover:bg-gray-100"
          >
            Lihat Katalog Oli
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {steps.map((s) => (
          <div key={s.title} className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-blue-700">{s.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
