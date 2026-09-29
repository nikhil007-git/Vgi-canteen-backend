import express from "express";
import multer from "multer";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, WebP) are allowed!"), false);
    }
  }
});


// GET /api/upload/status
router.get("/status", (req, res) => {
  const configured = isCloudinaryConfigured();
  return res.json({
    success: true,
    configured,
    cloudName: configured ? (process.env.CLOUDINARY_CLOUD_NAME || "Configured via CLOUDINARY_URL") : null
  });
});

// POST /api/upload/image
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    // 1. If Cloudinary credentials are fully configured, attempt upload to Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const uploadStream = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "vgi-canteen/menu",
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
        console.warn("Cloudinary upload failed, using high-speed direct image processing fallback:", cloudErr.message);
      }
    }

    // 2. High-speed Direct Fallback: Convert to Data URI (base64) so food photo ALWAYS saves and displays immediately
    const base64Url = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
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

// DELETE /api/upload/image
router.delete("/image", async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: "Missing publicId." });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(400).json({ success: false, message: "Cloudinary is not configured." });
    }

    const result = await cloudinary.uploader.destroy(publicId);
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
