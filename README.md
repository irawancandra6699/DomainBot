# AutoFTbot

AutoFTbot adalah bot Telegram yang memungkinkan pengguna untuk menambahkan dan mengelola catatan DNS menggunakan Cloudflare API. Bot ini menawarkan fungsi untuk menambahkan catatan DNS, melihat daftar catatan DNS, dan menghapus catatan DNS.

## Fitur

- Menambahkan catatan DNS baru.
- Melihat daftar catatan DNS yang ada.
- Menghapus catatan DNS yang tidak diperlukan.

## Cara Instalasi

1. **Clone repository ini:**

    ```bash
    git clone https://github.com/AutoFTbot/DomainBot.git
    ```

2. **Masuk ke direktori proyek:**

    ```bash
    cd DomainBot
    ```

3. **Instal dependencies:**

    ```bash
    npm install
    ```

4. **Konfigurasi:**
   - Gantilah `token`, `apiKey`, `domaincf`, dan `iniemail` dengan nilai Anda sendiri di dalam file kode.

5. **Jalankan bot:**

    ```bash
    node bot.js
    ```

## Cara Menggunakan

1. **Start bot di Telegram:**
   - Kirim `/start` ke bot untuk memulai.
   - Gunakan tombol inline untuk menambahkan IP atau melihat daftar catatan DNS.

2. **Perintah Bot:**
   - **Tambah IP:** Gunakan tombol "𝘗𝘖𝘐𝘕𝘛𝘐𝘕𝘎 𝘋𝘕𝘚" untuk mengirim IP yang ingin didaftarkan.
   - **Daftar DNS:** Gunakan tombol "𝘓𝘪𝘴𝘁 𝘋𝘕𝘚 𝘙𝘦𝘤𝘰𝘳𝘥𝘴/𝘥𝘦𝘭𝘦𝘵𝘦" untuk melihat dan menghapus catatan DNS.

## Kontribusi

Jika Anda ingin berkontribusi pada proyek ini, silakan lakukan fork dan kirim pull request dengan perubahan Anda.

## Lisensi

Proyek ini dilisensikan di bawah MIT License. Lihat file `LICENSE` untuk detail lebih lanjut.
