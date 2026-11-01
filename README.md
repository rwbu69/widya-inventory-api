# Widya Inventory API

RESTful API untuk Sistem Manajemen Inventaris Barang sederhana. Dibuat sebagai jawaban take home test dengan bantuan AI 

## Cara Menjalankan

### Opsi 1: Docker Compose

```bash
git clone <url-repo>
cd inventory-api
npm install
npm run setup
npm start
```

`npm run setup` akan:

1. Membuat file `.env` dari `.env.example` (jika belum ada)
2. Membuat `JWT_SECRET` acak secara otomatis (jika masih kosong)
3. Menjalankan PostgreSQL lewat `docker compose`
4. Menerapkan migrasi database
5. Men-generate Prisma Client

API berjalan di `http://localhost:3000`.

### Opsi 2: Manual (tanpa Docker)

1. Instal PostgreSQL dan buat database kosong, misalnya `inventory`.
2. Salin `.env.example` menjadi `.env`, lalu isi:
   - `DATABASE_URL` sesuai koneksi PostgreSQL kamu
   - `JWT_SECRET` dengan string acak, contohnya hasil dari:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
3. Jalankan:
   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma generate
   npm start
   ```

## Variabel Environment

| Variabel | Keterangan | Contoh |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://postgres:postgres@localhost:5432/inventory` |
| `JWT_SECRET` | Secret untuk menandatangani token (dibuat otomatis oleh `npm run setup`) | string acak panjang |
| `PORT` | Port server (opsional) | `3000` |

## Dokumentasi API

Collection Postman tersedia di [`docs/inventory-api.postman_collection.json`](docs/widya-inventory-api.json). Import ke Postman, jalankan **Auth → Login**, dan token akan tersimpan otomatis untuk request berikutnya.

### Endpoint

| Method | Endpoint | Auth | Keterangan | Status |
|---|---|---|---|---|
| POST | `/auth/register` | Tidak | Daftar user baru | 201, 400, 409 |
| POST | `/auth/login` | Tidak | Login, mengembalikan JWT | 200, 400, 401 |
| POST | `/items` | Ya | Tambah barang | 201, 400, 401 |
| GET | `/items` | Ya | Daftar barang (search + pagination) | 200, 400, 401 |
| PUT | `/items/:id` | Ya | Edit barang (semua field dikirim) | 200, 400, 401, 404 |
| DELETE | `/items/:id` | Ya | Hapus barang | 204, 401, 404 |
| POST | `/items/:id/decrease-stock` | Ya | Kurangi stok secara atomic | 200, 400, 401, 404, 409 |

Header untuk endpoint yang butuh auth: `Authorization: Bearer <token>`

---

## Jawaban Pertanyaan Pemahaman

### 1. Alur Request

Sebuah request melewati urutan berikut:

1. **Router** mencocokkan URL dan HTTP method ke handler yang tepat.
2. **Middleware** memproses request sebelum sampai ke logika utama: `express.json()` membaca body, middleware `auth` memeriksa tanda tangan dan masa berlaku JWT, dan middleware `validate` memeriksa body dengan skema Zod. Jika gagal, request berhenti di sini dengan 400 atau 401.
3. **Controller** mengambil data yang sudah bersih dari request, memanggil service, lalu mengirim response dengan kode status yang tepat.
4. **Service** berisi aturan bisnis: meng-hash password, membuat token, memutuskan 404 atau 409.
5. **Repository** adalah satu-satunya lapisan yang berbicara dengan database lewat Prisma.
6. **PostgreSQL** menyimpan data, lalu hasilnya kembali naik melalui lapisan yang sama.

Logika dipisah seperti ini karena prinsip *separation of concerns* 

