# Bot WA Tetris Webview

Proyek Bot WhatsApp lengkap dengan Game Tetris Webview & Sistem Kode Klaim Skor.

## Fitur:
- Perintah `.tetris` untuk mendapatkan link game
- Game Tetris interaktif dengan kontrol tombol HP
- Generasi Kode Klaim otomatis setelah Game Over
- Perintah `.klaimtetris <KODE>` untuk menukar skor
- Perintah `.leaderboard` untuk melihat papan peringkat

## Cara Deploy di Render.com:
1. Upload folder/file ini ke GitHub Repository.
2. Buka Render.com, buat **Web Service** baru dari Repository GitHub.
3. Gunakan Build Command: `npm install`
4. Gunakan Start Command: `node index.js`
5. Buka tab **Logs** di Render untuk scan QR Code lewat WhatsApp.
