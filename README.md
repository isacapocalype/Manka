# Manka — Konveksi Business Manager

Aplikasi manajemen bisnis konveksi yang **offline-first**, tanpa backend, tanpa cloud, dan tanpa login. Seluruh data transaksi tersimpan di perangkat. Dibangun sebagai SPA TypeScript/Vite untuk browser dan dibungkus Capacitor untuk Android dengan SQLite native.

Dokumen sumber:

- `PRD.md` — kebutuhan produk dan aturan bisnis.
- `DESIGN.md` — arah desain dan tata letak.
- `AI-ANTI-SLOP.md` — aturan kualitas implementasi.

## Fitur

- **Dashboard** — KPI periode/toko, tren penjualan dan laba operasional, ringkasan biaya, performa toko, serta transaksi terbaru.
- **Toko** — multi-toko (Shopee, TikTok Shop, lainnya), profil kontak, password marketplace dan rekening bank terenkripsi, arsip toko.
- **Produk** — SKU unik, kategori/varian, harga jual, HPP, riwayat perubahan HPP dan harga jual.
- **Pesanan** — status internal, item pesanan, diskon penjual/marketplace, ongkir, snapshot HPP permanen, pencarian/filter.
- **Keuangan** — biaya marketplace, iklan (kampanye + biaya), biaya operasional (per toko atau bersama), refund, settlement.
- **Laporan** — periode hari ini, minggu ini/lalu, 7/30 hari, bulan ini/lalu, tahun ini, dan rentang kustom; semua toko atau per toko; ekspor CSV, XLSX, dan PDF berisi data aktual.
- **Import pesanan** — CSV/XLSX dengan pratinjau, pemetaan kolom, validasi per baris, deteksi duplikat, dan eksekusi transaksional.
- **Backup/restore** — snapshot logis seluruh data + kunci enkripsi, dibungkus password, dapat disalin keluar aplikasi.
- **Audit log** — mencatat perubahan data penting dan akses data sensitif tanpa menyimpan nilainya.
- **Responsif** — sidebar desktop dan bottom navigation mobile.

## Stack

| Lapisan | Teknologi |
| --- | --- |
| UI | TypeScript, HTML, CSS (tanpa framework UI) |
| Build | Vite, `tsc --noEmit` |
| Database browser | `sql.js` (SQLite WASM), byte database disimpan di IndexedDB |
| Database Android | `@capacitor-community/sqlite` |
| Android shell | Capacitor 8 |
| Enkripsi | Web Crypto AES-GCM 256, kunci acak per perangkat via Capacitor Preferences |
| Ekspor | ExcelJS, jsPDF + autotable |
| Grafik | Chart.js |
| Ikon/font | Lucide, Inter (lokal melalui paket npm) |
| Test | Vitest dengan `sql.js` asli di Node |

Tidak ada permintaan jaringan saat runtime. Semua aset dibundel secara lokal.

## Menjalankan di Browser

Prasyarat: Node.js `^20.19.0` atau `>=22.12.0` (sesuai kebutuhan Vite 8) dan npm.

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Di browser, database SQLite disimpan sebagai byte di IndexedDB dengan nama `manka-local-database`, sehingga data tetap ada setelah reload. Indikator **SQLite dev** muncul di sidebar.

> Inkognito/private mode atau pemblokiran IndexedDB akan membuat data tidak persisten. Jangan membuka aplikasi di dua tab sekaligus karena masing-masing tab memegang salinan database.

Perintah lain:

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # typecheck + build produksi ke dist/
npm run preview     # pratinjau hasil build
```

## Build Android

Prasyarat: JDK 21 dan Android SDK (platform 36, build-tools), dengan `ANDROID_HOME`/`ANDROID_SDK_ROOT` disetel.

```bash
npm run build
npx cap sync android
npx cap open android     # buka Android Studio
# atau
npm run android:build    # build web + sync + ./gradlew assembleDebug
```

Hasil APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`.

Konfigurasi Android:

