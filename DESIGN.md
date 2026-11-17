# DESIGN SYSTEM
# Konveksi Business Manager

**Versi:** 1.0  
**Design Direction:** Modern, Premium, Clean, Professional  
**Platform:** Android-first  
**Layout:** Responsive Mobile Dashboard

---

## 1. Design Philosophy

Aplikasi harus terasa seperti produk bisnis profesional, bukan template dashboard hasil generator.

Prinsip:
- Clean, bukan kosong.
- Modern, bukan berlebihan.
- Premium, bukan penuh efek dekoratif.
- Informatif, bukan penuh angka tanpa hierarki.
- Konsisten di seluruh halaman.
- Mengutamakan keterbacaan di layar ponsel.

Hindari:
- Gradient di semua elemen.
- Glassmorphism berlebihan.
- Terlalu banyak card.
- Border di setiap komponen.
- Shadow yang terlalu kuat.
- Emoji sebagai pengganti icon.
- Ukuran font yang tidak konsisten.
- Grafik dekoratif tanpa informasi.

## 2. Visual Identity

### Color Palette

| Token | Color | Usage |
|---|---|---|
| Primary | #2563EB | Primary action |
| Primary Dark | #1D4ED8 | Active state |
| Background | #F6F8FC | Main background |
| Surface | #FFFFFF | Cards and panels |
| Text Primary | #172033 | Main text |
| Text Secondary | #667085 | Secondary text |
| Border | #E6EAF0 | Dividers |
| Success | #16A34A | Profit and success |
| Warning | #D97706 | Warning |
| Danger | #DC2626 | Loss and destructive |
| Info | #0891B2 | Information |

### Platform Identity

- Shopee: warna oranye sebagai aksen identitas platform.
- TikTok Shop: hitam dan aksen cyan sebagai identitas platform.
- Jangan menggunakan warna platform untuk seluruh layout.
- Warna platform hanya menjadi penanda toko atau platform.

### Semantic Colors

- Keuntungan: hijau.
- Kerugian: merah.
- Informasi: biru.
- Peringatan: amber.
- Netral: abu-abu.

Warna tidak boleh menjadi satu-satunya cara untuk menyampaikan status. Tambahkan label atau ikon.

## 3. Typography

Gunakan font modern yang mudah dibaca.

Rekomendasi:
- Inter.
- System UI fallback.

Hierarchy:

| Element | Size | Weight |
|---|---:|---|
| Page title | 24px | 700 |
| Section title | 18px | 650 |
| Card title | 14px | 600 |
| Body | 14px | 400 |
| Caption | 12px | 400 |
| KPI value | 24–28px | 700 |

Gunakan line-height yang nyaman.

Jangan menggunakan terlalu banyak variasi ukuran font dalam satu layar.

## 4. Layout System

### Desktop / Tablet

- Sidebar di sebelah kiri.
- Main content di sebelah kanan.
- Topbar untuk tanggal, pencarian, dan informasi halaman.
- Konten menggunakan grid responsif.

### Mobile

- Header ringkas.
- Bottom navigation untuk menu utama.
- Konten satu kolom.
- Tabel berubah menjadi daftar atau card yang mudah dibaca.
- Tombol utama mudah dijangkau ibu jari.
- Form menggunakan lebar penuh.

### Spacing

Gunakan kelipatan 4px.

- 4px: micro spacing.
- 8px: compact.
- 12px: small.
- 16px: standard.
- 24px: section.
- 32px: large.
- 40px: page separation.

### Radius

- Small: 8px.
- Medium: 12px.
- Large: 16px.
- Pill: 999px.

### Shadows

Gunakan shadow halus hanya untuk elemen yang membutuhkan elevasi.

Jangan menggunakan shadow pada setiap card.

## 5. Navigation

Menu utama:

1. Dashboard
2. Toko
3. Pesanan
4. Produk
5. Keuangan
6. Laporan
7. Pengaturan

Menu Keuangan dapat memiliki submenu:
- Biaya marketplace.
- Iklan.
- Operasional.
- Refund.
- Settlement.

Pada mobile, gunakan bottom navigation untuk menu yang paling sering digunakan dan sediakan menu lainnya melalui halaman navigasi tambahan.

## 6. Page Design

### 6.1 Dashboard

Susunan:

1. Header dengan judul dan filter periode.
2. Filter toko.
3. KPI omzet, penjualan bersih, dan keuntungan.
4. Grafik penjualan.
5. Grafik keuntungan.
6. Ringkasan biaya.
7. Performa toko.
8. Transaksi terbaru.

KPI harus memiliki:
- Label.
- Nilai.
- Periode.
- Perbandingan jika tersedia.

Jangan menggunakan angka contoh seolah-olah data asli.

### 6.2 Store List

Tampilkan daftar toko dalam bentuk card atau list.

Setiap item:
- Logo atau icon platform.
- Nama toko.
- Platform.
- Status aktif/arsip.
- Ringkasan performa jika diperlukan.
- Tombol detail.

