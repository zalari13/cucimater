"use client";

import { useAuth } from "@/context/AuthContext";

// Keterangan di hero untuk pengunjung yang belum login.
export default function HeroNote() {
  const { user, loading } = useAuth();

  if (loading) return <div aria-hidden="true" className="mt-4 h-14" />;
  if (user) return null;

  return (
    <p
      suppressHydrationWarning
      className="mt-4 max-w-md rounded-xl border border-white/15 bg-white/5 p-3 text-xs leading-relaxed text-slate-300"
    >
      Pesan langsung tanpa login. Cukup isi nama, email, dan nomor telepon Anda sendiri. Rincian pesanan (teks dan
      PDF) dikirim ke email yang Anda tulis.
    </p>
  );
}