- App ID: `id.manka.konveksi`
- minSdk 24, compileSdk/targetSdk 36
- Gradle 8.14.3, AGP 8.13.0
- Plugin yang tersinkron: SQLite, Filesystem, Preferences, Share

### Status verifikasi Android

Proyek Android dan `npx cap sync android` sudah berhasil, tetapi **kompilasi APK belum dapat diverifikasi di lingkungan ini** karena JDK dan Android SDK tidak tersedia (`java: command not found`, `ANDROID_HOME`/`ANDROID_SDK_ROOT` kosong). Jalankan `npm run android:build` pada mesin dengan toolchain lengkap sebelum distribusi. Verifikasi runtime SQLite native juga hanya dapat dilakukan di perangkat/emulator.

## Aturan Finansial

Semua nominal disimpan sebagai **integer Rupiah**; tidak ada floating point untuk uang. Rumus terpusat di `src/core/calculations/financialCalculations.ts` dan dipakai oleh dashboard, laporan, dan ekspor.

- **Omzet** = harga jual item × kuantitas.
- **Penjualan bersih** = omzet − diskon penjual − refund selesai (refund dihitung satu kali).
- **Diskon marketplace tidak mengurangi pendapatan penjual**; nilainya hanya informasi.
- **HPP** memakai snapshot saat pesanan dibuat/diimpor, sehingga perubahan HPP produk tidak mengubah laba pesanan lama.
- **Laba kotor** = penjualan bersih − HPP terjual.
- **Laba operasional** = laba kotor − biaya marketplace aktual − biaya iklan − biaya operasional.
- **Settlement adalah arus kas**, bukan pendapatan; tidak menambah omzet.
- Pesanan `cancelled`, `returned`, dan `refunded` tidak dihitung sebagai penjualan.
- Biaya bersama (tanpa toko) hanya muncul pada total semua toko dan tidak dialokasikan ke toko tertentu.
- ROAS/ACOS menampilkan `N/A` bila tidak ada pendapatan teratribusi.

## Import Pesanan

Halaman: **Pesanan → Import**. Format CSV atau XLSX, maksimal 12 MB.

Kolom yang dikenali (header fleksibel, dapat dipetakan manual):

| Kolom | Wajib | Keterangan |
| --- | --- | --- |
| Nomor pesanan | Ya | Dikelompokkan per nomor + toko |
| Tanggal pesanan | Ya | Format ISO atau format tanggal Indonesia |
| Status | Tidak | Dipetakan ke status internal |
| Nama produk / SKU | Minimal salah satu | Untuk mencocokkan produk |
| Kuantitas | Ya | Bilangan bulat > 0 |
| Harga satuan | Ya | Rupiah |
| HPP | Tidak | Bila kosong memakai HPP produk |
| Diskon penjual / marketplace | Tidak | Rupiah |
| Ongkir dibayar pembeli | Tidak | Rupiah |
| Biaya marketplace | Tidak | Rupiah |
| Nilai refund / jumlah refund | Tidak | Refund selesai |
| Catatan | Tidak | Teks |

Alur:

1. Pilih toko dan file.
2. Pratinjau baris + deteksi duplikat dan error.
3. Petakan kolom yang tidak terdeteksi otomatis.
4. Eksekusi dalam satu transaksi.
5. Lihat ringkasan hasil dan detail error per baris.

Perilaku:

- Baris dengan nomor pesanan sama digabung menjadi satu pesanan (multi-item).
- Pesanan yang sudah ada dilewati, sehingga import ulang tidak menggandakan data.
- Produk tidak dikenal tetap diimpor dengan HPP 0 dan peringatan.
- Baris gagal tidak membatalkan baris valid; detail error disimpan di riwayat import.
- Nominal dan tanggal divalidasi sebelum penulisan.

## Backup & Restore

Halaman: **Pengaturan**.

