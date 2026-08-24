require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function inspectCloudinary() {
  try {
    const sampleBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const base64Data = `data:image/png;base64,${sampleBuffer.toString('base64')}`;

    console.log("Attempting direct cloudinary.uploader.upload...");
    const res = await cloudinary.uploader.upload(base64Data, {
      folder: 'suko_test'
    });
    console.log("✅ Success direct upload:", res);
  } catch (err) {
    console.error("❌ Direct upload error details:", err);
  }
}

inspectCloudinary();
