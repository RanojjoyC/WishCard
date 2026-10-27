const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const { protect } = require('../middlewares/auth');

// POST /api/upload
// Handles uploading proof of purchases, invoices, package photos
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    // Try Cloudinary if real credentials configured
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'WISHCARD_API_KEY' &&
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'wishcard_proofs');
        return res.json({
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format
        });
      } catch (cloudErr) {
        console.warn('[Cloudinary warning, falling back to data URL]', cloudErr.message);
      }
    }

    // High-performance fallback: Data URL (instant, always works, zero external dependency)
    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    res.json({
      success: true,
      url: dataUrl,
      publicId: `upload_${Date.now()}`,
      format: mimeType.split('/')[1] || 'jpeg'
    });
  } catch (error) {
    console.error('[Upload error]', error.message);
    res.status(500).json({ success: false, message: `Upload failed: ${error.message}` });
  }
});

module.exports = router;
