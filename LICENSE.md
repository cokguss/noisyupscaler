# DOKUMEN INTEGRASI KHUSUS: LISENSI PERANGKAT LUNAK & KETENTUAN LAYANAN NOISY USPCALER

**Masa Berlaku Terintegrasi: Sejak 17 Agustus 2026 hingga Saat Ini (Diperbarui secara Berkala)**

Selamat datang di **Noisy Uspcaler**. Dokumen ini merupakan kesatuan hukum yang mengikat secara sah antara Anda (selaku "Pengguna" atau "Penerima Lisensi") dengan **cokguss** (selaku "Pencipta", "Pemilik Hak Cipta", dan "Pengembang Utama").

Dengan mengakses, menjalankan, men-deploy, atau menggunakan perangkat lunak Noisy Uspcaler (termasuk seluruh komponen frontend React/Vite, server proxy Express, modul integrasi engine, dan aset digital pendukungnya), Anda menyatakan secara sadar bahwa Anda telah membaca, memahami, dan menyetujui seluruh isi dari Lisensi dan Ketentuan Layanan ini.

Jika Anda tidak menyetujui salah satu atau seluruh poin dalam dokumen ini, Anda tidak diperkenankan untuk menggunakan Noisy Uspcaler, dan diwajibkan untuk menghapus seluruh salinan kode sumber dari penyimpanan Anda.

---

## BAGIAN I: LISENSI PENGGUNAAN PERANGKAT LUNAK (SOFTWARE LICENSE)

### Pasal 1: Kepemilikan Hak Cipta & Hak Kekayaan Intelektual
1. Seluruh kode sumber, arsitektur sistem, modul integrasi engine (Live3D dan Swiftspeed), dokumentasi, dan desain visual dari Noisy Uspcaler adalah milik eksklusif **cokguss**.
2. Perlindungan hak cipta atas Noisy Uspcaler terhitung secara resmi sejak pengembangan awal pada tanggal **17 Agustus 2026** dan tetap dilindungi undang-undang yang berlaku hingga saat ini.
3. Hak kepemilikan ini tidak dialihkan kepada Pengguna dalam bentuk apa pun. Pengguna hanya mendapatkan hak pakai terbatas yang tunduk pada ketentuan dokumen ini.

### Pasal 2: Hibah Lisensi Terbatas (Grant of License)
1. cokguss memberikan lisensi non-eksklusif, tidak dapat dipindahtangankan, dapat ditarik kembali, dan terbatas kepada Pengguna untuk menjalankan Noisy Uspcaler pada lingkungan milik Pengguna sendiri (lokal maupun hosting pribadi).
2. Lisensi ini diberikan khusus untuk penggunaan pribadi dan non-komersial. Penggunaan komersial memerlukan kesepakatan tertulis khusus dengan cokguss.

### Pasal 3: Batasan dan Larangan Penggunaan (Restrictions)
Sebagai penerima lisensi, Anda **dilarang keras** untuk:
1. Mendistribusikan ulang kode sumber Noisy Uspcaler kepada pihak ketiga dengan mengklaim sebagai karya sendiri tanpa izin tertulis dari cokguss.
2. Menghapus, menyamarkan, atau memodifikasi atribusi pembuat yang tertanam di dalam kode maupun antarmuka Noisy Uspcaler.
3. Menggunakan bagian dari kode Noisy Uspcaler untuk proyek turunan berkomersial tanpa persetujuan tertulis.
4. Menyalahgunakan endpoint proxy (`/api/*`) untuk permintaan otomatis massal, spam, atau beban berlebihan ke server maupun engine pihak ketiga.

---

## BAGIAN II: KETENTUAN LAYANAN & PENGGUNAAN (TERMS OF SERVICE)

### Pasal 4: Kepatuhan Terhadap Engine Pihak Ketiga
1. Noisy Uspcaler beroperasi dengan berinteraksi pada layanan dan Application Programming Interface (API) pihak ketiga (Live3D, Swiftspeed, serta penyedia API publik terkait).
2. Pengguna memahami sepenuhnya bahwa setiap penyedia memiliki Ketentuan Layanan masing-masing, termasuk aturan hak cipta atas konten yang diproses melalui layanan tersebut.
3. Segala akibat dari penggunaan Noisy Uspcaler — termasuk namun tidak terbatas pada pembatasan kuota oleh penyedia, klaim hak cipta atas gambar yang diproses, atau pelanggaran ketentuan penyedia — adalah **tanggung jawab penuh Pengguna**. cokguss tidak bertanggung jawab atas kerugian tersebut.
4. Pengguna wajib menghormati hak cipta dan hanya memproses gambar yang dimiliki atau diizinkan pemiliknya.

