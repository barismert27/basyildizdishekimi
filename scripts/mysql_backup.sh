#!/bin/bash

# ==============================================================================
# OTOMATİK MYSQL VERİTABANI YEDEKLEME VE DIŞARI AKTARIM SCRIPT'İ
# Rol: Kıdemli DevOps & Veritabanı Yöneticisi
# Açıklama: MySQL veritabanını sıkıştırıp yedekler, 7 günde bir rotasyon yapar
#           ve yedek dosyasını Telegram Bot ve/veya Google Drive (Rclone) üzerinden dışa aktarır.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. AYARLAR (Bu alanları kendi sunucu ve Telegram bilgilerinize göre doldurun)
# ------------------------------------------------------------------------------

# Veritabanı Bağlantı Bilgileri
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-YeniGucluSifreniz123!}"
DB_NAME="${DB_NAME:-randevu}"
DB_HOST="${DB_HOST:-localhost}"

# Telegram Bot Bilgileri
TELEGRAM_BOT_TOKEN="8759750257:AAGtcP3tBULUB_VG1ML8CsxZU58auOdOUpM"
TELEGRAM_CHAT_ID="942281650"
ENABLE_TELEGRAM=true

# Google Drive (Rclone) Bilgileri (Opsiyonel)
ENABLE_RCLONE=false
RCLONE_REMOTE_NAME="gdrive"
RCLONE_DEST_DIR="db_backups"

# Yedek Klasörü ve Saklama Süresi (Gün)
BACKUP_DIR="/var/backups/mysql_auto"
RETENTION_DAYS=7

# Zaman Damgası ve Dosya Yolu
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

# ------------------------------------------------------------------------------
# 2. DİZİN VE YARDIMCI FONKSİYONLAR
# ------------------------------------------------------------------------------
mkdir -p "${BACKUP_DIR}"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

send_telegram_alert() {
    local message="$1"
    if [ "$ENABLE_TELEGRAM" = true ] && [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "parse_mode=HTML" \
            -d "text=${message}" > /dev/null || true
    fi
}

send_telegram_document() {
    local file_path="$1"
    local caption="$2"
    if [ "$ENABLE_TELEGRAM" = true ] && [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -F "chat_id=${TELEGRAM_CHAT_ID}" \
            -F "document=@${file_path}" \
            -F "caption=${caption}" \
            "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" > /dev/null || true
    fi
}

log "Yedekleme işlemi başlatılıyor: ${DB_NAME}"

# ------------------------------------------------------------------------------
# 3. MYSQLDUMP İLE SIKIŞTIRILMIŞ YEDEK ALMA (.sql.gz)
# ------------------------------------------------------------------------------
MYSQL_PWD="${DB_PASS}" mysqldump \
    --host="${DB_HOST}" \
    --user="${DB_USER}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --default-character-set=utf8mb4 \
    "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

# Yedek dosyasının oluşup oluşmadığı ve boyut kontrolü
if [ ! -s "${BACKUP_FILE}" ]; then
    log "HATA: Yedek alma başarısız oldu veya dosya 0 byte!"
    send_telegram_alert "⚠️ <b>HATA:</b> <code>${DB_NAME}</code> veritabanı yedeği alınamadı! (Dosya 0 Byte)"
    exit 1
fi

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
log "Yedek başarıyla oluşturuldu: ${BACKUP_FILE} (Boyut: ${FILE_SIZE})"

# ------------------------------------------------------------------------------
# 4. HARİCİ ALANA AKTARIM (TELEGRAM & RCLONE)
# ------------------------------------------------------------------------------

# SEÇENEK A: Telegram Dosya Gönderimi
if [ "$ENABLE_TELEGRAM" = true ]; then
    log "Yedek dosyası Telegram'a gönderiliyor..."
    CAPTION="✅ <b>MySQL Veritabanı Yedeği Alındı</b>%0A📌 <b>Veritabanı:</b> ${DB_NAME}%0A📦 <b>Boyut:</b> ${FILE_SIZE}%0A🕒 <b>Tarih:</b> $(date +'%Y-%m-%d %H:%M:%S')"
    send_telegram_document "${BACKUP_FILE}" "${CAPTION}"
fi

# SEÇENEK B: Google Drive (Rclone) Gönderimi
if [ "$ENABLE_RCLONE" = true ]; then
    log "Yedek dosyası Google Drive (${RCLONE_REMOTE_NAME}:${RCLONE_DEST_DIR}) alanına aktarılıyor..."
    if rclone copy "${BACKUP_FILE}" "${RCLONE_REMOTE_NAME}:${RCLONE_DEST_DIR}" ; then
        log "Google Drive aktarımı başarılı."
    else
        log "HATA: Google Drive aktarımı başarısız oldu!"
        send_telegram_alert "⚠️ <b>UYARI:</b> <code>${DB_NAME}</code> yedeği alındı ancak Google Drive aktarımı başarısız oldu."
    fi
fi

# ------------------------------------------------------------------------------
# 5. SUNUCU İÇİ TEMİZLİK (ROTASYON - Son 7 Günün Yedekleri Saklanır)
# ------------------------------------------------------------------------------
log "7 günden eski sunucu içi yedekler temizleniyor..."
find "${BACKUP_DIR}" -type f -name "${DB_NAME}_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} \;

log "Yedekleme ve aktarım işlemi başarıyla tamamlandı!"
