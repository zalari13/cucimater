import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tri Tunggal Jaya | Cuci Kendaraan & Oli",
  description: "Pesan jasa cuci mobil, motor, dan helm serta beli oli secara online. Bayar tunai di lokasi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: mencegah peringatan akibat ekstensi browser
    // (mis. Grammarly, translate) yang menambah atribut ke <html>/<body>.
    <html lang="id" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} min-h-screen bg-slate-100 text-neutral-900 antialiased`}
      >
        <AuthProvider>
          <Navbar />
          {/* Tanpa container: tiap halaman mengatur lebarnya sendiri */}
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}