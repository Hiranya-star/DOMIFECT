# 📘 AI LOGBOOK — Pemanfaatan Kecerdasan Artifisial (DOMIFECT)

* **Nama Aplikasi:** DOMIFECT (*Academic & Vocational Domino Effect Planner*)
* **Nama Siswa / Pengembang:** Hiranya Jasmine Ramadhani
* **Jenjang:** SMA
* **AI yang Digunakan:** Gemini, ChatGPT

## Tahap 1: Eksplorasi Ide & Perancangan Solusi
**Tujuan Interaksi:** Menggali ide dan merancang konsep aplikasi web pengingat jadwal serta tugas sekolah yang berbeda dari aplikasi pencatat biasa, mengingat siswa sering menunda tugas hingga akhirnya menumpuk menjelang tenggat waktu (*deadline*).

* **Prompt / Pertanyaan yang Saya Ajukan ke AI:**
  * Saya menjelaskan permasalahan yang sering dihadapi siswa SMA/SMK, yaitu kebiasaan menunda tugas (*procrastination*), padahal keterlambatan pada satu tugas dapat memicu keteteran pada tugas mata pelajaran lainnya (efek domino).
  * Saya meminta bantuan AI merancang fitur-fitur yang relevan untuk mengatasi masalah tersebut, mulai dari perhitungan sisa waktu aman (*Slack Time*), tombol rencana darurat saat tugas menumpuk (*Panic Button*), pengingat perlengkapan sekolah untuk keesokan harinya, hingga pengingat dengan gaya bahasa berbagai karakter guru.
* **Jawaban / Saran dari AI:**
  * AI menyarankan agar aplikasi dikembangkan dalam bentuk *Progressive Web App* (PWA) menggunakan HTML, CSS, dan JavaScript murni agar ringan diakses melalui ponsel, dapat digunakan secara *offline*, serta dapat dipasang langsung melalui Google Chrome.
  * AI juga mengusulkan konsep 8 karakter guru (*Killer*, *Sarkas*, *Disiplin*, *Ramah*, *Instruktur Bengkel/Lab*, *Silent Killer*, *Motivator*, dan *Custom*) agar pengingat tugas terasa lebih hidup dan mendorong siswa segera bertindak.
* **Validasi & Modifikasi Mandiri:**
  * Saya meninjau kembali setiap fitur yang diusulkan AI agar benar-benar sesuai dengan kebutuhan siswa di sekolah. Saya menambahkan pilihan alasan yang sering dialami siswa pada fitur *Generator Chat Izin Guru* (seperti izin sakit, kendala laptop/alat praktik, dispensasi lomba/OSIS, pemadaman listrik, dan lembur PKL).
  * Saya juga menyesuaikan kategori bobot nilai tugas agar selaras dengan sistem penilaian di sekolah (Tugas Harian 1x, Ulangan 2x, Laporan Praktikum/Project 3x, dan Ujian Praktik/UKK/SAS 4x).

## Tahap 2: Penyusunan Kerangka Kode (*Scaffolding*)
**Tujuan Interaksi:** Menyusun struktur dasar kode HTML, tampilan CSS yang responsif di layar ponsel maupun komputer, serta sistem penyimpanan data lokal di browser.

* **Prompt / Pertanyaan yang Saya Ajukan ke AI:**
  * Saya meminta AI menyusun kerangka awal kode untuk struktur halaman web, pengaturan tata letak tampilan, dan logika penyimpanan datanya.
  * Saat memeriksa struktur berkas di dalam arsip proyek, saya juga meminta AI menampilkan kode mentah `index.html` agar saya dapat memahami susunan elemen-elemen di dalamnya dengan jelas.
* **Jawaban / Saran dari AI:**
  * AI merancang susunan antarmuka web yang dibagi menjadi 8 menu utama: *Beranda*, *Buat Tugas*, *Tugas Aktif*, *Domino*, *Jadwal*, *Teror*, *Fokus*, dan *Profil*.
  * AI menyusun kode CSS yang menyesuaikan ukuran layar secara otomatis (navigasi samping pada layar komputer dan navigasi bawah pada layar ponsel) serta menambahkan fitur pergantian tema *Dark Mode* dan *Light Mode*.
* **Validasi & Modifikasi Mandiri:**
  * Saya memeriksa kesesuaian antara atribut ID pada tombol maupun kolom input di berkas `index.html` dengan fungsi di dalam `app.js` agar seluruh tombol dapat berfungsi tanpa kendala.
  * Saya melakukan uji coba langsung dengan mengisi formulir tugas, jadwal pelajaran, dan daftar perlengkapan di browser untuk memastikan data tersimpan dengan baik di `localStorage` dan tidak hilang saat halaman dimuat ulang.

