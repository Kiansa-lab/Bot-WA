const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Sementara
const claimCodes = {};
const leaderboard = {};

// API Webview Tetris saat Game Over
app.post('/api/save-score', (req, res) => {
    const { score, lines } = req.body;
    
    // Bikin kode unik 6 karakter (Misal: N2EZFV)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    claimCodes[code] = {
        score: score || 0,
        lines: lines || 0,
        used: false
    };

    res.json({ success: true, code: code });
});

app.listen(PORT, () => {
    console.log(`Server Game Tetris berjalan di port ${PORT}`);
});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session_bot');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            const from = msg.key.remoteJid;

            // 1. Minta Link Tetris
            if (text.toLowerCase() === '.tetris') {
                const host = process.env.RENDER_EXTERNAL_HOSTNAME 
                    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` 
                    : `http://localhost:${PORT}`;
                await sock.sendMessage(from, {
                    text: `🕹️ *TETRIS GAME*\n\nMainkan game Tetris di link ini:\n${host}\n\nKumpulkan skor terbanyak dan klaim kodenya dengan cara ketik:\n*.klaimtetris <KODE_KLAIM>*`
                });
            }

            // 2. Klaim Skor (.klaimtetris KODE)
            if (text.toLowerCase().startsWith('.klaimtetris ')) {
                const code = text.split(' ')[1]?.toUpperCase();

                if (!code || !claimCodes[code]) {
                    return sock.sendMessage(from, { text: '❌ Kode klaim salah atau tidak ditemukan!' });
                }

                if (claimCodes[code].used) {
                    return sock.sendMessage(from, { text: '⚠️ Kode klaim ini sudah pernah digunakan!' });
                }

                claimCodes[code].used = true;
                const addedScore = claimCodes[code].score;

                leaderboard[from] = (leaderboard[from] || 0) + addedScore;

                await sock.sendMessage(from, {
                    text: `🎉 *TUKAR SKOR BERHASIL!*\n\n+${addedScore} poin ditambahkan ke akunmu!\nTotal Skor Kamu: *${leaderboard[from]}*`
                });
            }

            // 3. Papan Peringkat (.leaderboard)
            if (text.toLowerCase() === '.leaderboard') {
                let textLb = '🏆 *PAPAN PERINGKAT* 🏆\n\n';
                const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);

                if (sorted.length === 0) {
                    textLb += 'Belum ada pemain yang mengklaim skor.';
                } else {
                    sorted.forEach(([jid, score], index) => {
                        const num = jid.split('@')[0];
                        textLb += `${index + 1}. ${num.substring(0, 6)}*** : ${score} poin\n`;
                    });
                }

                await sock.sendMessage(from, { text: textLb });
            }
        }
    });
}

startBot();
