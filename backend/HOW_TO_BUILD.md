# How To Build — Backend API (Laravel 13)

Panduan langkah demi langkah membangun backend **Sistem Pemesanan Jasa Cuci Kendaraan & Penjualan Oli** dari nol sampai menjadi REST API yang bisa dites.

Backend ini adalah REST API murni (JSON) dengan autentikasi token **Laravel Sanctum**, dan melayani frontend Next.js yang berjalan di `http://localhost:3000`.

---

## 1. Prasyarat

| Tool | Versi | Cek |
|------|-------|-----|
| PHP | ^8.3 | `php -v` |
| Composer | 2.x | `composer -V` |
| MySQL | 8.x / MariaDB 10.x | `mysql --version` |
| Node.js + npm | 20+ (opsional, untuk aset) | `node -v` |

Ekstensi PHP yang dibutuhkan: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `gd`/`dom` (untuk dompdf).

---

## 2. Membuat Project & Menginstal Dependensi

Jika mulai dari nol:

```bash
composer create-project laravel/laravel backend
cd backend
```

Paket utama yang dipakai project ini:

```bash
composer require laravel/sanctum      # auth token API
composer require barryvdh/laravel-dompdf  # generate resi PDF
composer require laravel/tinker
```

Kalau meng-clone repo yang sudah ada, cukup:

```bash
cd backend
composer install
```

Dependensi kunci (`composer.json`):
- `php: ^8.3`
- `laravel/framework: ^13.17`
- `laravel/sanctum: ^4.0` — token API (Bearer)
- `barryvdh/laravel-dompdf: ^3.1` — PDF resi
- `laravel/tinker: ^3.0`

---

## 3. Konfigurasi Environment (`.env`)

Salin template lalu buat app key:

```bash
cp .env.example .env
php artisan key:generate
```

Isi penting di `.env` (project ini pakai **MySQL**, bukan sqlite):

```env
APP_NAME="Cuci Kendaraan & Oli"
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cuci_kendaraan
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
MAIL_MAILER=log
```

> `FRONTEND_URL` penting: dipakai oleh CORS agar frontend Next.js boleh memanggil API.

---

## 4. Konfigurasi Aplikasi

### 4.1 Bootstrap (`bootstrap/app.php`)

