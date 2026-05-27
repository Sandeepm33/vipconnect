const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const fs = require('fs');
const fsPromises = require('fs').promises;

/**
 * Uploads a file buffer to AWS S3, falling back to local filesystem on failure.
 * @param {Buffer} fileBuffer - The file content buffer.
 * @param {string} originalName - The original file name.
 * @param {string} mimeType - The mime type of the file.
 * @param {string} subDir - The subdirectory under uploads.
 * @returns {Promise<{url: string, filename: string}>}
 */
const uploadToS3 = async (fileBuffer, originalName, mimeType, subDir) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const filename = `${uniqueSuffix}${path.extname(originalName)}`;
  const key = `uploads/${subDir}/${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // virtual hosted-style S3 URL
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return { url, filename };
  } catch (error) {
    console.error('⚠️ AWS S3 upload failed, falling back to local file storage:', error.message);
    
    // Create local path
    const localDir = path.join(__dirname, '../../uploads', subDir);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    const localPath = path.join(localDir, filename);
    await fsPromises.writeFile(localPath, fileBuffer);
    
    // Generate local URL
    const url = process.env.BACKEND_URL
      ? `${process.env.BACKEND_URL}/uploads/${subDir}/${filename}`
      : `/uploads/${subDir}/${filename}`;
    
    return { url, filename };
  }
};

module.exports = { s3Client, uploadToS3 };
