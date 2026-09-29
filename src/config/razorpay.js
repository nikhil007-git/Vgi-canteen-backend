import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;

const isConfigured = keyId && keySecret && !keyId.includes('placeholder');

if (isConfigured) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  } catch (err) {
    console.warn('⚠️ Razorpay initialization warning:', err.message);
  }
}

export const isRazorpayLive = !!razorpayInstance;
export default razorpayInstance;

