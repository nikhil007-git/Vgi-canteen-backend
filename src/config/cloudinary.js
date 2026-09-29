import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split('@')[1] : null);
const apiKey = process.env.CLOUDINARY_API_KEY || (process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split('://')[1]?.split(':')[0] : null);
const apiSecret = process.env.CLOUDINARY_API_SECRET || (process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split('://')[1]?.split(':')[1]?.split('@')[0] : null);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export const isCloudinaryConfigured = () => {
  return Boolean(cloudName && apiKey && apiSecret && cloudName !== "your_cloud_name");
};

export default cloudinary;
