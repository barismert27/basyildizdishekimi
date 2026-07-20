const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middlewares/sessionMiddleware');
const {
    getMakaleler, getMakale, createMakale, updateMakale, deleteMakale
} = require('../controllers/articleController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
});

router.get('/', getMakaleler);
router.get('/:id', getMakale);
router.post('/', requireAuth, upload.single('kapak'), createMakale);
router.put('/:id', requireAuth, upload.single('kapak'), updateMakale);
router.delete('/:id', requireAuth, deleteMakale);

module.exports = router;