### 6.3 Store Profile

Halaman detail toko memiliki tab:

- Ringkasan.
- Profile Toko.
- Pesanan.
- Keuangan.
- Iklan.

Profile Toko berisi:

**Informasi toko**
- Nama toko.
- Platform.
- Email.
- Nomor HP.

**Informasi pemilik**
- Nama KTP.
- Nomor rekening.

**Informasi akses marketplace**
- Kata sandi.

Aturan UI:
- Field opsional boleh kosong.
- Kata sandi disamarkan secara default.
- Gunakan tombol tampilkan/sembunyikan.
- Jangan tampilkan kata sandi pada list toko.
- Beri peringatan sebelum menampilkan data sensitif.
- Sediakan tombol salin dengan feedback.
- Jangan menyimpan informasi sensitif ke URL atau log.

### 6.4 Order Management

Bagian atas:
- Judul.
- Filter toko.
- Filter status.
- Filter tanggal.
- Search nomor pesanan.
- Tombol tambah pesanan.
- Tombol import.

Tabel desktop:
- Nomor pesanan.
- Toko.
- Tanggal.
- Total.
- Status.
- Aksi.

Mobile:
- Card pesanan.
- Nomor pesanan terlihat jelas.
- Total dan status mudah dipindai.

### 6.5 Product Management

Tampilkan:
- Nama produk.
- SKU.
- Harga jual.
- HPP aktif.
- Margin.
- Status.

Detail produk:
- Informasi utama.
- Varian.
- Riwayat HPP.
- Riwayat harga jual.

### 6.6 Financial Pages

Gunakan pemisahan visual yang jelas untuk:
- Pendapatan.
- Potongan.
- Biaya.
- Refund.
- Pencairan.
- Keuntungan.

Nilai negatif harus mudah dikenali.

Jangan menyatukan seluruh transaksi keuangan menjadi satu angka tanpa rincian.

### 6.7 Reports

- Filter tanggal.
- Filter toko.
- Ringkasan metrik.
- Tabel rincian.
- Grafik bila relevan.
- Export.

Sediakan empty state jika tidak ada data.

## 7. Components

Komponen dasar:

- Button.
- IconButton.
- Input.
- Select.
- DatePicker.
- Modal.
- Drawer.
- Dropdown.
- Tabs.
- Badge.
- KPI Card.
- Data Table.
- Pagination.
- Search.
- Filter Bar.
- Toast.
- Confirm Dialog.
- Empty State.
- Error State.
- Loading Skeleton.
- Chart Container.

Semua komponen harus reusable dan konsisten.

## 8. Interaction Design

### Button

- Primary untuk tindakan utama.
- Secondary untuk tindakan alternatif.
- Danger untuk tindakan destruktif.
- Disabled saat tindakan tidak tersedia.
- Loading saat proses berjalan.

### Forms

- Label selalu terlihat.
- Validasi ditampilkan dekat field.
- Error message harus spesifik.
- Field opsional diberi penanda opsional.
- Jangan menghapus isi form ketika validasi gagal.

### Destructive Actions

Penghapusan toko, pesanan, atau data penting harus memiliki:
- Dialog konfirmasi.
- Penjelasan dampak.
- Tombol batal.
- Tombol konfirmasi yang jelas.

### Feedback

Setiap tindakan penting harus memberikan feedback:
- Berhasil disimpan.
- Gagal disimpan.
- Import selesai.
- Data tidak valid.
- Backup berhasil.

## 9. Responsive & Accessibility

- Target sentuh minimal sekitar 44x44px.
- Kontras teks memadai.
- Fokus keyboard terlihat.
- Form memiliki label.
- Icon button memiliki accessible label.
- Jangan mengandalkan warna saja.
- Layout harus bekerja pada ukuran layar Android umum.

## 10. Offline UI

Tampilkan status penyimpanan lokal secara jelas bila relevan.

Tidak perlu menampilkan indikator internet sebagai syarat penggunaan.

Ketika operasi database berlangsung:
- Tampilkan loading.
- Hindari submit berulang.
- Tampilkan error jika gagal.
- Jangan berpura-pura berhasil.

## 11. Design Quality Checklist

Sebelum halaman dinyatakan selesai:

- Apakah hierarki informasi jelas?
- Apakah tampilan nyaman di ponsel?
- Apakah semua tombol memiliki fungsi?
- Apakah state kosong tersedia?
- Apakah error state tersedia?
- Apakah loading state tersedia?
- Apakah form mudah digunakan?
- Apakah warna konsisten?
- Apakah data sensitif terlindungi?
- Apakah halaman tetap terlihat baik dengan data panjang?
- Apakah halaman tetap terlihat baik tanpa data?

**Prinsip akhir: desain harus membantu pemilik bisnis mengambil keputusan, bukan sekadar terlihat menarik.**