/* eslint-disable no-console */
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || '"PKBM MUGI SAE" <noreply@pkbmmugiasae.sch.id>';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // Mode tanpa SMTP — log saja (development)
    transporter = {
      sendMail: async (opts) => {
        console.log('[emailService] (no SMTP) Email akan dikirim:', {
          to: opts.to,
          subject: opts.subject,
        });
        return { messageId: 'dev-no-smtp' };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const HEADER = `
  <div style="background:#1e40af;color:#fff;padding:20px;text-align:center;">
    <h1 style="margin:0;font-family:Arial,sans-serif;font-size:22px;">PKBM MUGI SAE</h1>
    <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:13px;opacity:0.9;">Pusat Kegiatan Belajar Masyarakat</p>
  </div>
`;

const FOOTER = `
  <div style="background:#f3f4f6;color:#6b7280;padding:14px;text-align:center;font-family:Arial,sans-serif;font-size:12px;">
    Email otomatis — mohon tidak membalas pesan ini.<br/>
    &copy; ${new Date().getFullYear()} PKBM MUGI SAE
  </div>
`;

function wrap(content) {
  return `
    <div style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#111827;">
      ${HEADER}
      <div style="padding:24px;font-size:14px;line-height:1.6;">
        ${content}
      </div>
      ${FOOTER}
    </div>
  `;
}

async function sendOTPEmail(to, name, otp) {
  const html = wrap(`
    <p>Halo <strong>${name}</strong>,</p>
    <p>Kami menerima permintaan reset kata sandi untuk akun Anda. Gunakan kode OTP berikut:</p>
    <div style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;background:#f3f4f6;padding:14px;border-radius:6px;margin:18px 0;">
      ${otp}
    </div>
    <p>Kode ini berlaku selama <strong>10 menit</strong>. Jika Anda tidak meminta reset, abaikan email ini.</p>
  `);
  return getTransporter().sendMail({
    from: EMAIL_FROM,
    to,
    subject: 'Reset Kata Sandi - PKBM MUGI SAE',
    html,
  });
}

async function sendWelcomeEmail(to, name, role) {
  const roleLabel = { ADMIN: 'Admin', GURU: 'Guru', SISWA: 'Siswa' }[role] || role;
  const html = wrap(`
    <p>Halo <strong>${name}</strong>,</p>
    <p>Selamat datang di portal pembelajaran <strong>PKBM MUGI SAE</strong>!</p>
    <p>Akun Anda telah dibuat dengan peran <strong>${roleLabel}</strong>. Silakan login menggunakan email ini dan kata sandi yang telah diberikan oleh Administrator.</p>
    <p>Jika Anda lupa kata sandi, gunakan fitur "Lupa Kata Sandi" di halaman login.</p>
  `);
  return getTransporter().sendMail({
    from: EMAIL_FROM,
    to,
    subject: 'Selamat Datang di PKBM MUGI SAE',
    html,
  });
}

async function sendTugasDinilaiEmail(to, name, tugas, nilai) {
  const html = wrap(`
    <p>Halo <strong>${name}</strong>,</p>
    <p>Tugas Anda <strong>"${tugas}"</strong> telah dinilai oleh guru.</p>
    <p>Nilai yang Anda dapatkan: <strong style="font-size:18px;color:#1e40af;">${nilai}</strong></p>
    <p>Silakan masuk ke portal untuk melihat detail dan feedback dari guru.</p>
  `);
  return getTransporter().sendMail({
    from: EMAIL_FROM,
    to,
    subject: `Nilai Tugas: ${tugas}`,
    html,
  });
}

module.exports = { sendOTPEmail, sendWelcomeEmail, sendTugasDinilaiEmail };
