import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cuci Kendaraan & Oli",
  description: "Sistem Informasi Pemesanan Jasa Cuci Kendaraan dan Penjualan Oli",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
            Sistem Pemesanan Jasa Cuci Kendaraan &amp; Penjualan Oli
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
