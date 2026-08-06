const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'admin-auth.log');

function ensureDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function writeLine(line) {
  try {
    ensureDir();
    fs.appendFileSync(LOG_FILE, `${line}\n`);
  } catch {
    /* never let logging break auth */
  }
  console.log(`[admin-auth] ${line}`);
}

/**
 * Append a structured line to logs/admin-auth.log and mirror it to stderr.
 * Logs every admin login attempt (success and failure) with identity + origin.
 */
function logAdminLogin({ ok, email, ip, reason = '', userAgent = '' }) {
  const ts = new Date().toISOString();
  const status = ok ? 'SUCCESS' : 'FAILED';
  const safeEmail = String(email || 'unknown').toLowerCase().trim();
  const ua = String(userAgent || '').replace(/[\r\n]+/g, ' ');
  const parts = [ts, status, `ip=${ip}`, `email=${safeEmail}`, `ua="${ua}"`];
  if (reason) parts.push(`reason=${reason}`);
  writeLine(parts.join(' '));
}

module.exports = { logAdminLogin };
