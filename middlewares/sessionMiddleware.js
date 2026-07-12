const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_buraya_yazilir_daha_karma_bir_sey_olmali';

/**
 * HTML sayfaları için session/cookie tabanlı koruma middleware'i.
 * API middleware'inden (authMiddleware.js) farklı olarak:
 * - Yetkisiz erişimde JSON döndürmek yerine /login sayfasına redirect eder.
 * - Token'ı cookie'den okur (tarayıcı güvenliği açısından localStorage'dan daha iyi).
 */
function requireAuth(req, res, next) {
    // Token önce cookie'den, yoksa Authorization header'dan okunur
    const token = req.cookies?.adminToken || extractBearerToken(req);

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        // Süresi dolmuş veya geçersiz token
        res.clearCookie('adminToken');
        return res.redirect('/login');
    }
}

/**
 * Zaten giriş yapmış kullanıcıyı /login sayfasından panele yönlendir.
 */
function redirectIfAuthenticated(req, res, next) {
    const token = req.cookies?.adminToken || extractBearerToken(req);

    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return res.redirect('/yonetim-paneli');
        } catch {
            res.clearCookie('adminToken');
        }
    }
    next();
}

function extractBearerToken(req) {
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
        return header.split(' ')[1];
    }
    return null;
}

module.exports = { requireAuth, redirectIfAuthenticated };