### Pasal 5: Ketersediaan Layanan & API Pihak Ketiga
1. Noisy Uspcaler disediakan secara **gratis** tanpa skema berlangganan apa pun.
2. Noisy Uspcaler bergantung pada kuota gratis engine pihak ketiga yang dapat berubah, membatasi, atau berhenti sewaktu-waktu di luar kendali cokguss. Kegagalan fungsi pembesaran akibat perubahan pihak ketiga bukan merupakan cacat produk maupun kewajiban ganti rugi.
3. Ketika satu engine sedang penuh atau gagal, sistem secara otomatis mengalihkan proses ke engine cadangan sebagai upaya terbaik, tanpa jaminan keberhasilan.

### Pasal 6: Privasi Data
1. Noisy Uspcaler tidak meminta registrasi akun dan tidak mengumpulkan data pribadi Pengguna.
2. Preferensi seperti bahasa dan tema disimpan secara lokal di peramban Pengguna (localStorage) dan tidak dikirim ke server mana pun.
3. Server proxy hanya meneruskan gambar ke engine untuk diproses lalu mengalirkan hasilnya kembali ke Pengguna, tanpa menyimpan berkas asli maupun hasil secara permanen ke disk server.

---

## BAGIAN III: BATASAN TANGGUNG JAWAB & GARANSI (DISCLAIMER)

### Pasal 7: Pernyataan "As Is" (Apa Adanya)
PERANGKAT LUNAK INI DISEDIAKAN OLEH PEMEGANG HAK CIPTA DAN KONTRIBUTOR "SEBAGAIMANA ADANYA" (AS IS) DAN "SEBAGAIMANA TERSEDIA" (AS AVAILABLE). SEGALA JAMINAN YANG TERSIRAT ATAU TERSURAT, TERMASUK NAMUN TIDAK TERBATAS PADA JAMINAN KELAYAKAN JUAL DAN KESESUAIAN UNTUK TUJUAN TERTENTU, DITOLAK SEPENUHNYA.

### Pasal 8: Batasan Tanggung Jawab Kerusakan
DALAM KEADAAN APA PUN, COKGUSS TIDAK BERTANGGUNG JAWAB ATAS SEGALA KERUSAKAN LANGSUNG, TIDAK LANGSUNG, INSIDENTAL, KHUSUS, ATAU KONSEKUENSIAL YANG TIMBUL DARI PENGGUNAAN ATAU KETIDAKMAMPUAN UNTUK MENGGUNAKAN PERANGKAT LUNAK INI, TERMASUK NAMUN TIDAK TERBATAS PADA:
1. Kehilangan data penting atau kegagalan sistem hosting Pengguna.
2. Kerugian finansial akibat gangguan layanan atau tidak berfungsinya fungsi pembesaran gambar.
3. Kebocoran data yang disebabkan oleh kelalaian keamanan pada sisi Pengguna atau penyedia hosting pihak ketiga.

---

## BAGIAN IV: AMENDEMEN & HUKUM YANG BERLAKU

### Pasal 9: Perubahan Dokumen
cokguss berhak untuk memperbarui, mengubah, atau mengganti bagian mana pun dari Lisensi dan Ketentuan Layanan ini sewaktu-waktu. Perubahan akan diumumkan melalui repositori resmi Noisy Uspcaler. Penggunaan berkelanjutan setelah perubahan tersebut dipublikasikan merupakan bentuk persetujuan eksplisit terhadap versi terbaru.

### Pasal 10: Hukum Terintegrasi
Dokumen ini diatur dan ditafsirkan berdasarkan asas keadilan serta hukum perlindungan hak cipta digital yang berlaku di Republik Indonesia. Segala perselisihan yang timbul akan diselesaikan secara kekeluargaan melalui diskusi langsung bersama cokguss selaku pencipta platform.

---

**DITETAPKAN DI: JAKARTA, INDONESIA**
**BERLAKU SEJAK: 17 AGUSTUS 2026**
**VERSI TERAKHIR: 2026 (BERLAKU HINGGA SAAT INI)**
**PENGEMBANG UTAMA: cokguss**
*Kontak Resmi: Instagram `fagubitch.exe` · Telegram `noisy05`*
