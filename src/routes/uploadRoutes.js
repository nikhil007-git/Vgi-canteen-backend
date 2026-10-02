import express from "express";
import multer from "multer";
import crypto from "crypto";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { authenticate, requireStaffOrAdmin } from "../middlewares/authMiddleware.js";
import { uploadLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

/**
 * Validates actual binary signature of buffer to prevent extension/MIME spoofing
 */
const detectImageSignature = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return "image/png";
  }

  // WebP: RIFF .... WEBP
  const isRiff = buffer.toString("ascii", 0, 4) === "RIFF";
  const isWebp = buffer.toString("ascii", 8, 12) === "WEBP";
  if (isRiff && isWebp) {
    return "image/webp";
  }

  return null;
};

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only standard image formats (JPEG, PNG, WebP) are allowed."), false);
    }
  }
});

// GET /api/upload/status (Requires Staff or Admin)
router.get("/status", authenticate, requireStaffOrAdmin, (req, res) => {
  const configured = isCloudinaryConfigured();
  return res.json({
    success: true,
    configured,
    cloudName: configured ? (process.env.CLOUDINARY_CLOUD_NAME || "Configured via CLOUDINARY_URL") : null
  });
});

// POST /api/upload/image (Requires Staff or Admin + Rate Limited)
router.post("/image", authenticate, requireStaffOrAdmin, uploadLimiter, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    // Binary signature verification
    const detectedType = detectImageSignature(req.file.buffer);
    if (!detectedType) {
      return res.status(400).json({
        success: false,
        message: "Invalid file content. Uploaded file is not a valid JPEG, PNG, or WebP image."
      });
    }

    // Generate safe collision-resistant server-side public ID (ignores client filename)
    const safePublicId = `menu_${crypto.randomUUID()}`;

    // 1. If Cloudinary credentials are fully configured, attempt upload to Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const uploadStream = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "vgi-canteen/menu",
                public_id: safePublicId,
                resource_type: "image",
                transformation: [
                  { quality: "auto", fetch_format: "auto" }
                ]
              },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });
        };

        const result = await uploadStream();

        return res.status(200).json({
          success: true,
          message: "Image uploaded successfully to Cloudinary!",
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes
        });
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, using secure direct image fallback:", cloudErr.message);
      }
    }

    // 2. Fallback: Base64 data URI with validated detected MIME type
    const base64Url = `data:${detectedType};base64,${req.file.buffer.toString("base64")}`;
    return res.status(200).json({
      success: true,
      message: "Image uploaded and processed successfully!",
      url: base64Url
    });
  } catch (error) {
    console.error("Image upload processing error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process image."
    });
  }
});

// DELETE /api/upload/image (Requires Staff or Admin)
router.delete("/image", authenticate, requireStaffOrAdmin, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId || typeof publicId !== "string") {
      return res.status(400).json({ success: false, message: "Valid publicId is required." });
    }

    // Sanitize publicId against path traversal
    const cleanPublicId = publicId.trim().replace(/[^a-zA-Z0-9_\-\/]/g, "");
    if (!cleanPublicId || cleanPublicId.includes("..")) {
      return res.status(400).json({ success: false, message: "Invalid publicId format." });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(400).json({ success: false, message: "Cloudinary is not configured." });
    }

    const result = await cloudinary.uploader.destroy(cleanPublicId);
    return res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image from Cloudinary."
    });
  }
});

export default router;

