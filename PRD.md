# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# Manka

**Versi:** 3.0  
**Status:** Final Specification  
**Platform:** Android APK (Offline-First)  
**Frontend:** HTML5, CSS3, TypeScript  
**Build Tool:** Vite  
**Mobile Framework:** Capacitor  
**Database:** SQLite Native  
**Timezone:** Asia/Jakarta  
**Currency:** IDR (Rupiah)

---

## 1. Product Overview

Konveksi Business Manager adalah aplikasi manajemen bisnis konveksi untuk mengelola beberapa toko marketplace, khususnya Shopee dan TikTok Shop.

Aplikasi membantu pemilik bisnis memantau:
- Penjualan setiap toko.
- Pesanan dan produk.
- Modal dan HPP.
- Potongan marketplace.
- Biaya iklan.
- Biaya operasional.
- Pengembalian dana.
- Pencairan dana.
- Keuntungan bersih.
- Laporan bisnis.

Aplikasi dirancang untuk berjalan sepenuhnya secara offline dengan database SQLite yang tersimpan di perangkat Android.

## 2. Product Goals

1. Menggabungkan pengelolaan beberapa toko dalam satu aplikasi.
2. Mengetahui keuntungan sebenarnya, bukan hanya omzet.
3. Memisahkan transaksi setiap toko.
4. Menyediakan laporan harian, mingguan, bulanan, dan periode khusus.
5. Menyimpan seluruh data secara lokal tanpa server.
6. Memungkinkan backup dan restore data.
7. Menyediakan pengalaman penggunaan yang cepat, sederhana, dan profesional.

## 3. Non-Goals

Fitur berikut tidak termasuk dalam versi awal:

- Login dan registrasi aplikasi.
- Autentikasi pengguna.
- Cloud database.
- Sinkronisasi antarperangkat.
- Integrasi API marketplace secara langsung.
- Pengambilan pesanan otomatis dari Shopee atau TikTok Shop.
- Pembayaran online.
- Sistem multi-user.
- Website backend yang membutuhkan server.

Import data marketplace dilakukan melalui file yang diunduh atau disiapkan pengguna.

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 |
| Programming | TypeScript |
| Build | Vite |
| Mobile Runtime | Capacitor |
| Database | SQLite Native |
| Charts | Chart.js |
| Icons | Lucide |
| Export Spreadsheet | ExcelJS |
| PDF | Library PDF yang kompatibel dengan Capacitor |
| File Storage | Capacitor Filesystem |

Gunakan plugin SQLite Capacitor yang kompatibel dengan versi Capacitor proyek. Verifikasi kompatibilitas sebelum implementasi.

### 4.2 Architecture Rules

- UI tidak boleh mengakses SQLite secara langsung.
- Semua operasi database harus melalui repository.
- Business logic dipisahkan dari UI.
- Semua transaksi keuangan menggunakan transaksi database.
- Database menggunakan migration versioning.
- Browser development dapat menggunakan adapter IndexedDB.
- Android production menggunakan SQLite native.
- LocalStorage tidak boleh menjadi database utama.
- Tidak ada ketergantungan internet untuk fitur inti.

### 4.3 Project Structure

```text
src/
├── app/
│   ├── router/
│   ├── layouts/
│   └── app.ts
├── components/
│   ├── ui/
│   ├── charts/
│   └── tables/
├── modules/
│   ├── dashboard/
│   ├── stores/
│   ├── products/
│   ├── orders/
│   ├── advertising/
│   ├── expenses/
│   ├── settlements/
│   ├── refunds/
│   ├── reports/
│   └── settings/
├── core/
│   ├── database/
│   ├── repositories/
│   ├── services/
│   ├── calculations/
│   ├── backup/
│   └── import-export/
├── styles/
├── types/
└── main.ts

database/
└── migrations/

android/
```

## 5. Core Business Modules

### 5.1 Dashboard

Dashboard menampilkan ringkasan keseluruhan bisnis.

