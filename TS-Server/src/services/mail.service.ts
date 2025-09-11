import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const fromEmail = process.env.MAIL_FROM || smtpUser;

let transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!smtpHost || !fromEmail) {
    // Fallback: log if SMTP not configured
    console.warn('[mail.service] SMTP not configured. Intended email:', { to, subject });
    return;
  }
  await transporter.sendMail({ from: fromEmail, to, subject, html });
}

export async function sendOtpEmail(to: string, otp: string, purpose: 'register' | 'reset') {
  const title = purpose === 'reset' ? 'Reset Password OTP' : 'Registration OTP';
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>${title}</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This code will expire in 5 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `;
  await sendEmail(to, title, html);
}



