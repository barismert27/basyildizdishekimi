require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { initDb } = require('./config/db');

// Global hata yakalayıcılar: Sunucunun çökmesini engeller
process.on('uncaughtException', (err) => {
    console.error('🔥 Kritik Hata (uncaughtException):', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Kritik Hata (unhandledRejection):', reason);
});

const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rotalar
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const articleRoutes = require('./routes/articleRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());   // ← Cookie okuma için gerekli

// Statik Dosyalar (Frontend) — panel.html ve login.html artık burada değil
app.use(express.static(path.join(__dirname, 'public')));
app.use('/resimler', express.static(path.join(__dirname, 'resimler')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Korumalı Sayfa Rotaları (önce gelsin — /login ve /yonetim-paneli)
app.use('/', pageRoutes);

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/articles', articleRoutes);

// Health Check / Uyanık Kal Endpoint'i
app.get('/ping', async (req, res) => {
    try {
        const { pool } = require('./config/db');
        await pool.query('SELECT 1');
        res.status(200).send('Sunucu ve Veritabanı Ayakta!');
    } catch (error) {
        console.error('Healthcheck hatası: ', error.message);
        res.status(500).send('Hata: ' + error.message);
    }
});

// Veritabanını Başlat ve Sunucuyu Dinle
initDb()
    .then(() => {
        console.log('✅ Veritabanı başarıyla başlatıldı.');
    })
    .catch(err => {
        console.error('⚠️ Veritabanı bağlantısı kurulamadı (Çevrimdışı modda çalışılıyor):', err.message);
    });

app.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
    console.log(`🔒 Admin paneli: http://localhost:${PORT}/yonetim-paneli`);
    console.log(`🔑 Login sayfası: http://localhost:${PORT}/login`);
});
