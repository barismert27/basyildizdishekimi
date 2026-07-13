const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_buraya_yazilir_daha_karma_bir_sey_olmali';
const COOKIE_MAX_AGE = 60 * 60 * 1000; // 1 saat (ms)

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const [users] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        const admin = users[0];
        const validPass = await bcrypt.compare(password, admin.password);
        if (!validPass) {
            return res.status(400).json({ success: false, message: 'Hatalı şifre' });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // HttpOnly cookie'ye yaz (XSS'e karşı güvenli)
        res.cookie('adminToken', token, {
            httpOnly: true,          // JS ile okunamaz
            secure: process.env.NODE_ENV === 'production', // Prod'da HTTPS zorunlu
            sameSite: 'strict',      // CSRF koruması
            maxAge: COOKIE_MAX_AGE
        });

        // Frontend için de token dön (localStorage için geriye dönük uyumluluk)
        res.json({ success: true, token, redirectTo: '/yonetim-paneli' });

    } catch (err) {
        console.error('Login hatası: ', err);
        res.status(500).json({ success: false, message: `Login hatası: ${err.message}` });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('adminToken');
    res.json({ success: true, message: 'Çıkış yapıldı' });
};
