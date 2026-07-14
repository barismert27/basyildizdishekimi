const { pool } = require('../config/db');
const { sendAppointmentEmail } = require('../utils/mailConfig');

// PUBLIC: Yeni randevu talebi oluştur
exports.createAppointment = async (req, res) => {
    try {
        const { ad, telefon, email, tarih, saat, notlar } = req.body;

        // 1. Temel Validasyonlar
        if (!ad || !telefon || !tarih || !saat) {
            return res.status(400).json({ success: false, message: "Zorunlu alanlar eksik" });
        }

        const temizTelefon = telefon.toString().replace(/\s/g, '');
        if (!/^\d+$/.test(temizTelefon) || temizTelefon.length !== 11) {
            return res.status(400).json({ success: false, message: "Telefon numarası 11 haneli ve sadece rakam olmalıdır" });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Geçersiz e-posta adresi" });
        }

        const temizAd = ad.trim().replace(/[<>]/g, '');
        if (temizAd.length < 2 || temizAd.length > 100) {
            return res.status(400).json({ success: false, message: "Ad soyad 2-100 karakter arasında olmalıdır" });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) {
            return res.status(400).json({ success: false, message: "Geçersiz tarih formatı" });
        }

        if (!/^\d{2}:\d{2}$/.test(saat)) {
            return res.status(400).json({ success: false, message: "Geçersiz saat formatı" });
        }

        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const randevuTarihi = new Date(tarih);
        randevuTarihi.setHours(0, 0, 0, 0);

        if (randevuTarihi < bugun) {
            return res.status(400).json({ success: false, message: "Geçmiş tarih için randevu alınamaz" });
        }

        // 2. Çakışma Kontrolü (Veritabanı) - Hem Approved hem Pending olanları kontrol et
        const [exists] = await pool.query(
            `SELECT id FROM randevular WHERE tarih = ? AND saat = ? AND durum IN ('approved', 'pending')`,
            [tarih, saat]
        );

        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: "Bu tarih ve saat dolu veya onay bekliyor" });
        }

        // 3. Veritabanına Kayıt (Pending olarak)
        const temizNotlar = notlar ? notlar.trim().replace(/[<>]/g, '').substring(0, 300) : null;

        const [result] = await pool.query(
            `INSERT INTO randevular (ad, telefon, email, tarih, saat, notlar, durum) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [temizAd, temizTelefon, email ? email.trim() : null, tarih, saat, temizNotlar]
        );

        // Randevu başarıyla veritabanına kaydedildikten sonra arka planda mail gönder
        sendAppointmentEmail(temizAd, email ? email.trim() : null, tarih, saat);

        res.json({ success: true, message: "Randevu talebiniz alınmıştır.", id: result.insertId });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

// PUBLIC: Belli bir tarihteki dolu saatleri getir
exports.getTimesByDate = async (req, res) => {
    try {
        const { tarih } = req.params;

        const [dbRows] = await pool.query(
            `SELECT saat FROM randevular WHERE tarih = ? AND durum IN ('approved', 'pending')`,
            [tarih]
        );

        // MySQL TIME kolonu "09:00:00" formatında dönüyor — frontend "09:00" ile karşılaştırır
        const alinmisSaatler = dbRows.map(r => String(r.saat).substring(0, 5));

        res.json({ success: true, data: alinmisSaatler });
    } catch (err) {
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};

// PROTECTED: Tüm randevuları listele (Server-Side Pagination + Arama + Filtre)
exports.getAllAppointments = async (req, res) => {
    try {
        const sayfaBasina = parseInt(req.query.limit) || 10;
        const sayfa = Math.max(1, parseInt(req.query.sayfa) || 1);
        const offset = (sayfa - 1) * sayfaBasina;

        const arama = req.query.arama ? req.query.arama.trim() : '';
        const durum = req.query.durum || '';
        const tarihFiltre = req.query.tarihFiltre || '';

        let whereClauses = [];
        let params = [];

        // Arama filtresi (ad veya telefon)
        if (arama) {
            whereClauses.push('(ad LIKE ? OR telefon LIKE ?)');
            params.push(`%${arama}%`, `%${arama}%`);
        }

        // Durum filtresi
        if (durum && ['pending', 'approved', 'cancelled'].includes(durum)) {
            whereClauses.push('durum = ?');
            params.push(durum);
        }

        // Tarih filtresi
        const bugun = new Date();
        const bugunStr = bugun.toISOString().split('T')[0];
        const yarin = new Date(bugun);
        yarin.setDate(yarin.getDate() + 1);
        const yarinStr = yarin.toISOString().split('T')[0];

        if (tarihFiltre === 'bugun') {
            whereClauses.push('tarih = ?');
            params.push(bugunStr);
        } else if (tarihFiltre === 'yarin') {
            whereClauses.push('tarih = ?');
            params.push(yarinStr);
        } else if (tarihFiltre === 'gecmis') {
            whereClauses.push('tarih < ?');
            params.push(bugunStr);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Toplam kayıt sayısı (sayfalama için)
        const [countRows] = await pool.query(
            `SELECT COUNT(*) as toplam FROM randevular ${whereSQL}`,
            params
        );
        const toplam = countRows[0].toplam;

        // Sayfalı veriyi çek
        const [dbRows] = await pool.query(
            `SELECT * FROM randevular ${whereSQL} ORDER BY tarih ASC, saat ASC LIMIT ? OFFSET ?`,
            [...params, sayfaBasina, offset]
        );

        res.json({
            success: true,
            data: dbRows,
            pagination: {
                toplam,
                sayfa,
                toplamSayfa: Math.ceil(toplam / sayfaBasina),
                sayfaBasina
            }
        });
    } catch (err) {
        console.error("getAllAppointments ERROR:", err);
        res.status(500).json({ success: false, message: err.sqlMessage || 'Sunucu hatası' });
    }
};

// PROTECTED: Randevu durumu güncelle
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { durum } = req.body;
        const randevuId = parseInt(id);

        const allowed = ['approved', 'cancelled'];
        if (!allowed.includes(durum)) {
            return res.status(400).json({ success: false, message: "Geçersiz durum" });
        }

        const [randevuRows] = await pool.query("SELECT * FROM randevular WHERE id = ?", [randevuId]);
        if (randevuRows.length === 0) {
            return res.status(404).json({ success: false, message: "Randevu bulunamadı" });
        }
        const randevu = randevuRows[0];

        if (durum === 'approved') {
            const [cakisma] = await pool.query(
                `SELECT id FROM randevular WHERE tarih = ? AND saat = ? AND durum = 'approved' AND id != ?`,
                [randevu.tarih, randevu.saat, randevuId]
            );

            if (cakisma.length > 0) {
                return res.status(400).json({ success: false, message: "Bu tarih ve saat zaten dolu!" });
            }
        }

        await pool.query("UPDATE randevular SET durum = ? WHERE id = ?", [durum, randevuId]);
        res.json({ success: true, message: `Randevu durumu '${durum}' olarak güncellendi` });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};

// PROTECTED: Randevu sil
exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const randevuId = parseInt(id);

        const [result] = await pool.query("DELETE FROM randevular WHERE id = ?", [randevuId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Silinecek randevu bulunamadı" });
        }

        res.json({ success: true, message: "Randevu silindi" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.sqlMessage || "Sunucu hatası" });
    }
};
