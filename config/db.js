require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    port: process.env.DB_PORT || 3306,
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'randevu',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    ssl: {
        rejectUnauthorized: false
    }
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
                olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Eski sistemde kalan hatalı UNIQUE kısıtlamasını kaldır ki iptal edilen saate tekrar randevu alınabilsin.
        try {
            await pool.query('ALTER TABLE randevular DROP INDEX uk_tarih_saat');
            console.log('✅ uk_tarih_saat indexi kaldırıldı (İptal edilen saatler tekrar alınabilir).');
        } catch (e) {
            // Index zaten silinmişse veya yoksa hatayı yoksay
        }

        console.log('✅ Veritabanı tabloları başarılı şekilde kontrol edildi/oluşturuldu.');
    } catch (err) {
        console.error('❌ DB Init hatası:', err.message);
        throw err;
    }
}

module.exports = { pool, initDb };
