const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const cleanVal = (val) => (val ? val.replace(/^['"]|['"]$/g, '').trim() : '');

cloudinary.config({
  cloud_name: cleanVal(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: cleanVal(process.env.CLOUDINARY_API_KEY),
  api_secret: cleanVal(process.env.CLOUDINARY_API_SECRET)
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadToCloudinary = (fileBuffer, folder = 'wishcard_proofs') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary
};
