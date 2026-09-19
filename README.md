# Sistem Informasi Pemesanan Jasa Cuci Kendaraan & Penjualan Oli

Aplikasi monorepo dengan backend **Laravel** (REST API + Sanctum) dan frontend **Next.js** (App Router + TypeScript + Tailwind CSS).

Alur mengikuti flowmap: pelanggan memesan jasa cuci + oli → admin mengonfirmasi & menerbitkan resi digital PDF → pembayaran tunai divalidasi → transaksi selesai.

```
TugasLaravel/
├── backend/     # Laravel API (Sanctum, dompdf, MySQL)
└── frontend/    # Next.js (App Router, TS, Tailwind)
```

> Catatan versi: `composer create-project` menghasilkan Laravel 13 (rilis stabil terbaru). Struktur skeleton-nya sama dengan Laravel 11 (`bootstrap/app.php`, slim providers). Sanctum 4 & dompdf 3 kompatibel.

---

## Prasyarat

- PHP 8.3+, Composer 2+
- Node.js 20+/22+, npm
- MySQL 8+ (jalankan server MySQL, mis. via XAMPP/Laragon/Docker)

---

## 1. Backend (Laravel)

```bash
cd backend
composer install                 # jika vendor belum ada
cp .env.example .env             # lalu sesuaikan kredensial DB
php artisan key:generate
```

Pastikan MySQL berjalan dan buat database:

```sql
CREATE DATABASE cuci_kendaraan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Konfigurasi `.env` (default):

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cuci_kendaraan
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:3000
```

Migrasi + seed data awal (admin, pelanggan contoh, katalog oli):

```bash
php artisan migrate --seed
php artisan serve                # http://localhost:8000
```

### Akun demo (dari seeder)

| Role      | Email                | Password |
|-----------|----------------------|----------|
| Admin     | admin@cuci.test      | password |
| Pelanggan | pelanggan@cuci.test  | password |

---

## 2. Frontend (Next.js)

```bash
cd frontend
npm install                      # jika node_modules belum ada
cp .env.example .env.local       # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev                      # http://localhost:3000
```

---

## Alur Aplikasi (sesuai flowmap)

1. **Pelanggan** login → `Pesan` → input data kendaraan + kriteria, pilih layanan cuci & produk oli → kirim. Pesanan berstatus **pending**.
2. **Admin** membuka `Kelola Pesanan` → **Konfirmasi & Terbitkan Resi** (status → confirmed, `resi_number` dibuat, PDF tersedia).
3. Pelanggan membayar **tunai** di lokasi & menunjukkan resi. Admin klik **Selesaikan (Validasi + Terima Tunai)** → status **completed**, pembayaran **paid**.
4. Pelanggan dapat **melihat/mengunduh resi PDF** kapan saja dari detail pesanan.

---

## Ringkasan API

Base URL: `http://localhost:8000/api`. Auth: header `Authorization: Bearer <token>`.

### Publik
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/register` | Daftar pelanggan |
| POST | `/login` | Login, mengembalikan token |
| GET  | `/oli-products` | Katalog oli (aktif) |
| GET  | `/oli-products/{id}` | Detail produk |

### Terautentikasi (pelanggan)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET  | `/me` | Profil user |
| POST | `/logout` | Logout |
| GET  | `/orders` | Pesanan milik user |
| POST | `/orders` | Buat pesanan |
| GET  | `/orders/{id}` | Detail pesanan |
| POST | `/orders/{id}/cancel` | Batalkan |
| GET  | `/orders/{id}/resi` | Resi PDF (stream) |

### Admin (`/api/admin`, butuh role admin)
| Method | Endpoint | Keterangan |
|--------|----------|------------|
| POST | `/admin/oli-products` | Tambah oli |
| PUT/PATCH | `/admin/oli-products/{id}` | Ubah oli |
| DELETE | `/admin/oli-products/{id}` | Hapus oli |
| GET | `/admin/orders` | Semua pesanan (filter `?status=`) |
| GET | `/admin/orders/{id}` | Detail |
| POST | `/admin/orders/{id}/confirm` | Konfirmasi + terbitkan resi |
| POST | `/admin/orders/{id}/complete` | Validasi + terima tunai + selesai |
| POST | `/admin/orders/{id}/cancel` | Batalkan |

### Contoh payload buat pesanan

```json
POST /api/orders
{
  "vehicle_type": "Mobil",
  "vehicle_brand": "Toyota Avanza",
  "vehicle_plate": "B 1234 XYZ",
  "vehicle_criteria": "Cuci luar dalam + ganti oli",
  "services": [
    { "name": "Cuci Mobil Premium", "price": 50000, "quantity": 1 }
  ],
  "oli_items": [
    { "oli_product_id": 1, "quantity": 2 }
  ]
}
```

---

## Skema Database

- **users**: `role` (admin|pelanggan), `phone`
- **oli_products**: `name, brand, price, stock, unit, is_active`
- **orders**: `order_number, user_id, vehicle_*, status (pending/confirmed/completed/cancelled), resi_number, subtotal, total, confirmed_by/at, completed_at`
- **order_items**: `item_type (service|oli), oli_product_id, name, price, quantity, subtotal`
- **payments**: `order_id, amount, method (cash), status (unpaid|paid), validated_by, paid_at`

Stok oli otomatis berkurang saat pesanan dibuat dan dikembalikan bila dibatalkan.
