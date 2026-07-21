const fetch = global.fetch;

/**
 * Hastaya randevu bilgilendirme maili gönderir.
 * @param {string} ad - Hastanın adı
 * @param {string} email - Hastanın e-posta adresi
 * @param {string} tarih - Randevu tarihi (YYYY-MM-DD vb)
 * @param {string} saat - Randevu saati (HH:MM)
 */
const sendAppointmentEmail = async (ad, email, tarih, saat) => {
    if (!email) {
        console.log("Email adresi belirtilmedi, mail gönderimi atlandı.");
        return;
    }

    const senderEmail = process.env.SENDER_EMAIL || 'iletisim@senindomainin.com';
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.error('❌ HATA: BREVO_API_KEY .env dosyasında bulunamadı! Lütfen Brevo üzerinden bir API anahtarı oluşturup .env dosyasına ekleyin.');
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Randevu Bilgilendirmesi</title>
            <style>
                body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7fbfe; }
                .wrapper { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 43, 69, 0.08); }
                .header { background: linear-gradient(135deg, #002b45 0%, #004d7a 100%); padding: 35px 20px; text-align: center; }
                .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
                .header p { margin: 8px 0 0; color: #90cdf4; font-size: 15px; }
                .content { padding: 40px 35px; }
                .greeting { font-size: 22px; color: #2d3748; margin-top: 0; font-weight: 600; }
                .message { font-size: 16px; color: #4a5568; line-height: 1.7; margin-bottom: 30px; }
                .details-card { background-color: #ebf8ff; border-left: 5px solid #3182ce; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
                .detail-row { display: table; width: 100%; margin-bottom: 12px; }
                .detail-row:last-child { margin-bottom: 0; }
                .detail-label { display: table-cell; font-weight: 600; color: #2c5282; width: 100px; font-size: 15px; }
                .detail-value { display: table-cell; color: #2b6cb0; font-weight: 700; font-size: 16px; }
                .location-title { font-size: 18px; color: #2d3748; font-weight: 600; margin-bottom: 10px; }
                .location-text { font-size: 15px; color: #718096; line-height: 1.6; margin-bottom: 25px; }
                .address-box { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc; font-size: 14px; color: #4a5568; }
                .footer { background-color: #f1f5f9; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0; }
                .footer p { margin: 0 0 10px 0; font-size: 13px; color: #64748b; }
                .btn-maps { display: inline-block; background-color: #3182ce; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 30px; font-weight: 600; font-size: 14px; margin-top: 10px; }
                @media only screen and (max-width: 600px) {
                    .wrapper { margin: 15px; width: auto; }
                    .content { padding: 30px 20px; }
                }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <!-- Header -->
                <div class="header">
                    <h1>Dr. Muhammet Emin Başyıldız</h1>
                    <p>Diş Sağlığı Kliniği</p>
                </div>
                
                <!-- Content -->
                <div class="content">
                    <h2 class="greeting">Merhaba, ${ad}</h2>
                    <p class="message">Kliniğimizden oluşturduğunuz randevu talebiniz başarıyla sistemimize ulaşmıştır. Seçmiş olduğunuz tarih ve saat bilgileri aşağıda yer almaktadır.</p>
                    
                    <!-- Details -->
                    <div class="details-card">
                        <div class="detail-row">
                            <span class="detail-label">Tarih:</span>
                            <span class="detail-value">${tarih}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Saat:</span>
                            <span class="detail-value">${saat}</span>
                        </div>
                    </div>

                    <!-- Location -->
                    <h3 class="location-title">Klinik Adresimiz</h3>
                    <div class="address-box">
                        <strong>Dr. Muhammet Emin Başyıldız Diş Sağlığı Merkezi</strong><br>
                        Pırlanta düğün salonu yanı, 60. Yıl, Yavuz Sultan Selim Cd. No:107A<br>
                        27100 Şahinbey / Gaziantep<br><br>
                        İletişim: <strong>0535 064 56 84</strong>
                    </div>
                    
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="https://www.google.com/maps/search/?api=1&query=P%C4%B1rlanta+d%C3%BC%C4%9F%C3%BCn+salonu+yan%C4%B1,+60.+Y%C4%B1l,+Yavuz+Sultan+Selim+Cd.+No%3A107A,+27100+%C5%9Eahinbey%2FGaziantep" class="btn-maps" target="_blank">Haritada Konuma Git</a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <p>Sağlıklı gülüşler dileriz.</p>
                    <p style="font-size: 11px; color: #94a3b8; margin-top: 15px;">Bu e-posta sistem tarafından otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'Dr. Muhammet Emin Başyıldız', email: senderEmail },
                to: [{ email: email, name: ad }],
                subject: 'Randevu Talebiniz Alındı | Dr. Muhammet Emin Başyıldız Diş Sağlığı',
                htmlContent: htmlContent
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Brevo HTTP API üzerinden randevu e-postası başarıyla gönderildi.');
            console.log('📬 Message ID:', data.messageId);
        } else {
            console.error('❌ Brevo HTTP API mail gönderim hatası:', data);
        }
    } catch (error) {
        console.error('❌ Brevo HTTP API bağlantı hatası:', error.message);
    }
};

module.exports = { sendAppointmentEmail };
