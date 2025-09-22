import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

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
    logger.warn('SMTP not configured. Email not sent', { to, subject });
    return;
  }
  
  try {
    await transporter.sendMail({ from: fromEmail, to, subject, html });
    logger.email('Email sent successfully', { to, subject });
  } catch (error: any) {
    logger.error('Failed to send email', { 
      to, 
      subject, 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  }
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
  
  logger.email(`Sending OTP email for ${purpose}`, { to, purpose });
  await sendEmail(to, title, html);
}