Routing, middleware, dan handler exception didaftarkan di sini:

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',   // otomatis di-prefix /api
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
)
->withMiddleware(function (Middleware $middleware) {
    // alias untuk proteksi route admin
    $middleware->alias(['admin' => \App\Http\Middleware\EnsureAdmin::class]);
})
->withExceptions(function (Exceptions $exceptions) {
    // paksa response JSON untuk request api/* atau yang expectsJson
});
```

### 4.2 CORS (`config/cors.php`)

```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
'allowed_methods' => ['*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### 4.3 Sanctum (`config/sanctum.php`)

- Stateful domains: `localhost:3000`, `127.0.0.1:8000`
- `expiration => null` (token tidak kedaluwarsa)

Karena frontend memakai **Bearer token** (bukan cookie SPA), token dikirim di header `Authorization: Bearer <token>`.

---

## 5. Database — Skema (Migrations)

Jalankan setelah database `cuci_kendaraan` dibuat. Skema tabel utama:

**`users`**
- `id`, `name`, `email` (unique), `phone` (nullable)
- `role` enum(`admin`,`pelanggan`) default `pelanggan`
- `email_verified_at`, `password`, `remember_token`, timestamps

**`personal_access_tokens`** — tabel token Sanctum.

**`oli_products`**
- `id`, `name`, `brand` (nullable), `description` (text nullable)
- `price` decimal(12,2) default 0, `stock` unsigned int default 0
- `unit` string default `botol`, `image_url` (nullable), `is_active` boolean default true, timestamps

**`orders`**
- `id`, `order_number` (unique), `user_id` FK→users (cascade)
- `vehicle_type`, `vehicle_brand`, `vehicle_plate`, `vehicle_criteria`, `notes`
- `status` enum(`pending`,`confirmed`,`completed`,`cancelled`) default `pending`
- `resi_number` (unique, nullable), `subtotal`, `total` decimal(12,2)
- `confirmed_by` FK→users (nullable), `confirmed_at`, `completed_at`, timestamps

**`order_items`**
- `id`, `order_id` FK→orders (cascade)
- `item_type` enum(`service`,`oli`), `oli_product_id` FK→oli_products (nullable)
- `name` (snapshot), `price`, `quantity` default 1, `subtotal`, timestamps

**`payments`**
- `id`, `order_id` FK→orders (cascade), `amount` decimal(12,2)
- `method` default `cash`, `status` enum(`unpaid`,`paid`) default `unpaid`
- `validated_by` FK→users (nullable), `paid_at`, timestamps

Buat database lalu migrasi:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS cuci_kendaraan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate
```

---

## 6. Models & Relasi

- **User** — `isAdmin()`, `isPelanggan()`, `orders()` hasMany, trait `HasApiTokens`.
- **OliProduct** — cast `price` decimal:2, `stock` int, `is_active` boolean.
- **Order** — konstanta `STATUS_PENDING/CONFIRMED/COMPLETED/CANCELLED`; relasi `user()`, `confirmedBy()`, `items()` hasMany, `payment()` hasOne.
- **OrderItem** — relasi `order()`, `oliProduct()`.
- **Payment** — konstanta `STATUS_UNPAID/PAID`; relasi `order()`, `validatedBy()`.

---

## 7. Alur Bisnis (`app/Services/OrderService.php`)

Logika inti pesanan dipisah ke service, dibungkus `DB::transaction`:

- **`create(User, data)`** — wajib minimal 1 layanan atau 1 oli. Buat order status `pending`, buat item layanan & oli, **kurangi stok oli** (`lockForUpdate` + `decrement`), tolak jika stok kurang / produk non-aktif, hitung `subtotal`/`total`, dan buat record `payment` status `unpaid`. `order_number` = `ORD-YYYYMMDD-XXXXXX`.
- **`confirm(Order, admin)`** — hanya untuk status `pending` → set `confirmed`, isi `confirmed_by`, `confirmed_at`, dan generate `resi_number` (`RESI-YYYYMMDD-XXXXXX`).
- **`complete(Order, admin)`** — hanya untuk status `confirmed` → set `payment` jadi `paid` + `paid_at`, order jadi `completed`.
- **`cancel(Order)`** — tidak boleh untuk yang sudah `completed`/`cancelled`; **kembalikan stok oli** lalu set `cancelled`.

---

## 8. Validasi (Form Requests)

- **LoginRequest** — `email` required|email, `password` required.
- **RegisterRequest** — `name`, `email` unique, `phone` nullable, `password` min:8|confirmed.
- **StoreOliProductRequest** — authorize hanya admin; `required` saat POST, `sometimes` saat update.
- **StoreOrderRequest** — `vehicle_type` required; `services[]` dan `oli_items[]` array; `oli_items.*.oli_product_id` harus `exists:oli_products,id`. (Aturan "minimal satu item" ditegakkan di `OrderService`.)

---

## 9. Endpoint API (`routes/api.php`)

Semua di-prefix `/api`.

### Publik
| Method | Path | Aksi |
|--------|------|------|
| POST | `/api/register` | Daftar (role otomatis `pelanggan`) → `{user, token}` |
| POST | `/api/login` | Login → `{user, token}` |
| GET | `/api/oli-products` | Katalog aktif; `?search=` (nama/merek) |
| GET | `/api/oli-products/{id}` | Detail produk |

### Terautentikasi (`auth:sanctum`)
| Method | Path | Aksi |
|--------|------|------|
| GET | `/api/me` | User saat ini |
| POST | `/api/logout` | Hapus token aktif |
| GET | `/api/orders` | Pesanan milik user (paginate 10) |
| POST | `/api/orders` | Buat pesanan |
| GET | `/api/orders/{id}` | Detail pesanan (owner/admin) |
| POST | `/api/orders/{id}/cancel` | Batalkan pesanan |
| GET | `/api/orders/{id}/resi` | Unduh resi PDF |

### Admin (`auth:sanctum` + `admin`, prefix `/admin`)
| Method | Path | Aksi |
|--------|------|------|
| POST | `/api/admin/oli-products` | Tambah produk |
| PUT/PATCH | `/api/admin/oli-products/{id}` | Ubah produk |
| DELETE | `/api/admin/oli-products/{id}` | Hapus produk |
| GET | `/api/admin/orders` | Semua pesanan; `?status=` (paginate 15) |
| GET | `/api/admin/orders/{id}` | Detail |
| POST | `/api/admin/orders/{id}/confirm` | Konfirmasi + terbitkan resi |
| POST | `/api/admin/orders/{id}/complete` | Selesai + validasi pembayaran |
| POST | `/api/admin/orders/{id}/cancel` | Batalkan |

Response memakai API Resource, sehingga single resource dibungkus `{ "data": {...} }` dan list paginated berupa `{ "data": [...], "meta": {...} }`.

---

## 10. Resi PDF (`ResiController` + dompdf)

- `GET /api/orders/{id}/resi` — hanya owner atau admin; **404** jika `resi_number` belum ada (belum dikonfirmasi).
- PDF dibuat via `Barryvdh\DomPDF\Facade\Pdf::loadView('resi.receipt', ['order' => $order])->setPaper('a5')->stream("<resi>.pdf")`.
- Template Blade: `resources/views/resi/receipt.blade.php`.

---

## 11. Seeder — Akun & Katalog

```bash
php artisan db:seed
```

Membuat (idempotent, `updateOrCreate`):

| Peran | Email | Password |
|-------|-------|----------|
| Admin | `admin@cuci.test` | `password` |
| Pelanggan | `pelanggan@cuci.test` | `password` |

Plus 6 produk oli contoh (Mesran, Fastron, Shell Helix, Castrol Power1, Motul 5100, Yamalube) lengkap dengan `image_url`.

Reset penuh + seed:

```bash
php artisan migrate:fresh --seed
```

---

## 12. Menjalankan Server

```bash
php artisan serve   # http://localhost:8000
```

Cek health check: buka `http://localhost:8000/up`.

---

## 13. Menguji API

### 13.1 Manual dengan cURL

Login untuk mendapatkan token:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"email":"pelanggan@cuci.test","password":"password"}'
```

Salin `token` dari response, lalu panggil endpoint terproteksi:

```bash
TOKEN=xxx   # ganti dengan token

