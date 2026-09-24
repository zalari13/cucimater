# How To Build — Frontend Web (Next.js 16)

Panduan langkah demi langkah membangun frontend **Sistem Pemesanan Jasa Cuci Kendaraan & Penjualan Oli** dari nol sampai jadi web yang bisa di-build untuk produksi.

Frontend ini adalah aplikasi **Next.js 16 (App Router)** + **React 19** + **Tailwind CSS v4**, ditulis dengan TypeScript. Semua data diambil dari backend Laravel via REST API menggunakan token Bearer.

> Backend harus berjalan lebih dulu (lihat `backend/HOW_TO_BUILD.md`). Default API: `http://localhost:8000/api`.

---

## 1. Prasyarat

| Tool | Versi | Cek |
|------|-------|-----|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |

Package manager: **npm** (ada `package-lock.json`).

---

## 2. Membuat Project & Menginstal Dependensi

Jika mulai dari nol:

```bash
npx create-next-app@latest frontend
# Pilih: TypeScript = Yes, ESLint = Yes, Tailwind CSS = Yes, App Router = Yes, src/ = Yes
cd frontend
```

Kalau meng-clone repo yang sudah ada:

```bash
cd frontend
npm install
```

Versi kunci (`package.json`):
- `next: 16.3.5` (memakai **Turbopack** secara default)
- `react: 19.2.8`, `react-dom: 19.2.8`
- `tailwindcss: ^4` + `@tailwindcss/postcss` (setup CSS-first, tanpa `tailwind.config.js`)
- `typescript: ^5`, `eslint: ^9`, `eslint-config-next: 16.3.5`

Scripts:
```json
"dev":   "next dev",
"build": "next build",
"start": "next start",
"lint":  "eslint"
```

---

## 3. Konfigurasi Environment

Buat `.env.local` (dan `.env.example` sebagai template) berisi **satu** variabel:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

- Prefix `NEXT_PUBLIC_` membuat nilai ini di-inline ke bundle client saat build.
- Dikonsumsi di `src/lib/api.ts`:
  ```ts
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  ```
- Tidak ada proxy/rewrite di Next.js — request langsung ke origin backend, jadi **CORS backend** harus mengizinkan `http://localhost:3000`.

---

## 4. Konfigurasi Project

### `next.config.ts`
Mengunci root Turbopack ke folder frontend agar lockfile di direktori induk tidak dikira root workspace:
```ts
const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname) },
};
```