Informasi:
- Total omzet.
- Penjualan bersih.
- Total pesanan.
- Total biaya marketplace.
- Total biaya iklan.
- Total HPP.
- Biaya operasional.
- Total refund.
- Estimasi keuntungan bersih.

Dashboard memiliki:
- Filter tanggal.
- Filter toko.
- Perbandingan periode.
- Grafik penjualan.
- Grafik keuntungan.
- Ringkasan performa toko.

Semua angka harus dihitung dari transaksi yang tersimpan, bukan angka dummy.

### 5.2 Store Management

Pengguna dapat:
- Menambahkan toko.
- Mengubah informasi toko.
- Mengarsipkan toko.
- Menghapus toko dengan konfirmasi.
- Melihat laporan per toko.
- Membandingkan performa beberapa toko.

Platform toko:
- Shopee.
- TikTok Shop.
- Lainnya.

Setiap toko memiliki identitas unik dan seluruh transaksi harus memiliki `store_id`.

### 5.3 Store Profile

Setiap toko mempunyai Profile Toko masing-masing.

Field profile:

| Field | Required |
|---|---|
| Nama toko | Ya |
| Platform | Ya |
| Email toko | Tidak |
| Nomor HP | Tidak |
| Kata sandi marketplace | Tidak |
| Nama KTP | Tidak |
| Nomor rekening | Tidak |

Aturan:
- Profile melekat pada satu toko.
- Data toko tidak boleh tertukar.
- Email, nomor HP, kata sandi, nama KTP, dan rekening bersifat opsional.
- Kata sandi hanya merupakan catatan informasi akun marketplace.
- Kata sandi tidak digunakan untuk autentikasi aplikasi.
- Nomor rekening dan kata sandi harus disimpan terenkripsi.
- Data sensitif tidak boleh muncul di dashboard umum.
- Tampilan kata sandi harus disamarkan secara default.
- Pengguna harus melakukan tindakan eksplisit untuk melihat atau menyalin informasi sensitif.
- Tidak ada login, logout, registrasi, atau autentikasi aplikasi.

### 5.4 Product Management

Data produk:
- Nama produk.
- SKU.
- Kategori.
- Varian.
- Harga jual.
- HPP.
- Status aktif/nonaktif.
- Catatan.

HPP harus mendukung riwayat perubahan harga modal.

Perubahan HPP tidak boleh mengubah keuntungan pesanan lama yang sudah tercatat. Setiap item pesanan harus menyimpan snapshot HPP saat transaksi dibuat atau diimpor.

### 5.5 Order Management

Data pesanan:
- Nomor pesanan marketplace.
- Toko.
- Tanggal pesanan.
- Status pesanan.
- Produk.
- Kuantitas.
- Harga jual.
- Diskon penjual.
- Diskon marketplace.
- Ongkir yang dibayar pembeli.
- Biaya marketplace.
- Total refund.
- Nilai pencairan jika tersedia.
- Catatan.

Status:
- Pending.
- Processing.
- Shipped.
- Delivered.
- Completed.
- Cancelled.
- Returned.
- Refunded.

Aturan:
- Nomor pesanan unik per toko.
- Pesanan batal tidak dihitung sebagai penjualan selesai.
- Pesanan yang dikembalikan harus tercatat sebagai retur.
- Refund mengurangi pendapatan sesuai nilai refund aktual.
- Import ulang tidak boleh menggandakan pesanan.
- Status marketplace harus dipetakan ke status internal.

### 5.6 Marketplace Fees

Mencatat:
- Biaya administrasi.
- Biaya layanan.
- Biaya transaksi.
- Komisi.
- Biaya program promosi.
- Potongan lainnya.

Biaya dapat diimpor atau dimasukkan manual.

Gunakan nominal aktual jika tersedia. Persentase estimasi hanya boleh digunakan sebagai estimasi dan harus diberi label.

### 5.7 Advertising Management

Mencatat:
- Platform iklan.
- Nama kampanye.
- Tanggal.
- Pengeluaran iklan.
- Impression.
- Click.
- Pesanan teratribusi.
- Omzet teratribusi.