# Katalog (publik)
curl http://localhost:8000/api/oli-products -H "Accept: application/json"

# Buat pesanan
curl -X POST http://localhost:8000/api/orders \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "vehicle_type":"Mobil","vehicle_brand":"Toyota Avanza","vehicle_plate":"B 1 XYZ",
    "services":[{"name":"Cuci Mobil Standar","price":35000,"quantity":1}],
    "oli_items":[{"oli_product_id":1,"quantity":1}]
  }'

# Pesanan saya
curl http://localhost:8000/api/orders -H "Accept: application/json" -H "Authorization: Bearer $TOKEN"
```

Alur admin: login sebagai `admin@cuci.test`, lalu:

```bash
curl -X POST http://localhost:8000/api/admin/orders/1/confirm \
  -H "Accept: application/json" -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 13.2 Postman

Import `backend/postman_collection.json` (sudah tersedia di repo) untuk koleksi endpoint lengkap.

### 13.3 Automated Test (PHPUnit)

```bash
php artisan test
# atau
composer test
```

Test berjalan pada **SQLite in-memory** (`phpunit.xml`: `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`), jadi tidak menyentuh database MySQL dev. Saat ini baru ada test scaffolding contoh; tambahkan Feature test untuk auth/order sesuai kebutuhan.

---

## 14. Checklist Selesai

- [ ] `composer install` sukses
- [ ] `.env` terisi (MySQL) + `php artisan key:generate`
- [ ] Database `cuci_kendaraan` dibuat
- [ ] `php artisan migrate --seed` sukses
- [ ] `php artisan serve` berjalan di :8000
- [ ] Login mengembalikan token, endpoint terproteksi bisa diakses dengan Bearer token
- [ ] `php artisan test` hijau

Backend siap dipakai frontend. Lanjut ke `frontend/HOW_TO_BUILD.md`.
