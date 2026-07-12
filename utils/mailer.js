const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASS
    }
});

const sendAppointmentEmail = async (ad, email, tarih, saat) => {
    if (!email) return;

    const mailOptions = {
        from: `"Dr. Muhammed Emin Başyıldız Diş Sağlığı Kliniği" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Diş Kliniği - Randevunuz Onaylandı',
        html: `
            <div style="font-family: 'Inter', 'Roboto', Arial, sans-serif; background-color: #f4f7f6; padding: 40px 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <div style="background-color: #00b4d8; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">Dr. Muhammed Emin Başyıldız Diş Sağlığı Kliniği</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #333333; margin-top: 0; font-size: 22px;">Randevunuz Onaylandı! 🎉</h2>
                        <p style="font-size: 16px; color: #555555; line-height: 1.6;">Sayın <strong>${ad}</strong>,</p>
                        <p style="font-size: 16px; color: #555555; line-height: 1.6;">Bizimle iletişime geçtiğiniz için teşekkür ederiz. Kliniğimizdeki randevunuz başarıyla oluşturulmuştur. Sizi ağırlamak için sabırsızlanıyoruz.</p>
                        
                        <!-- Info Box -->
                        <div style="background-color: #f0fafd; border-left: 4px solid #00b4d8; padding: 20px; margin: 30px 0; border-radius: 4px;">
                            <p style="margin: 0 0 10px 0; font-size: 16px; color: #333333;"><strong>📅 Tarih:</strong> <span style="color: #00b4d8; font-weight: 600;">${tarih}</span></p>
                            <p style="margin: 0; font-size: 16px; color: #333333;"><strong>⏰ Saat:</strong> <span style="color: #00b4d8; font-weight: 600;">${saat}</span></p>
                        </div>

                        <!-- Location & Button -->
                        <h4 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">Klinik Konumu:</h4>
                        <p style="margin: 0 0 25px 0; color: #777777; font-size: 15px; line-height: 1.5;">Pırlanta düğün salonu yanı, 60. Yıl, Yavuz Sultan Selim Cd. No:107A, 27100 Şahinbey/Gaziantep<br>İletişim: <strong>0535 064 56 84</strong></p>
                        
                        <div style="text-align: center; margin-top: 15px;">
                            <a href="https://www.google.com/maps/search/?api=1&query=P%C4%B1rlanta+d%C3%BC%C4%9F%C3%BCn+salonu+yan%C4%B1,+60.+Y%C4%B1l,+Yavuz+Sultan+Selim+Cd.+No%3A107A,+27100+%C5%9Eahinbey%2FGaziantep" style="display: inline-block; background-color: #ffffff; color: #00b4d8; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 15px; border: 2px solid #00b4d8; margin: 5px;" target="_blank">📍 Google Haritalar</a>
                            <a href="http://maps.apple.com/?q=P%C4%B1rlanta+d%C3%BC%C4%9F%C3%BCn+salonu+yan%C4%B1,+60.+Y%C4%B1l,+Yavuz+Sultan+Selim+Cd.+No%3A107A,+27100+%C5%9Eahinbey%2FGaziantep" style="display: inline-block; background-color: #00b4d8; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 15px; border: 2px solid #00b4d8; margin: 5px;" target="_blank">🍏 Apple Haritalar</a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #fafbfc; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #888888;">
                            <a href="#" style="color: #00b4d8; text-decoration: none; margin: 0 10px;">Instagram</a> | 
                            <a href="#" style="color: #00b4d8; text-decoration: none; margin: 0 10px;">Web Sitemiz</a>
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #aaaaaa;">Bu bir otomatik bilgilendirme mesajıdır. Lütfen bu maile cevap vermeyiniz.</p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Randevu emaili gönderildi:', email);
    } catch (error) {
        console.error('❌ Email gönderim hatası:', error.message);
    }
};

module.exports = { sendAppointmentEmail };
