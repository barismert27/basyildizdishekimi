# 🛡️ MySQL Otomatik Harici Yedekleme ve Kurtarma Rehberi

Bu rehber, bir doktor/laboratuvar web uygulamasının MySQL veritabanını **%100 veri güvenliği** sağlayacak şekilde otomatik olarak sıkıştırıp yedekleyen ve bu yedekleri **VPS Sunucusu Dışına** (Telegram Bot veya Google Drive) aktaran DevOps çözümünü içermektedir.

---

## 🚀 1. Kurulum ve İzin Adımları

### Adım 1: Script Dosyasını Sunucuya Yerleştirin
Sunucunuzda script'leri tutmak için bir klasör oluşturun ve script dosyasını buraya kaydedin:

```bash
sudo mkdir -p /opt/scripts
sudo nano /opt/scripts/mysql_backup.sh
```

Projede hazırladığımız [`mysql_backup.sh`](file:///c:/Users/baris/Desktop/dneeeee/scripts/mysql_backup.sh) içeriğini yapıştırın ve kaydedin (`Ctrl + O`, `Enter`, `Ctrl + X`).

### Adım 2: Çalıştırma İzinlerini Verin
Script'in çalıştırılabilir olması için execution yetkisi ekleyin:

```bash
sudo chmod +x /opt/scripts/mysql_backup.sh
```

---

## 📱 2. Harici Alan Entegrasyonları (Sunucu Dışına Aktarım)

### SEÇENEK A: Telegram Botu Entegrasyonu (En Pratik & Ücretsiz)

1. **Telegram Botu Oluşturma:**
   - Telegram'da `@BotFather` kullanıcısını arayın ve başlatın.
   - `/newbot` komutunu gönderin. Botunuza bir isim ve kullanıcı adı verin.
   - BotFather size bir **HTTP API Token** verecektir (Örn: `7123456789:AAFg...`). Bu bilgiyi script içerisindeki `TELEGRAM_BOT_TOKEN` kısmına yazın.

2. **Telegram Chat ID Bulma:**
   - Telegram'da yeni oluşturduğunuz bota gidin ve `/start` mesajı atın.
   - Ardından Telegram'da `@userinfobot` botunu aratıp başlatın. Size **ID** numaranızı (Örn: `987654321`) verecektir.
   - Bu ID'yi script içerisindeki `TELEGRAM_CHAT_ID` kısmına yazın.

3. **Manuel Test:**
   ```bash
   /opt/scripts/mysql_backup.sh
   ```
   Telegram hesabınıza yedek dosyasının `.sql.gz` olarak geldiğini doğrulayın.

---

### SEÇENEK B: Google Drive Entegrasyonu (Rclone ile)

Sunucu tamamen yansa bile verilerinizin Google Drive hesabınızda güvende kalması için:

1. **Rclone Kurulumu:**
   ```bash
   sudo curl https://rclone.org/install.sh | sudo bash
   ```

2. **Google Drive Bağlantısı:**
   ```bash
   rclone config
   ```
   - `n` (New remote) yazın.
   - Isim olarak: `gdrive` girin.
   - Storage tipi olarak `drive` (Google Drive) seçin.
   - Ekrana gelen talimatları izleyerek Google hesabınızla yetkilendirin.

3. **Script Konfigürasyonu:**
   `mysql_backup.sh` dosyasında `ENABLE_RCLONE=true` yapın ve `RCLONE_REMOTE_NAME="gdrive"` olarak ayarlayın.

---

## ⏰ 3. Otomasyon (Cron Job Setup)

Yedekleme işleminin her gün **03:00** ve **15:00** saatlerinde insan müdahalesi olmadan otomatik çalışması için:

1. Crontab düzenleyicisini açın:
   ```bash
   sudo crontab -e
   ```

2. En alt satıra aşağıdaki crontab tanımını ekleyin:
   ```cron
   # Her gün saat 03:00 ve 15:00'te veritabanı yedeği al ve harici alana aktar
   0 3,15 * * * /opt/scripts/mysql_backup.sh >> /var/log/mysql_backup.log 2>&1
   ```

3. Kaydedip çıkın. Cron servisini yeniden başlatmaya gerek kalmadan zamanlayıcı devreye girecektir.

---

## 🔄 4. Felaket Senaryosu (Restore / Geri Yükleme)

VPS tamamen silindi, çöktü veya erişilemez oldu diyelim. Telegram'dan veya Google Drive'dan en son indirdiğiniz `randevu_backup_YYYYMMDD_HHMMSS.sql.gz` dosyasını elinize aldınız.

Sıfır bir Ubuntu VPS kurulduğunda veritabanınızı **tek komutla** eksiksiz geri yükleyebilirsiniz:

### 1. Yeni Sunucuda Veritabanını Oluşturun:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS randevu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Sıkıştırılmış Yedeği Tek Komutla İçeri Aktarın (Restore):
```bash
zcat randevu_backup_20260724_030000.sql.gz | mysql -u root -p randevu
```
*(veya alternatif olarak `gunzip < yedek.sql.gz | mysql -u root -p randevu`)*

---

## 🛡️ Güvenlik Notları
- `.sql.gz` dosyanız tıbbi ve finansal hasta verileri içerdiği için Telegram Bot token'ınızı ve yedek dosyalarınızı üçüncü şahıslarla paylaşmayın.
- Script içindeki MySQL şifresi için `MYSQL_PWD` çevresel değişkeni kullanılarak crontab uyarıları engellenmiştir.
