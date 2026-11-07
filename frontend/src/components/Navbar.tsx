"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@/hooks/useLogout";
import { isDemoUser } from "@/lib/demo";
import { Icon } from "./Icon";

const ghost =
  "inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-neutral-900";
const menuItem =
  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-900 hover:bg-slate-100";

function roleLabel(role?: string, demo?: boolean) {
  if (demo) return "Akun demo";
  if (role === "admin") return "Admin";
  if (role === "kasir") return "Kasir";
  return "Pelanggan";
}

function ProfileMenu() {
  const { user } = useAuth();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const demo = isDemoUser(user.email);
  const staff = user.role === "admin" || user.role === "kasir";
  const display = user.name || user.email;
  const initial = display.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white pl-1.5 pr-2.5 transition-colors hover:bg-slate-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b5391] text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-neutral-900 sm:block">{display}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-400" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="border-b border-slate-100 px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-neutral-900">{display}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                demo ? "bg-blue-100 text-[#3b5391]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {roleLabel(user.role, demo)}
            </span>
          </div>

          <div className="py-1">
            {staff ? (
              <Link href="/admin/orders" role="menuitem" onClick={() => setOpen(false)} className={menuItem}>
                Kelola Pesanan
              </Link>
            ) : (
              <Link href="/orders" role="menuitem" onClick={() => setOpen(false)} className={menuItem}>
                Pesanan Saya
              </Link>
            )}
            <Link href="/orders/new" role="menuitem" onClick={() => setOpen(false)} className={menuItem}>
              Pesan Baru
            </Link>
            <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={menuItem}>
              Profil
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await logout();
                setBusy(false);
                setOpen(false);
              }}
              className={`${menuItem} text-red-600 hover:bg-red-50 disabled:opacity-60`}
            >
              {busy ? "Keluar..." : demo ? "Keluar dari akun demo" : "Keluar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur" suppressHydrationWarning>
      {/* max-w & padding sama persis dengan konten halaman */}
      <div suppressHydrationWarning className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Tri Tunggal Jaya, beranda" className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a64a6] to-[#13224a] text-white shadow-sm">
            <Icon name="drop" className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-300" />
            <span className="absolute -left-1 bottom-1 h-1.5 w-1.5 rounded-full bg-blue-200" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-neutral-900 sm:text-lg">
            Tri Tunggal <span className="text-[#3b5391]">Jaya</span>
          </span>
        </Link>

        <nav suppressHydrationWarning aria-label="Navigasi utama" className="flex items-center gap-1 sm:gap-2">
          <Link href="/catalog" className={ghost}>Katalog Oli</Link>

          {loading ? (
            <span aria-hidden="true" className="h-10 w-28 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <ProfileMenu />
          ) : (
            <>
              <Link href="/login" className={ghost}>Masuk</Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center rounded-lg bg-[#3b5391] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4a64a6]"
              >
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}