Metrik:
- ROAS = Omzet teratribusi / Biaya iklan.
- ACOS = Biaya iklan / Omzet teratribusi × 100%.

Jika data atribusi tidak tersedia, tampilkan N/A. Jangan mengarang data ROAS atau ACOS.

### 5.8 Operational Expenses

Kategori biaya:
- Gaji.
- Listrik.
- Internet.
- Sewa.
- Perawatan mesin.
- Bahan pendukung.
- Transportasi.
- Lainnya.

Data:
- Tanggal.
- Toko terkait atau biaya bersama.
- Kategori.
- Nominal.
- Deskripsi.
- Bukti atau catatan opsional.

Biaya bersama dapat dicatat tanpa store_id dan harus ditampilkan sebagai biaya bisnis bersama.

### 5.9 Refund & Returns

Mencatat:
- Nomor pesanan.
- Toko.
- Tanggal refund.
- Nilai refund.
- Jumlah barang.
- Alasan.
- Status penyelesaian.

Jangan mengurangi pendapatan dua kali apabila refund sudah tercermin dalam data settlement.

### 5.10 Settlement & Payout

Mencatat:
- Nomor settlement.
- Toko.
- Tanggal settlement.
- Total penjualan.
- Total potongan.
- Total pencairan.
- Status pencairan.
- Catatan.

Tujuannya membedakan omzet, pendapatan bersih, dan uang yang benar-benar dicairkan.

### 5.11 Reports

Laporan:
- Harian.
- Mingguan.
- Bulanan.
- Tahunan.
- Rentang tanggal khusus.
- Per toko.
- Gabungan semua toko.

Format:
- Tabel.
- Grafik.
- CSV.
- Excel.
- PDF.

## 6. Financial Calculation Rules

Gunakan integer Rupiah untuk penyimpanan nilai uang. Jangan gunakan floating point untuk perhitungan keuangan.

Definisi:

**Penjualan kotor**
= Total harga jual barang sebelum potongan.

**Diskon penjual**
= Diskon yang ditanggung penjual.

**Diskon marketplace**
= Diskon yang ditanggung marketplace. Jangan otomatis mengurangi pendapatan penjual jika marketplace mengganti nilai tersebut.

**Penjualan bersih**
= Penjualan kotor - diskon yang ditanggung penjual - refund yang relevan.

**Keuntungan operasional**
= Penjualan bersih - HPP - biaya marketplace - biaya iklan - biaya operasional.

Aturan penting:
- Jangan menghitung biaya yang sama dua kali.
- Bedakan biaya aktual dengan biaya estimasi.
- Bedakan biaya yang sudah dipotong marketplace dan biaya yang dibayar terpisah.
- Refund yang sudah masuk ke perhitungan penjualan bersih tidak boleh dikurangkan kembali.
- Settlement adalah pencatatan arus pencairan, bukan otomatis pendapatan baru.

Rumus harus diimplementasikan pada service terpusat dan diuji dengan unit test.

## 7. Database Design

Tabel inti:

- stores
- products
- product_costs
- orders
- order_items
- marketplace_fees
- advertising_campaigns
- advertising_expenses
- operational_expenses
- refunds
- settlements
- app_settings
- import_batches
- import_errors
- audit_logs

Profile toko disimpan pada tabel `stores`, bukan tabel user.

Setiap tabel transaksi harus mempunyai relasi yang jelas terhadap toko jika transaksinya terkait toko.

Constraint:
- Primary key pada setiap tabel.
- Foreign key.
- Unique `(store_id, marketplace_order_id)` untuk pesanan marketplace.
- Index pada tanggal, store_id, SKU, dan status.
- Foreign key menggunakan aturan penghapusan yang aman.
- Penghapusan toko yang masih memiliki transaksi harus dibatasi atau menggunakan arsip.

## 8. Import & Export

