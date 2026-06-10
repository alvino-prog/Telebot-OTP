=======================================================================
               PANDUAN LENGKAP KONFIGURASI & LOGIKA MARKUP
                        "GANYU MD / FASTCAL SHOP"
=======================================================================

File konfigurasi (config.js) adalah "otak bisnis" dari bot kamu. Di sini 
kamu bisa mengatur keuntungan, biaya admin deposit, token bot, hingga 
efek animasi menu tanpa harus membongkar kode utama bot.

-----------------------------------------------------------------------
1. PENJELASAN SETIAP VARIABEL (ARTI KODE)
-----------------------------------------------------------------------

* const TOKEN = 'YOUR_BOT_TOKEN';
  -> Tempat menaruh token bot Telegram kamu yang didapat dari @BotFather.

* const CHANNEL_ID = '@YOUR_CHANNEL';
  -> Username channel Telegram kamu (diawali @). Digunakan untuk mengirim 
     log transaksi, riwayat deposit, atau update stok otomatis ke publik, jangan lupa masukin bot kamu ke channel telegram kamu jadikan admin berikan izin semua sebagai admin

* const OWNER_ID = 12345678;
  -> ID Telegram kamu sebagai pemilik/owner. Hanya ID ini yang bisa 
     mengakses menu admin/owner untuk cek saldo supplier atau broadcast.

* const NOKOS_API_KEY = 'YOUR_API';
  -> Kunci API (API Key) dari provider https://apifastcal.nokos.top/
     nomor kosong secara otomatis.

* const MIN_DEPOSIT = 2000;
  -> Batas minimal user bisa melakukan deposit saldo di bot (Rp 2.000).

* const MAX_DEPOSIT = 20000;
  -> Batas maksimal sekali deposit dalam satu transaksi (Rp 20.000).

* const ORDER_MARKUP_PERCENT = 30;
  -> Persentase keuntungan (markup) yang kamu ambil dari harga asli supplier.

* const DEPOSIT_MARKUP_PERCENT = 10;
  -> Persentase biaya admin yang ditambahkan saat user melakukan deposit.

* const DEPOSIT_OPTIONS = [2000, 5000, 10000, 15000, 20000];
  -> Pilihan nominal instan (tombol inline keyboard) yang muncul di bot 
     saat user ingin deposit.

* const MENU_EFFECTS = [ ... ];
  -> Kumpulan ID emoji premium / efek animasi yang akan muncul secara acak 
     saat menu bot dibuka agar tampilan chat terlihat keren dan premium.


-----------------------------------------------------------------------
2. CARA KERJA & RUMUS HITUNGAN (BIAR GAK BINGUNG)
-----------------------------------------------------------------------

A. PERHITUNGAN HARGA JUAL NOKOS (ORDER)
   Fungsi: calculateOrderPrice()
   Sistem menggunakan perintah `Math.ceil()`. Fungsinya adalah membulatkan 
   angka desimal (koma) ke atas menjadi angka bulat terdekat, supaya kamu 
   tidak rugi akibat pecahan rupiah.

   Contoh Kasus:
   - Kamu cek stok nokos Telegram di supplier, harga modalnya = Rp 3.500.
   - Karena `ORDER_MARKUP_PERCENT = 30`, maka bot menghitung:
     Harga Jual = Harga Modal + 30%
     Harga Jual = 3.500 * (1 + 30 / 100)
                = 3.500 * 1.3
                = 4.550
   - Hasil di Bot User: Muncul harga Rp 4.550.
   - Keuntungan Bersih Kamu: Rp 4.550 - Rp 3.500 = Rp 1.050 per nomor.

B. PERHITUNGAN TOTAL TRANSFER DEPOSIT
   Fungsi: calculateDepositAmount()
   Digunakan untuk menambah biaya admin (misal untuk menutupi potongan 
   rate e-wallet DANA / SeaBank kamu).

   Contoh Kasus:
   - User ingin mengisi saldo bot sebesar Rp 10.000.
   - Karena `DEPOSIT_MARKUP_PERCENT = 10`, maka bot menghitung:
     Total Bayar = Nominal Saldo + 10%
     Total Bayar = 10.000 * (1 + 10 / 100)
                 = 10.000 * 1.1
                 = 11.000
   - Hasil di Bot User: Bot menyuruh user mentransfer Rp 11.000.
   - Setelah sukses, saldo yang masuk ke akun bot user tetap Rp 10.000, 
     dan Rp 1.000 masuk ke kamu sebagai biaya admin.


-----------------------------------------------------------------------
3. CARA MERUBAH / MENYESUAIKAN SETTINGAN
-----------------------------------------------------------------------

Jika kamu ingin mengubah harga atau setelan bot, kamu CUKUP mengubah angka/teks 
di dalam file ini saja. Tidak perlu mengubah file logic code utama bot.

* Cara Menaikkan Keuntungan Nokos menjadi 50%:
  Cari baris `ORDER_MARKUP_PERCENT`, ubah angkanya dari 30 menjadi 50.
  Contoh: `const ORDER_MARKUP_PERCENT = 50;`

* Cara Menggratiskan Biaya Admin Deposit (Tanpa Markup):
  Jika kamu ingin user transfer Rp 10.000 dan dapat saldo Rp 10.000 tanpa biaya, 
  ubah persenan deposit menjadi 0.
  Contoh: `const DEPOSIT_MARKUP_PERCENT = 0;`

* Cara Mengubah Batas Minimal & Maksimal Deposit:
  Tinggal sesuaikan angka rupiahnya tanpa tanda titik atau koma.
  Contoh jika minimal Rp 5.000 dan maksimal Rp 50.000:
  `const MIN_DEPOSIT = 5000;`
  `const MAX_DEPOSIT = 50000;`

* Cara Mengubah Pilihan Tombol Nominal Deposit:
  Sesuaikan angka di dalam kurung siku `[ ]` dipisahkan dengan tanda koma.
  Contoh: `const DEPOSIT_OPTIONS = [5000, 10000, 25000, 50000];`

-----------------------------------------------------------------------
Catatan Penting: Setiap kali kamu mengubah isi file konfigurasi ini, 
pastikan untuk me-RESTART bot kamu di VPS atau Panel Pterodactyl agar 
perubahannya langsung diterapkan oleh sistem!
=======================================================================
