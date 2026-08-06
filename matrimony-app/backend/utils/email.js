const tls = require('tls');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

function smtpSend({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    if (!SMTP_USER || !SMTP_PASS) {
      return reject(new Error('SMTP not configured'));
    }

    const sock = tls.connect({ host: SMTP_HOST, port: SMTP_PORT, rejectUnauthorized: false });
    let step = 0;
    let buf = '';

    function send(line) { sock.write(line + '\r\n'); }

    function runStep() {
      switch (step) {
        case 0: send('EHLO ' + SMTP_HOST); break;
        case 1: send('AUTH LOGIN'); break;
        case 2: send(Buffer.from(SMTP_USER).toString('base64')); break;
        case 3: send(Buffer.from(SMTP_PASS).toString('base64')); break;
        case 4: send('MAIL FROM:<' + SMTP_USER + '>'); break;
        case 5: send('RCPT TO:<' + to + '>'); break;
        case 6: send('DATA'); break;
        case 7:
          send('From: ' + (process.env.SMTP_FROM || SMTP_USER) + '\r\n' +
               'To: ' + to + '\r\n' +
               'Subject: ' + subject + '\r\n' +
               'MIME-Version: 1.0\r\n' +
               'Content-Type: text/html; charset=UTF-8\r\n' +
               '\r\n' +
               html + '\r\n.');
          break;
        case 8: send('QUIT'); sock.end(); resolve(); break;
      }
    }

    sock.on('data', (data) => {
      buf += data.toString();
      if (buf.match(/\r\n$/)) {
        const code = parseInt(buf.substring(0, 3), 10);
        buf = '';
        if (code >= 400 && step !== 0) {
          sock.destroy();
          return reject(new Error('SMTP error ' + code));
        }
        step++;
        runStep();
      }
    });

    sock.on('error', (err) => { reject(err); });
    sock.on('secure', () => { step = 0; runStep(); });
  });
}

async function sendMail({ to, subject, html }) {
  try {
    await smtpSend({ to, subject, html });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

function otpEmailTemplate(otp) {
  return '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#fff;border-radius:16px;border:1px solid #fde7f0;">' +
    '<div style="text-align:center;margin-bottom:24px;">' +
    '<span style="font-size:32px;">💖</span>' +
    '<h2 style="color:#e0136a;margin:8px 0 0;">Mukurtham Matrimony</h2>' +
    '</div>' +
    '<h3 style="color:#1e1e2d;text-align:center;margin-bottom:8px;">Your Verification Code</h3>' +
    '<p style="color:#666;text-align:center;font-size:14px;">Use the code below to reset your password. It expires in 10 minutes.</p>' +
    '<div style="text-align:center;margin:28px 0;">' +
    '<span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:12px;color:#e0136a;background:#fdf2f7;padding:16px 32px;border-radius:12px;">' + otp + '</span>' +
    '</div>' +
    '<p style="color:#999;text-align:center;font-size:12px;">If you didn\'t request this, please ignore this email.</p>' +
    '</div>';
}

module.exports = { sendMail, otpEmailTemplate };
