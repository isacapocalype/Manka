# Manka — Konveksi Business Manager

Aplikasi manajemen bisnis konveksi yang **offline-first**, tanpa backend, tanpa cloud, dan tanpa login. Seluruh data transaksi tersimpan di perangkat. Dibangun sebagai SPA TypeScript/Vite untuk browser, dibungkus Capacitor untuk Android dengan SQLite native, dan dibungkus Electron untuk Linux sebagai AppImage dengan `sql.js` + IndexedDB.

Dokumen sumber:

- `PRD.md` — kebutuhan produk dan aturan bisnis.
- `DESIGN.md` — arah desain dan tata letak.
- `AI-ANTI-SLOP.md` — aturan kualitas implementasi.

## Fitur

- **Dashboard** — KPI periode/toko, tren penjualan dan laba operasional, ringkasan biaya, performa toko, serta transaksi terbaru.
- **Toko** — multi-toko (Shopee, TikTok Shop, lainnya), profil kontak, password marketplace dan rekening bank terenkripsi, arsip toko.
- **Produk** — SKU unik, kategori/varian, harga jual, HPP, riwayat perubahan HPP dan harga jual.
- **Material & BOM** — bahan baku dengan biaya satuan, komponen material/tenaga kerja/overhead per unit produk, dan HPP otomatis dari BOM.
- **Pesanan** — status internal, item pesanan, diskon penjual/marketplace, ongkir, snapshot HPP permanen, pencarian/filter.
- **Produksi** — work order dari item pesanan atau manual, tahap antrian → potong → jahit → finishing → QC → packing → selesai, PIC/vendor, tenggat, kuantitas lolos/cacat, dan riwayat tahap.
- **Keuangan** — biaya marketplace, iklan (kampanye + biaya), biaya operasional (per toko atau bersama), refund, settlement, kas/rekening (tunai, bank, e-wallet), buku besar, transfer, dan rekonsiliasi.
- **Laporan** — periode hari ini, minggu ini/lalu, 7/30 hari, bulan ini/lalu, tahun ini, dan rentang kustom; semua toko atau per toko; ekspor CSV, XLSX, dan PDF berisi data aktual.
- **Import marketplace** — CSV/XLSX pesanan, laporan biaya, dan laporan settlement dengan pratinjau, pemetaan kolom, validasi per baris, deteksi duplikat, template pemetaan tersimpan, dan eksekusi transaksional.
- **Backup/restore** — snapshot logis seluruh data + kunci enkripsi, dibungkus password, dapat disalin keluar aplikasi.
- **Audit log** — mencatat perubahan data penting dan akses data sensitif tanpa menyimpan nilainya.
- **Responsif** — sidebar desktop dan bottom navigation mobile.
- **Linux** — AppImage x86_64 mandiri untuk CachyOS/Arch dan distro glibc lain; data lokal di direktori konfigurasi pengguna.

## Stack

| Lapisan | Teknologi |
| --- | --- |
| UI | TypeScript, HTML, CSS (tanpa framework UI) |
| Build | Vite, `tsc --noEmit` |
| Database browser & Linux | `sql.js` (SQLite WASM), byte database disimpan di IndexedDB |
| Database Android | `@capacitor-community/sqlite` |
| Android shell | Capacitor 8 |
| Linux shell | Electron 45.3.3, AppImage x86_64 |
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

Build debug sudah diverifikasi dengan JDK 21 dan Android SDK 36: `npx cap sync android` dan `./gradlew assembleDebug` berhasil menghasilkan `app-debug.apk`. APK ditandatangani dengan debug key, bukan untuk Play Store, dan diterbitkan sebagai GitHub Release (prerelease).

## Build Linux (AppImage)

Target Linux resmi hanya **AppImage x86_64** untuk CachyOS/Arch dan distro glibc lain. Tidak ada paket pacman, deb, atau instalasi sistem; aplikasi berjalan langsung dari satu file dan tidak membutuhkan akses root.

Prasyarat: Node.js `^20.19.0` atau `>=22.12.0`, npm, dan koneksi internet saat build untuk mengunduh Electron serta toolset AppImage. Build tidak memerlukan `libfuse2`.

```bash
npm install
npm run linux:build
```

Hasil: `release/Manka-1.0.1-x86_64.AppImage` (nama mengikuti versi di `package.json`).

Menjalankan:

```bash
chmod +x release/Manka-1.0.1-x86_64.AppImage
./release/Manka-1.0.1-x86_64.AppImage
```

AppImage dapat juga dibuka lewat file manager setelah diberi izin eksekusi. Runtime AppImage dibuat statis, sehingga `libfuse2` tidak perlu dipasang. Bila kernel atau lingkungan tidak menyediakan FUSE, gunakan mode ekstraksi:

