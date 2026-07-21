require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    port: process.env.DB_PORT || 3306,
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'randevu',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

async function initDb() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ MySQL bağlantısı başarılı!');

        // Admins tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Default admin var mı?
        const [rows] = await pool.query("SELECT * FROM admins WHERE username = 'admin'");
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash("12345", 10);
            await pool.query("INSERT INTO admins (username, password) VALUES (?, ?)", ["admin", hashedPassword]);
            console.log("✅ Default admin kullanıcısı oluşturuldu: admin / 12345");
        }

         // Randevular tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS randevular (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ad VARCHAR(100) NOT NULL,
                telefon VARCHAR(15) NOT NULL,
                email VARCHAR(100),
                tarih DATE NOT NULL,
                saat VARCHAR(5) NOT NULL,
                notlar TEXT,
                durum ENUM('pending', 'approved', 'cancelled') DEFAULT 'pending',
                toplam_tutar DECIMAL(10, 2) DEFAULT 0.00,
                odenen_tutar DECIMAL(10, 2) DEFAULT 0.00,
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Kolonların sonradan eklenmesi durumu için ALTER TABLE (Garantiye almak amacıyla)
        try {
            await pool.query("ALTER TABLE randevular ADD COLUMN notlar TEXT");
        } catch (err) {}
        try {
            await pool.query("ALTER TABLE randevular ADD COLUMN toplam_tutar DECIMAL(10, 2) DEFAULT 0.00");
        } catch (err) {}
        try {
            await pool.query("ALTER TABLE randevular ADD COLUMN odenen_tutar DECIMAL(10, 2) DEFAULT 0.00");
        } catch (err) {}

        // Eski sistemde kalan tüm UNIQUE kısıtlamalarını dinamik olarak bulup kaldırıyoruz.
        // Bu sayede aynı saate (biri iptal edilmişse) tekrar randevu kaydı (INSERT) atılabilir.
        try {
            const [indexes] = await pool.query("SHOW INDEX FROM randevular WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
            for (let idx of indexes) {
                await pool.query(`ALTER TABLE randevular DROP INDEX \`${idx.Key_name}\``);
                console.log(`✅ UNIQUE index kaldırıldı: ${idx.Key_name}`);
            }
        } catch (e) {
            console.log("Index temizleme işlemi atlandı veya hata oluştu:", e.message);
        }

        // Makaleler tablosu
        await pool.query(`
            CREATE TABLE IF NOT EXISTS makaleler (
                id INT AUTO_INCREMENT PRIMARY KEY,
                baslik VARCHAR(255) NOT NULL,
                icerik TEXT NOT NULL,
                kapak_resmi VARCHAR(500),
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Türkçe karakter (UTF-8) sorunlarını kalıcı olarak çözmek için tabloların karakter setini utf8mb4'e çeviriyoruz
        try {
            await pool.query("ALTER TABLE randevular CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            await pool.query("ALTER TABLE makaleler CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            console.log('✅ Tablolar utf8mb4 formatına dönüştürüldü (Türkçe karakter desteği aktif).');
        } catch (err) {
            console.log('⚠️ Tablo utf8mb4 dönüştürme atlandı:', err.message);
        }

        console.log('✅ Veritabanı tabloları başarılı şekilde kontrol edildi/oluşturuldu.');
    } catch (err) {
        console.error('❌ DB Init hatası:', err.message);
        throw err;
    }
}

module.exports = { pool, initDb };