### `tsconfig.json`
- `strict: true`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`
- Path alias `@/*` → `./src/*` (dipakai di seluruh import: `@/lib/...`, `@/context/...`)

### `postcss.config.mjs`
```js
const config = { plugins: ["@tailwindcss/postcss"] };
```

### `eslint.config.mjs`
Flat config gabungan `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.

---

## 5. Styling (Tailwind v4 — `src/app/globals.css`)

Tailwind v4 memakai satu import (bukan `@tailwind base/components/utilities`):

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

> Catatan: blok `@media (prefers-color-scheme: dark)` sengaja **tidak** dipakai supaya kartu putih selalu punya teks gelap yang terbaca.

---

## 6. Arsitektur & Struktur `src/`

```
src/
├─ app/                  # App Router
│  ├─ layout.tsx         # Root layout: font, AuthProvider, Navbar, footer
│  ├─ page.tsx           # Landing "/"
│  ├─ globals.css
│  ├─ login/page.tsx
│  ├─ register/page.tsx
│  ├─ catalog/page.tsx   # Katalog oli (publik)
│  ├─ orders/
│  │  ├─ page.tsx        # "Pesanan Saya"
│  │  ├─ new/page.tsx    # Form buat pesanan
│  │  └─ [id]/page.tsx   # Detail pesanan + resi
│  └─ admin/
│     ├─ orders/page.tsx    # Kelola pesanan
│     └─ products/page.tsx  # CRUD katalog oli
├─ components/           # Navbar, StatusBadge
├─ context/              # AuthContext
├─ hooks/                # useRequireAuth
└─ lib/                  # api.ts, types.ts, format.ts
```

---

## 7. Lapisan Jaringan (`src/lib/api.ts`)

Semua komunikasi API lewat satu wrapper `apiFetch`:

- **Token** disimpan di `localStorage` dengan key **`cuci_token`** (helper `getToken/setToken/clearToken`, aman untuk SSR).
- **`ApiError`** membawa `status` dan `errors` (validasi Laravel).
- **`apiFetch<T>(path, { method, body, auth=true, query })`**:
  - Membangun URL + query string.
  - Header `Accept: application/json`; `Content-Type` hanya saat ada body.
  - Jika `auth` true dan token ada → `Authorization: Bearer <token>`.
  - `204` → `undefined`; non-OK → lempar `ApiError`; **401 → auto `clearToken()`**.
- **`openResi(orderId)`** — fetch resi PDF dengan Bearer token, ubah ke Blob, buka di tab baru.

Tipe domain ada di `src/lib/types.ts` (`User`, `OliProduct`, `Order`, `OrderItem`, `Payment`, `Paginated<T>`, dst). Formatter di `src/lib/format.ts` (`rupiah()`, `formatDate()`, `statusLabel`, `statusClass`).

---

## 8. Autentikasi (`src/context/AuthContext.tsx`)

`AuthProvider` membungkus seluruh app (di `layout.tsx`) dan menyediakan `useAuth()`:

- State `user` + `loading`.
- Saat mount: kalau ada token → panggil `GET /me` untuk rehidrasi sesi; gagal → clear.
- `login(email, password)` → `POST /login` (`auth:false`) → simpan token + user; kembalikan user (halaman login memakai `role` untuk redirect).
- `register(payload)` → `POST /register` (`auth:false`).
- `logout()` → `POST /logout` (best-effort) lalu clear.

### Route guard (`src/hooks/useRequireAuth.ts`)
```ts
useRequireAuth();          // wajib login (apa pun rolenya)
useRequireAuth("admin");   // wajib login + role admin
```
Belum login → redirect `/login`; role tidak cocok → redirect `/`.

> **Penting:** gating peran di sisi client hanya untuk UX, **bukan** batas keamanan. Otorisasi sebenarnya ditegakkan backend (middleware `admin`).

---

## 9. Halaman (App Router)

| Route | Proteksi | Fungsi |
|-------|----------|--------|
| `/` | publik | Landing + CTA (Buat Pesanan / Katalog) |
| `/login` | publik | Login; admin → `/admin/orders`, pelanggan → `/orders` |
| `/register` | publik | Daftar pelanggan |
| `/catalog` | publik | Katalog oli; klik kartu → modal konfirmasi → `/orders/new?oli=<id>` |
| `/orders` | login | Daftar pesanan milik user |
| `/orders/new` | login | Form pesanan (dibungkus `<Suspense>` karena pakai `useSearchParams`) |
| `/orders/[id]` | login | Detail pesanan + tombol batal + resi PDF |
| `/admin/orders` | admin | Filter status; konfirmasi/selesai/batal |
| `/admin/products` | admin | CRUD katalog oli |

Contoh alur pesanan (`orders/new`): pilih layanan cuci + produk oli → total live via `useMemo` → `POST /orders` → redirect ke `/orders/<id>`. Karena backend membungkus resource dalam `{ data: {...} }`, frontend membaca `res.data.id`.

---

## 10. Komponen

- **Navbar** — brand + "Katalog Oli"; link peran-spesifik (pelanggan: Pesan / Pesanan Saya; admin: Kelola Pesanan / Kelola Oli); tombol Keluar; saat logout tampil Masuk/Daftar.
- **StatusBadge** — pil warna status memakai `statusClass`/`statusLabel`.

---

## 11. Menjalankan (Development)

Pastikan backend jalan di `:8000` lalu:

```bash
npm run dev
```

Buka `http://localhost:3000`.

Login uji coba (dari seeder backend):
- Admin: `admin@cuci.test` / `password`
- Pelanggan: `pelanggan@cuci.test` / `password`

Alur cepat untuk menguji end-to-end:
1. Buka `/catalog`, klik sebuah oli → "Ya, beli oli".
2. Di `/orders/new`, lengkapi data kendaraan → Kirim Pesanan.
3. Cek di `/orders` dan buka detailnya.
4. Login sebagai admin → `/admin/orders` → Konfirmasi → buka Resi PDF.

---

## 12. Verifikasi Kualitas

```bash
npx tsc --noEmit     # cek TypeScript
npm run lint         # ESLint
```

---

## 13. Build Produksi

```bash
npm run build        # membangun output produksi (Turbopack)
npm start            # menyajikan hasil build di :3000
```

Untuk deploy, set `NEXT_PUBLIC_API_URL` ke URL backend produksi **sebelum** `npm run build` (nilai `NEXT_PUBLIC_*` di-inline saat build). Pastikan juga `FRONTEND_URL` di backend menunjuk ke domain frontend produksi agar CORS lolos.

---

## 14. Checklist Selesai

- [ ] `npm install` sukses
- [ ] `.env.local` berisi `NEXT_PUBLIC_API_URL`
- [ ] `npm run dev` jalan di :3000, bisa login
- [ ] Alur pesan → konfirmasi → resi PDF berjalan
- [ ] `npx tsc --noEmit` bersih
- [ ] `npm run build` sukses, `npm start` menyajikan web

Frontend siap. Untuk setup API-nya, lihat `backend/HOW_TO_BUILD.md`.