```bash
APPIMAGE_EXTRACT_AND_RUN=1 ./release/Manka-1.0.1-x86_64.AppImage
```

Perintah pengembangan:

```bash
npm run linux:run   # build web + jalankan Electron dari source
npm run linux:pack  # bungkus ulang tanpa build web
```

Penyimpanan Linux:

- Database SQLite (`sql.js`) disimpan sebagai byte di IndexedDB milik Electron.
- Lokasi data mengikuti `userData` Electron: `~/.config/Manka` (atau `$XDG_CONFIG_HOME/Manka`).
- Jangan membuka dua instance aplikasi sekaligus; instance kedua hanya memfokuskan jendela yang sudah berjalan.
- Jangan menghapus direktori tersebut kecuali setelah membuat backup.
- Ekspor CSV/XLSX/PDF dan backup memakai dialog **Simpan file** native.

### Verifikasi Linux

AppImage `v1.0.1` sudah diuji langsung di CachyOS x86_64 tanpa `libfuse2`: aplikasi terbuka, navigasi **Tambah toko** berfungsi, data toko tersimpan, data tetap ada setelah aplikasi ditutup dan dibuka kembali, serta backup `.manka` dapat diekspor dan dipulihkan.

### Pindah data Android ↔ Linux

Kedua build memakai skema database dan format backup yang sama:

1. Di perangkat asal buka **Pengaturan → Backup**, buat file `.manka`, lalu simpan ke penyimpanan yang dapat dipindahkan.
2. Pindahkan file ke perangkat tujuan.
3. Buka **Pengaturan → Restore**, pilih file, masukkan kata sandi, periksa ringkasan, lalu ketik `PULIHKAN`.
4. Setelah restore, aplikasi kembali ke dashboard dengan seluruh data dan kunci enkripsi dari backup.

Backup memuat kunci enkripsi profil toko. Simpan file dan kata sandinya di tempat aman; siapa pun yang memilikinya dapat membaca seluruh data.

## Aturan Finansial

Semua nominal disimpan sebagai **integer Rupiah**; tidak ada floating point untuk uang. Rumus terpusat di `src/core/calculations/financialCalculations.ts` dan dipakai oleh dashboard, laporan, dan ekspor.

- **Omzet** = harga jual item × kuantitas.
- **Penjualan bersih** = omzet − diskon penjual − refund selesai (refund dihitung satu kali).
- **Diskon marketplace tidak mengurangi pendapatan penjual**; nilainya hanya informasi.
- **HPP** memakai snapshot saat pesanan dibuat/diimpor, sehingga perubahan HPP produk tidak mengubah laba pesanan lama.
- **HPP dari BOM** = Σ(kuantitas material × biaya satuan) + tenaga kerja + overhead per unit. Setiap perubahan BOM atau biaya material mencatat riwayat HPP baru; BOM hanya menghitung biaya, tanpa pencatatan stok.
- **Laba kotor** = penjualan bersih − HPP terjual.
- **Laba operasional** = laba kotor − biaya marketplace aktual − biaya iklan − biaya operasional.
- **Settlement adalah arus kas**, bukan pendapatan; tidak menambah omzet. Settlement diterima wajib memiliki rekening tujuan dan mencatat kas masuk sebesar `total_payout`. Potongan dan refund yang sudah termasuk dalam pencairan tidak membuat kas keluar tambahan.
- **Saldo kas** = saldo awal rekening + seluruh mutasi kas masuk − mutasi kas keluar. Biaya operasional/iklan hanya mengurangi saldo bila ditandai sudah dibayar dengan rekening sumber dana. Refund selesai tanpa settlement mencatat kas keluar bila rekening diisi.
- **Transfer** membuat dua mutasi sekaligus (kas keluar asal dan kas masuk tujuan). **Rekonsiliasi** membandingkan saldo rekening dengan saldo buku; selisih dapat dibukukan sebagai penyesuaian kas. Penyesuaian/transfer tidak memengaruhi omzet atau laba.
- Pesanan `cancelled`, `returned`, dan `refunded` tidak dihitung sebagai penjualan.
- Biaya bersama (tanpa toko) hanya muncul pada total semua toko dan tidak dialokasikan ke toko tertentu.
- ROAS/ACOS menampilkan `N/A` bila tidak ada pendapatan teratribusi.

## Import Marketplace

Halaman: **Pesanan → Import**, **Keuangan → Biaya marketplace → Import laporan**, dan **Keuangan → Settlement → Import laporan**. Format CSV atau XLSX, maksimal 12 MB. Seluruh pemrosesan terjadi di perangkat; tidak ada pengambilan data otomatis dari marketplace.

### Import pesanan

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