Artikel [Geeks for Geeks : Separation of Concerns](https://www.geeksforgeeks.org/software-engineering/separation-of-concerns-soc/)

Prinsip itu kurang lebihnya bekerja seperti ini : 
- Setiap lapis memiliki tugas satu, sehingga kode lebih mudah dibaca dan mempermudah juga untuk debugging nantinya. 
- Service bisa dites tanpa server HTTP, dan repository bisa diganti (contohnya ganti ORM) tanpa menyentuh controller ataupun service. 
- Business logic tidak tercampur dengan urusan HTTP ataupun SQL, jadinya perubahan satu sisi tidak merusak sisi lainnya. 
- Error handling dan validation menjadi terpusat, bukan diulang terus menerus di setiap endpoint. 

### 2. Keamanan dan Token

JWT lebih baik disimpan di **HttpOnly cookie** (dengan flag `Secure` dan `SameSite`), bukan di Local Storage.

**Alasan:**

- Cookie `HttpOnly` tidak bisa dibaca oleh JavaScript. Jika aplikasi terkena XSS (misalnya dari library pihak ketiga atau input yang tidak disaring), penyerang tidak bisa mencuri token lewat `document.cookie`.
- Local Storage bisa dibaca oleh JavaScript apa pun yang berjalan di halaman, sehingga satu celah XSS cukup untuk membocorkan token.

**Risiko dan mitigasinya:**

- Cookie dikirim otomatis oleh browser, sehingga rentan terhadap **CSRF**. Mitigasinya: atribut `SameSite=Lax` atau `Strict`, ditambah CSRF token untuk operasi yang mengubah data.
- Gunakan `Secure` agar cookie hanya dikirim lewat HTTPS.
- Gunakan masa berlaku token yang singkat, dengan refresh token untuk memperpanjang sesi.

Catatan implementasi: sesuai ketentuan soal, API ini mengembalikan token lewat body response saat login. Untuk lingkungan produksi dengan frontend web, server sebaiknya mengirim token lewat header `Set-Cookie` dengan atribut di atas.

### 3. Penanganan Konkurensi

Misalkan stok barang X tersisa 1 dan dua user mengurangi stok pada saat yang tepat bersamaan.

**Penyebab masalah:** jika kode bekerja dengan pola *check-then-act* (baca stok, cek apakah cukup, lalu tulis stok baru), kedua request bisa sama-sama membaca stok = 1, sama-sama lolos pengecekan, lalu keduanya menulis `stok - 1`. Hasil akhirnya -1. Ini disebut *race condition*.

**Solusi yang dipakai:** pengecekan dan pengurangan digabung menjadi **satu query atomic**:

```sql
UPDATE "Item" SET stock = stock - 1 WHERE id = X AND stock >= 1;
```

Di Prisma, ini diwujudkan dengan `updateMany` yang memakai `where: { id, stock: { gte: quantity } }` dan `data: { stock: { decrement: quantity } }`. Jumlah baris yang berubah (`count`) menentukan hasilnya.

PostgreSQL mengunci baris saat `UPDATE` berjalan. Request pertama berhasil dan stok menjadi 0. Request kedua menunggu giliran, lalu melihat stok sudah 0 sehingga kondisi `stock >= 1` tidak terpenuhi dan tidak ada baris yang berubah (`count = 0`). API kemudian mengembalikan **409 Conflict** ("Stok tidak mencukupi"). Pengecekan dan pengurangan terjadi dalam satu langkah yang tidak bisa disela.

**Lapisan pengaman tambahan:** constraint `CHECK (stock >= 0)` di tabel `Item`. Jika suatu saat ada bug di kode aplikasi, database tetap menolak stok negatif.

**Alternatif lain:**

- *Pessimistic locking:* `SELECT ... FOR UPDATE` di dalam transaksi, sehingga baris terkunci sampai transaksi selesai.
- *Optimistic locking:* kolom `version`; update hanya berhasil jika versi belum berubah sejak dibaca, dan request yang gagal diulang.

Pendekatan atomic update dipilih karena paling sederhana, tidak membutuhkan transaksi eksplisit, dan sudah cukup untuk kasus pengurangan stok.