- Backup menghasilkan file `.manka` berisi seluruh tabel data (toko, produk, riwayat HPP/harga, pesanan, item, biaya, iklan, refund, settlement, import, audit, pengaturan) **dan kunci enkripsi profil**.
- File adalah envelope JSON `format: "manka-backup", version: 1` dengan PBKDF2-SHA-256 dan AES-GCM. Kata sandi minimal 8 karakter.
- Di browser file diunduh; di Android file ditulis ke Cache lalu dibagikan melalui Share sheet agar dapat disimpan keluar aplikasi.
- Restore selalu **inspeksi dulu**: file dan sandi divalidasi, versi skema diperiksa, ringkasan tabel ditampilkan. Pengguna harus mengetik `PULIHKAN` sebelum data diganti.
- Restore berjalan dalam satu transaksi: semua tabel lama dihapus, data backup dimasukkan, kunci enkripsi perangkat diganti, lalu aplikasi kembali ke dashboard.
- Backup dari versi skema yang lebih baru ditolak dengan pesan pembaruan aplikasi.

**Simpan file backup dan kata sandinya di tempat aman.** Siapa pun yang memiliki file dan sandi dapat membaca seluruh data, termasuk profil toko.

## Keamanan Profil Toko

- Password marketplace dan rekening bank dienkripsi AES-GCM 256 sebelum masuk database (`v1:iv:cipher`).
- Kunci dibuat acak di perangkat dan disimpan terpisah dari database melalui Capacitor Preferences.
- Nilai sensitif tidak pernah dirender sampai pengguna menekan **Tampilkan** dan mengonfirmasi.
- Aksi tampil/salin dicatat di audit log **tanpa nilai sensitif**.
- Nilai sensitif tidak masuk URL, log konsol, laporan, atau ekspor.
- Restore backup memulihkan kunci enkripsi yang sesuai agar profil tetap dapat dibuka.

Catatan: ini melindungi data saat tersimpan, bukan dari perangkat yang sudah di-root atau malware dengan akses penuh. Untuk produksi, pertimbangkan enkripsi database native dan hardening perangkat.

## Struktur Proyek

```text
database/migrations/       Skema SQL dan migrasi berversi
src/app/                   Bootstrap, router hash, layout, registry halaman
src/components/ui/         Komponen UI, ikon, grafik, toast, filter
src/core/calculations/     Rumus finansial, HPP produk, kalkulasi pesanan
src/core/crypto/           Enkripsi AES-GCM, backup envelope, secret store
src/core/database/         Adapter SQLite web (sql.js) dan native (Capacitor)
src/core/repositories/     Akses tabel dan transaksi
src/core/services/         Logika aplikasi: toko, pesanan, impor, backup, laporan
src/core/import-export/    Parser CSV/XLSX, ekspor laporan, penyimpanan file
src/modules/               Halaman per modul (dashboard, toko, produk, dst.)
src/styles/                CSS responsif dan token desain
tests/                     Test Vitest dengan database sql.js asli
android/                   Proyek Capacitor Android
```

Routing memakai hash (`#/...`) agar kompatibel dengan WebView tanpa server. Rute statis seperti `#/orders/new` didaftarkan sebelum rute `:id`.

## Test

```bash
npm test
```

Mencakup 48 test pada 7 file: kalkulasi finansial, HPP pesanan, tanggal/periode, parsing CSV, enkripsi, import (validasi/duplikat/transaksi), dan backup/restore. Test memakai `sql.js` asli di Node melalui `tests/helpers/testContext.ts`, bukan mock database.

Pemeriksaan akhir yang disarankan:

```bash
npx tsc --noEmit
npm test
npm run build
npx cap sync android
```

## Batasan yang Diketahui

- APK belum dikompilasi/diuji di lingkungan ini karena toolchain Java/Android tidak tersedia.
- Database native belum diuji runtime di perangkat; adapter web dan seluruh alur aplikasi diuji di Chromium.
- Backup memuat kunci enkripsi, sehingga keamanan file sepenuhnya bergantung pada kekuatan kata sandi backup.
- Aplikasi tidak menyediakan sinkronisasi antarperangkat; pindahkan data hanya melalui backup/restore.