### Import biaya marketplace

| Kolom | Wajib | Keterangan |
| --- | --- | --- |
| Nomor pesanan | Ya | Harus sudah ada pada toko yang dipilih |
| Tanggal biaya | Tidak | Default tanggal pesanan |
| Jenis biaya | Tidak | Default `lainnya`; dikenali komisi, promosi, transaksi, layanan, admin |
| Nominal biaya | Ya | Rupiah |
| Catatan | Tidak | Teks |

Biaya disimpan sebagai biaya **aktual** dan terhubung ke pesanan internal. Duplikat dideteksi dari kombinasi pesanan internal + jenis + nominal + tanggal.

### Import settlement

| Kolom | Wajib | Keterangan |
| --- | --- | --- |
| Nomor settlement | Ya | Unik per toko |
| Tanggal settlement | Ya | Format ISO atau format tanggal Indonesia |
| Total penjualan | Tidak | Default `total pencairan + total potongan` |
| Total potongan | Tidak | Default 0 |
| Total pencairan | Ya | Rupiah, dicatat sebagai kas masuk |
| Status | Tidak | Default `diterima`; nilai dikenali diterima/pending |
| Catatan | Tidak | Teks |

Settlement berstatus **diterima** wajib memiliki rekening tujuan dan langsung memposting kas masuk sebesar total pencairan. Settlement pending tidak memposting kas. Peringatan ditampilkan bila `penjualan − potongan ≠ pencairan`.

### Alur dan perilaku

1. Pilih toko (dan rekening tujuan untuk settlement), lalu file.
2. Petakan kolom — auto-deteksi atau pakai template tersimpan.
3. Pratinjau: baris siap, duplikat, dan baris bermasalah ditampilkan terpisah.
4. Eksekusi seluruh baris valid dalam satu transaksi database.
5. Lihat ringkasan hasil dan detail error per baris.

- Baris pesanan dengan nomor sama digabung menjadi satu pesanan (multi-item).
- Data yang sudah ada dilewati, sehingga import ulang tidak menggandakan data.
- Baris gagal tidak membatalkan baris valid; detail error disimpan di riwayat import.
- Nominal dan tanggal divalidasi sebelum penulisan.
- Template pemetaan dikelola di **Lainnya → Template import** (`#/imports/templates`) atau disimpan langsung dari wizard import. Template menyimpan nama kolom per marketplace + jenis import, bukan data transaksi, dan ikut serta dalam backup terenkripsi.

## Backup & Restore

Halaman: **Pengaturan**.

- Backup menghasilkan file `.manka` berisi seluruh tabel data (toko, produk, material, BOM, riwayat HPP/harga, pesanan, item, work order produksi, biaya, iklan, refund, settlement, rekening kas, buku besar, transfer, rekonsiliasi, template import, import, audit, pengaturan) **dan kunci enkripsi profil**.
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
electron/                  Proses utama Electron (protokol manka://, jendela, unduhan)
build/                     Ikon aplikasi untuk Electron/AppImage
release/                   Hasil build AppImage (tidak di-commit)
```

Routing memakai hash (`#/...`) agar kompatibel dengan WebView tanpa server. Rute statis seperti `#/orders/new` didaftarkan sebelum rute `:id`.

## Test

```bash
npm test
```

Mencakup 108 test pada 17 file: kalkulasi finansial, HPP pesanan dan BOM, tanggal/periode, parsing CSV, enkripsi, import pesanan/biaya/settlement (validasi, duplikat, transaksi, template mapping), backup/restore lintas versi skema, produksi, kas/rekening (posting otomatis, transfer, rekonsiliasi), dan normalisasi tautan navigasi hash. Test memakai `sql.js` asli di Node melalui `tests/helpers/testContext.ts`, bukan mock database.

Pemeriksaan akhir yang disarankan:

```bash
npx tsc --noEmit
npm test
npm run build
npx cap sync android
npm run linux:build
```

## Batasan yang Diketahui

- APK debug sudah dapat dibangun dan diterbitkan; verifikasi runtime database SQLite native masih terbatas pada emulator, belum perangkat fisik.
- Adapter web dan alur aplikasi diuji di Chromium; shell Electron dan AppImage diuji langsung di CachyOS x86_64.
- Build Linux hanya menyediakan AppImage x86_64; tidak ada paket instalasi sistem atau build ARM.
- Backup memuat kunci enkripsi, sehingga keamanan file sepenuhnya bergantung pada kekuatan kata sandi backup.
- Aplikasi tidak menyediakan sinkronisasi antarperangkat; pindahkan data hanya melalui backup/restore.
- BOM tidak melacak stok material dan tidak membuat jurnal persediaan; biaya material dihitung langsung dari biaya satuan aktif.
