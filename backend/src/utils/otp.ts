// OTP Generation & Validation
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const otpExpiry = (): Date => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // 5 minutes expiry
  return now;
};

// In production, use actual SMS gateway
export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  console.log(`📱 OTP for ${phone}: ${otp}`);
  // TODO: Integrate with Twilio/muthofun/BulkSMS BD
  return true;
};
