// Twilio SMS service
// Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
// Falls back to console.log in development

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

if (accountSid && authToken && fromNumber) {
  const twilio = require('twilio');
  twilioClient = twilio(accountSid, authToken);
}

async function sendOTP(phoneNumber, otp) {
  const message = `Your Mukurtham verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

  if (twilioClient) {
    await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: phoneNumber,
    });
    console.log(`[SMS] OTP sent to ${phoneNumber}`);
  } else {
    console.log(`[SMS-DEV] OTP for ${phoneNumber}: ${otp}`);
  }
}

module.exports = { sendOTP };