Import:
- CSV.
- XLSX.
- Preview sebelum simpan.
- Mapping kolom.
- Validasi tipe data.
- Validasi tanggal.
- Validasi nominal.
- Deteksi duplikasi.
- Ringkasan baris berhasil dan gagal.
- Laporan error per baris.

Export:
- CSV.
- Excel.
- PDF.

Semua proses berjalan offline.

## 9. Backup & Restore

Backup wajib tersedia.

Fitur:
- Backup seluruh database.
- Backup termasuk data profile toko.
- Restore dari file backup.
- Validasi file backup.
- Konfirmasi sebelum restore.
- Peringatan sebelum menimpa data.
- Versi format backup.
- Penanganan backup yang rusak.

Jangan menyimpan backup hanya di direktori privat aplikasi tanpa menyediakan cara bagi pengguna untuk menyalinnya keluar.

## 10. Security & Privacy

- Tidak ada autentikasi aplikasi.
- Data disimpan lokal.
- Data sensitif profile toko dienkripsi.
- Encryption key tidak boleh ditulis langsung di source code.
- Jangan mencatat password atau nomor rekening dalam log.
- Jangan menampilkan data sensitif pada dashboard.
- Berikan peringatan bahwa siapa pun yang dapat membuka perangkat dan aplikasi berpotensi mengakses data bisnis.
- Backup yang berisi data sensitif harus dilindungi.

## 11. UX Requirements

- Navigasi mudah digunakan di layar ponsel.
- Dashboard ringkas.
- Form input tidak berlebihan.
- Loading, empty state, success state, dan error state tersedia.
- Konfirmasi untuk tindakan destruktif.
- Format uang menggunakan Rupiah.
- Format tanggal menggunakan Indonesia.
- Semua fitur inti tetap berfungsi tanpa internet.

## 12. Acceptance Criteria

Aplikasi dinyatakan memenuhi kebutuhan apabila:

1. APK dapat dijalankan tanpa internet.
2. Data tersimpan permanen di SQLite.
3. Data tetap tersedia setelah aplikasi ditutup dan dibuka kembali.
4. Banyak toko dapat dikelola.
5. Profile setiap toko terpisah.
6. Kata sandi profile tidak dipakai untuk login.
7. Pesanan tidak tercampur antar toko.
8. Import tidak menghasilkan duplikasi.
9. Laporan menghitung nilai keuangan dengan benar.
10. Refund dan settlement tidak dihitung ganda.
11. Backup dan restore berhasil.
12. Data sensitif tidak tampil tanpa tindakan pengguna.
13. Tidak ada fitur inti yang menggunakan data dummy.
14. Tidak ada tombol yang tidak memiliki fungsi.

## 13. Development Priorities

**Phase 1 — Foundation**
- Setup Vite, TypeScript, Capacitor.
- Setup SQLite.
- Migration.
- Repository.
- Layout dan navigasi.

**Phase 2 — Store & Product**
- Store management.
- Store profile.
- Product management.
- HPP history.

**Phase 3 — Transactions**
- Order management.
- Marketplace fees.
- Refund.
- Settlement.

**Phase 4 — Business Finance**
- Advertising.
- Operational expenses.
- Financial calculation service.

**Phase 5 — Analytics**
- Dashboard.
- Reports.
- Charts.
- Export.

**Phase 6 — Reliability**
- Import validation.
- Backup and restore.
- Security.
- Offline testing.
- APK build.

## 14. Definition of Done

Fitur tidak boleh dianggap selesai hanya karena tampilannya sudah dibuat.

Setiap fitur wajib:
- Memiliki UI.
- Memiliki validasi.
- Memiliki business logic.
- Terhubung ke repository.
- Tersimpan di database.
- Memiliki loading dan error state.
- Memiliki pengujian yang relevan.
- Berfungsi pada Android.
- Tidak bergantung pada internet jika termasuk fitur offline.

**Dokumen ini menjadi sumber utama kebutuhan produk. Jika implementasi bertentangan dengan PRD, PRD harus dijadikan acuan.**