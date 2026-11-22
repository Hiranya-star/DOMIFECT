# DOMIFECT (Domino Effect Academic & Vocational Planner)

## 1. Judul & Deskripsi
* **Nama Produk Digital:** DOMIFECT (*Domino Effect Academic & Vocational Planner*)
* **Latar Belakang Masalah:** Sebagai siswa SMA/SMK, saya sering melihat teman-teman maupun diri saya sendiri merasa kewalahan dan stres ketika tugas sekolah menumpuk akibat kebiasaan menunda waktu (*procrastination*). Padahal, keterlambatan pada satu tugas awal—seperti laporan praktikum, tugas proyek, maupun laporan bengkel—sering kali memicu efek berantai (efek domino) yang mengacaukan jadwal tugas mata pelajaran lainnya. Oleh karena itu, saya merancang aplikasi *planner* yang tidak sekadar mencatat daftar tugas, tetapi juga mampu menghitung sisa waktu aman (*slack time*), mengukur tingkat beban mental, serta memberikan pengingat dengan gaya bahasa berbagai karakter guru.
* **Target Pengguna:** Siswa-siswi jenjang SMA dan SMK yang ingin meningkatkan kedisiplinan manajemen waktu, mencegah efek domino keterlambatan tugas, dan menjaga kestabilan nilai rapor.

## 2. Teknologi yang Digunakan
* **Bahasa Pemrograman:** HTML5, CSS3, dan JavaScript (ES6+)
* **Modul / Pustaka:** Vanilla JavaScript, Web Storage API (`localStorage`), Notification API, dan Service Worker API (PWA)
* **Platform Publikasi:** GitHub Pages

## 3. Pemanfaatan AI (*AI Usage Disclosure*)
* **Alat AI yang Digunakan:** Gemini
* **Contoh Perintah (*Prompt*) Utama:**
  * *"Bantu buatkan kerangka dasar HTML dan CSS untuk aplikasi planner tugas sekolah berbasis PWA yang responsif di layar HP dengan tema gelap."*
  * *"Buatkan logika JavaScript untuk menghitung sisa waktu aman (slack time) dan menyusun urutan prioritas tugas berdasarkan bobot nilai rapor."*
  * *"Perbanyak variasi kalimat pengingat untuk 8 karakter guru (Killer, Sarkas, Disiplin, Ramah, Instruktur Bengkel/Lab, Silent Killer, Motivator, dan Custom) agar pesannya tidak terasa monoton."*
* **Penyesuaian / Perbaikan Mandiri:**
  * Pada versi awal, sistem pengecekan notifikasi berjalan setiap 45 detik. Saya melakukan penyesuaian agar interval pengecekan dipercepat menjadi setiap 20 detik serta menyinkronkan daftar tugas aktif ke *Service Worker* (`sw.js`) supaya pengingat tetap berupaya berjalan di latar belakang.
  * Saya juga menyesuaikan fitur *Generator Chat Izin Guru* dengan menambahkan alasan-alasan yang relevan dengan kondisi siswa sekolah (seperti izin sakit, kendala laptop/alat praktik, pemadaman listrik, dispensasi lomba/OSIS, hingga lembur PKL), serta menambahkan tombol bagikan rencana darurat (*Panic Button*) ke WhatsApp.

## 4. Panduan Penggunaan
1. Buka tautan situs web aktif **DOMIFECT** melalui browser di ponsel atau komputer (disarankan menggunakan Google Chrome).
2. Pada halaman **Beranda**, tekan tombol **"Aktifkan Notifikasi"** dan izinkan permintaan notifikasi browser agar pengingat tugas dapat muncul.
3. Pilih menu **Buat Tugas**, lalu lengkapi formulir tugas (nama tugas, mata pelajaran, nama guru, bobot nilai rapor, karakter teror guru, jadwal mulai kerja, serta tenggat waktu/*deadline*).
4. Buka menu **Tugas Aktif** untuk memantau progres pengerjaan, mencentang rincian langkah kecil (*micro-tasks*), atau menekan tombol **Fokus** untuk menggunakan pengatur waktu belajar.
5. Gunakan menu **Domino** untuk melakukan simulasi dampak keterlambatan tugas, atau tekan **Panic Button** di halaman utama saat membutuhkan urutan pengerjaan tugas secara darurat.

## 5. Identitas Pengembang
* **Nama Lengkap:** Hiranya Jasmine Ramadhani
* **Kelas:** *X*
* **Asal Sekolah:** *SMA NEGERI 1 BLITAR*
