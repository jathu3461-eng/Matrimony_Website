import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14165550198';

const isMock = !accountSid || accountSid === 'mock_sid';

// Only create a real Twilio client when real credentials are configured
const client = isMock ? null : twilio(accountSid, authToken);

/**
 * Sends an OTP SMS to the given phone number.
 * In development (mock credentials), logs the OTP to console instead.
 * In production (real Twilio credentials), sends a real SMS.
 */
export const sendSmsOtp = async (phoneNumber: string, otp: string): Promise<void> => {
  if (isMock) {
    // DEV MODE: Print to console — no real SMS sent
    console.log(`\n📱 [DEV SMS] OTP for ${phoneNumber}: ${otp}\n`);
    return;
  }

  // PRODUCTION MODE: Send real SMS via Twilio
  try {
    await client!.messages.create({
      body: `Your Mukurtham Matrimony verification code is: ${otp}. It expires in 5 minutes. Do not share this code.`,
      from: fromNumber,
      to: phoneNumber,
    });
    console.log(`[Twilio] SMS OTP sent to ${phoneNumber}`);
  } catch (err: any) {
    console.error(`[Twilio] Failed to send SMS to ${phoneNumber}:`, err.message);
    throw new Error('Failed to send SMS OTP. Please try again.');
  }
};
