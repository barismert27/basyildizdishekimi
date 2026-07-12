require('dotenv').config();
const { sendAppointmentEmail } = require('./utils/mailConfig');

async function test() {
    console.log("Mail test ediliyor...");
    await sendAppointmentEmail("Test Ad", process.env.EMAIL_USER || "barismertciloglu2@gmail.com", "2026-04-10", "10:00");
    console.log("Test fonksiyonu bitti.");
}

test();
