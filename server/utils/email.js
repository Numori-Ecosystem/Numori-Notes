import nodemailer from 'nodemailer'

/**
 * SMTP email utility.
 * Reads SMTP config from environment variables.
 * If SMTP_HOST is not set, emails are logged to console instead of sent.
 */

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  const host = process.env.SMTP_HOST
  if (!host) return null

  const port = parseInt(process.env.SMTP_PORT || '587')
  const secure = process.env.SMTP_SECURE === 'true'

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    // For port 587 with STARTTLS, nodemailer upgrades automatically when secure=false
    // For port 465 with implicit TLS, secure=true is required
    tls: {
      // Don't fail on self-signed certs in dev
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  return _transporter
}

/**
 * Send an email. Falls back to console.log if SMTP is not configured.
 * Never throws — returns { accepted, error? } so callers can check success.
 */
export async function sendEmail({ to, subject, html }) {
  const from = process.env.SMTP_FROM || 'noreply@numori.app'
  const transporter = getTransporter()

  if (!transporter) {
    console.log(`[email] SMTP not configured. Would send to ${to}:`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body: ${html}`)
    return { accepted: [to], preview: true }
  }

  try {
    return await transporter.sendMail({ from, to, subject, html })
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err.message)
    return { accepted: [], error: err.message }
  }
}

/**
 * Generate a 6-digit OTP code.
 */
export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Send a verification OTP email.
 */
export async function sendVerificationEmail(to, code) {
  return sendEmail({
    to,
    subject: 'Verify your email — Numori',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #666; font-size: 14px;">Enter this code in Numori to verify your email address:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${code}</span>
        </div>
        <p style="color: #999; font-size: 12px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `
  })
}

/**
 * Send a password recovery OTP email.
 */
export async function sendPasswordRecoveryEmail(to, code) {
  return sendEmail({
    to,
    subject: 'Password recovery — Numori',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333; margin-bottom: 8px;">Password recovery</h2>
        <p style="color: #666; font-size: 14px;">Enter this code in Numori to reset your password:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${code}</span>
        </div>
        <p style="color: #d97706; font-size: 12px; font-weight: 500;">⚠️ Resetting your password will delete all your encrypted notes since they cannot be decrypted without the original password.</p>
        <p style="color: #999; font-size: 12px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `
  })
}
