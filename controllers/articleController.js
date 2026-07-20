const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');

async function getMakaleler(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT id, baslik, icerik, kapak_resmi, olusturma_tarihi FROM makaleler ORDER BY olusturma_tarihi DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function getMakale(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM makaleler WHERE id = ?', [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Makale bulunamadı' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
async function createMakale(req, res) {
    try {
        const { baslik, icerik } = req.body;
        if (!baslik || !icerik) {
            return res.status(400).json({ success: false, message: 'Başlık ve içerik zorunludur.' });
        }
        const kapak_resmi = req.file ? `/uploads/${req.file.filename}` : null;
        const [result] = await pool.query(
            'INSERT INTO makaleler (baslik, icerik, kapak_resmi) VALUES (?, ?, ?)',
            [baslik, icerik, kapak_resmi]
        );
        res.json({ success: true, id: result.insertId, message: 'Makale başarıyla oluşturuldu.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function updateMakale(req, res) {
    try {
        const { baslik, icerik } = req.body;
        const id = req.params.id;

        const [existing] = await pool.query('SELECT * FROM makaleler WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Makale bulunamadı' });

        let kapak_resmi = existing[0].kapak_resmi;
        if (req.file) {
            if (kapak_resmi) {
                const oldPath = path.join(__dirname, '../public', kapak_resmi);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            kapak_resmi = `/uploads/${req.file.filename}`;
        }

        await pool.query(
            'UPDATE makaleler SET baslik = ?, icerik = ?, kapak_resmi = ? WHERE id = ?',
            [baslik, icerik, kapak_resmi, id]
        );
        res.json({ success: true, message: 'Makale güncellendi.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function deleteMakale(req, res) {
    try {
        const [existing] = await pool.query('SELECT * FROM makaleler WHERE id = ?', [req.params.id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Makale bulunamadı' });

        if (existing[0].kapak_resmi) {
            const filePath = path.join(__dirname, '../public', existing[0].kapak_resmi);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await pool.query('DELETE FROM makaleler WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Makale silindi.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getMakaleler, getMakale, createMakale, updateMakale, deleteMakale };