## Tahap 3: Pemecahan Masalah & Penanganan Galat (*Debugging*)
**Tujuan Interaksi:** Memperbaiki variasi kalimat pengingat yang cepat berulang, mempercepat interval kemunculan notifikasi menjadi setiap 20 detik, serta mengupayakan agar notifikasi tetap berjalan di latar belakang ponsel.

* **Prompt / Pertanyaan yang Saya Ajukan ke AI:**
  * Setelah menguji aplikasi, saya menanyakan interval kemunculan notifikasi pengingat yang sebelumnya masih berjalan setiap 45 detik.
  * Saya meminta AI memperbanyak variasi bank kalimat teror guru agar tidak terasa monoton, mengubah jeda pengecekan notifikasi menjadi setiap **20 detik**, mengatur agar notifikasinya dapat berjalan di latar belakang, dan mengemas ulang seluruh berkas yang telah diperbarui ke dalam format `.zip`.
* **Jawaban / Saran dari AI:**
  * AI memperluas isi `extraTerrorBank` dan `extraTerrorClosers` hingga menghasilkan **400 variasi kalimat unik untuk setiap karakter guru** (total 3.200 kombinasi pesan).
  * AI mengubah interval pengecekan pada fungsi `startWatchdog()` di berkas `app.js` dari `45000` milidetik menjadi `20000` milidetik (20 detik), serta menambahkan sinkronisasi daftar tugas aktif ke berkas `sw.js` (*Service Worker*) agar pengecekan tetap berjalan di latar belakang.
* **Validasi & Modifikasi Mandiri:**
  * Saya mengekstrak berkas ZIP hasil pembaruan dan mengujinya menggunakan tombol **"Tes Pop-up Teror Guru"** pada halaman *Pusat Teror* untuk memastikan pop-up di layar maupun notifikasi browser muncul dengan kalimat yang bervariasi.
  * Saya memeriksa pengaturan izin notifikasi pada browser Chrome di ponsel agar notifikasi pop-up dapat tampil dengan lancar, serta memastikan seluruh berkas (`index.html`, `style.css`, `app.js`, `sw.js`, `manifest.json`, dan ikon) lengkap sebelum diunggah ke GitHub Pages.

## Tahap 4: Refleksi & Penjelasan Kode
**Tujuan Interaksi:** Memastikan saya memahami cara kerja logika program yang ada di dalam website **DOMIFECT**, sehingga tidak sekadar menyalin kode dari AI.

* **Prompt / Pertanyaan yang Saya Ajukan ke AI:**
  * Saya meminta AI merangkum dan menjelaskan kembali fungsi-fungsi utama yang terdapat pada berkas HTML serta mekanisme kerja sistem pengingat waktunya.
* **Jawaban / Saran dari AI:**
  * AI menjelaskan alur perhitungan sisa waktu aman (*slack time*), pengurutan tugas prioritas pada fitur *Panic Button*, serta cara `setInterval` dan *Service Worker* bekerja sama memunculkan notifikasi.
* **Validasi & Modifikasi Mandiri (Pemahaman Saya terhadap Kode):**
  1. **Perhitungan Sisa Waktu Aman (`calculateSlack`):** Saya memahami bahwa fungsi ini menghitung selisih waktu antara *deadline* dan waktu saat ini, kemudian dikurangi estimasi durasi pengerjaan tugas. Apabila hasilnya bernilai 0 atau negatif, tugas otomatis ditandai sebagai jalur kritis. Jika tugas tersebut bergantung pada tugas sebelumnya (`dependsOn`), perhitungannya akan mengikuti batas waktu tugas induknya sehingga efek dominonya dapat terdeteksi.
  2. **Penyusunan Kalimat Teror Guru (`generateTerrorMessage`):** Saya memahami bahwa program memilih kalimat secara acak (`Math.random()`) dari gabungan kalimat pembuka, inti, dan penutup sesuai karakter guru yang dipilih, lalu mengganti penanda `{teacher}`, `{title}`, dan `{subject}` dengan data tugas yang telah diinput.
  3. **Mekanisme Notifikasi 20 Detik (`startWatchdog` & `sw.js`):** Saya memahami bahwa perintah `setInterval(..., 20000)` menjalankan pengecekan daftar tugas setiap 20 detik. Apabila terdapat tugas yang jadwal pengerjaannya kurang dari 30 menit lagi (`diffHours <= 0.5`), aplikasi akan menampilkan pop-up di layar sekaligus mengirimkan data tugas ke *Service Worker* agar notifikasi perangkat tetap muncul.
  4. **Refleksi Pribadi:** Melalui pengembangan proyek ini, saya mempelajari cara memadukan HTML, CSS, dan JavaScript menjadi aplikasi web yang dapat dipasang di ponsel. Kecerdasan artifisial sangat membantu dalam menyusun kerangka kode dan mengatasi kendala teknis, sementara perumusan konsep kebutuhan siswa, pengujian fitur, serta pengecekan akhir tetap saya lakukan secara mandiri.
