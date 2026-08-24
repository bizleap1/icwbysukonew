require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function testCloudinaryConnection() {
  console.log("☁️ Testing Cloudinary configuration...");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key configured:", Boolean(process.env.CLOUDINARY_API_KEY));
  console.log("API Secret configured:", Boolean(process.env.CLOUDINARY_API_SECRET));

  try {
    const pingRes = await cloudinary.api.ping();
    console.log("✅ Cloudinary Ping successful:", pingRes);
  } catch (err) {
    console.error("❌ Cloudinary Ping failed:", err.message);
  }
}

testCloudinaryConnection();
