const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "gizli_anahtar_buraya_yazilir_daha_karma_bir_sey_olmali";

function verifyToken(req, res, next) {
    // 1. Cookie'den token al (httpOnly, XSS güvenli)
    let token = req.cookies?.adminToken;

    // 2. Yoksa Authorization header'dan al (fallback)
    if (!token) {
        const bearerHeader = req.headers['authorization'];
        if (bearerHeader && bearerHeader.startsWith('Bearer ')) {
            token = bearerHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Token gerekli" });
    }

    jwt.verify(token, JWT_SECRET, (err, authData) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Geçersiz token" });
        }
        req.admin = authData;
        next();
    });
}

module.exports = verifyToken;
