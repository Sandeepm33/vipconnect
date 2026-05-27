const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.csv': 'text/csv'
};

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
};

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;

if (!bucketName || !region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ Missing AWS S3 configuration in environment variables.');
  process.exit(1);
}

const getS3Url = (relativeKey) => {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${relativeKey}`;
};

const convertToS3Url = (url) => {
  if (!url) return url;
  // If it's already an S3 URL, skip
  if (url.includes('.amazonaws.com/')) return url;
  
  // Format matching local host, Render deploy or relative uploads paths
  // e.g. http://localhost:5000/uploads/avatars/file.jpg -> uploads/avatars/file.jpg
  // e.g. /uploads/avatars/file.jpg -> uploads/avatars/file.jpg
  const uploadMatch = url.match(/(?:\/|^)uploads\/(.+)$/);
  if (uploadMatch) {
    const key = `uploads/${uploadMatch[1]}`;
    return getS3Url(key);
  }
  return url;
};

const uploadFile = async (localFilePath, s3Key) => {
  try {
    const fileBuffer = fs.readFileSync(localFilePath);
    const mimeType = getMimeType(localFilePath);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    
    await s3Client.send(command);
    console.log(`✅ Uploaded: ${localFilePath} -> ${s3Key}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to upload ${localFilePath}:`, err.message);
    return false;
  }
};

const runMigration = async () => {
  console.log('🚀 Starting S3 Upload and Database Migration...');
  
  // 1. Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB.');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
  
  // 2. Scan and upload files in backend/uploads
  const uploadsDir = path.join(__dirname, '../../uploads');
  let uploadedCount = 0;
  
  if (fs.existsSync(uploadsDir)) {
    const subDirs = ['avatars', 'groups', 'images', 'audio', 'documents'];
    for (const subDir of subDirs) {
      const subDirPath = path.join(uploadsDir, subDir);
      if (fs.existsSync(subDirPath)) {
        const files = fs.readdirSync(subDirPath);
        for (const file of files) {
          const localFilePath = path.join(subDirPath, file);
          const stat = fs.statSync(localFilePath);
          if (stat.isFile()) {
            const s3Key = `uploads/${subDir}/${file}`;
            const success = await uploadFile(localFilePath, s3Key);
            if (success) uploadedCount++;
          }
        }
      }
    }
  } else {
    console.log('📂 Local uploads directory not found, skipping file uploads.');
  }
  
  console.log(`\n🎉 Uploaded ${uploadedCount} files to S3.\n`);
  
  // 3. Update Database records
  console.log('🔄 Updating database records...');
  
  // Users
  let usersUpdated = 0;
  const users = await User.find({ 'avatar.url': { $regex: /\/uploads\// } });
  for (const user of users) {
    const oldUrl = user.avatar.url;
    const newUrl = convertToS3Url(oldUrl);
    if (newUrl !== oldUrl) {
      user.avatar.url = newUrl;
      await user.save();
      usersUpdated++;
    }
  }
  console.log(`👤 Users updated: ${usersUpdated}`);
  
  // Chats (Groups)
  let chatsUpdated = 0;
  const chats = await Chat.find({ 'groupPicture.url': { $regex: /\/uploads\// } });
  for (const chat of chats) {
    const oldUrl = chat.groupPicture.url;
    const newUrl = convertToS3Url(oldUrl);
    if (newUrl !== oldUrl) {
      chat.groupPicture.url = newUrl;
      await chat.save();
      chatsUpdated++;
    }
  }
  console.log(`👥 Group Chats updated: ${chatsUpdated}`);
  
  // Messages
  let messagesUpdated = 0;
  const messages = await Message.find({ 'file.url': { $regex: /\/uploads\// } });
  for (const msg of messages) {
    const oldUrl = msg.file.url;
    const newUrl = convertToS3Url(oldUrl);
    if (newUrl !== oldUrl) {
      msg.file.url = newUrl;
      await msg.save();
      messagesUpdated++;
    }
  }
  console.log(`💬 Message attachments updated: ${messagesUpdated}`);
  
  console.log('\n🏁 S3 Migration completed successfully!');
  mongoose.connection.close();
};

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  mongoose.connection.close();
});
