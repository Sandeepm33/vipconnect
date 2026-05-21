const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload dirs exist
const createDirs = (...dirs) => {
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirs(
  path.join(__dirname, '../../uploads/avatars'),
  path.join(__dirname, '../../uploads/groups'),
  path.join(__dirname, '../../uploads/images'),
  path.join(__dirname, '../../uploads/documents'),
  path.join(__dirname, '../../uploads/audio')
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../../uploads/documents');

    if (file.mimetype.startsWith('image/')) {
      if (req.uploadType === 'avatar') {
        uploadPath = path.join(__dirname, '../../uploads/avatars');
      } else if (req.uploadType === 'group') {
        uploadPath = path.join(__dirname, '../../uploads/groups');
      } else {
        uploadPath = path.join(__dirname, '../../uploads/images');
      }
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = path.join(__dirname, '../../uploads/audio');
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|zip|txt|csv/;
  const allowedAudioTypes = /mp3|wav|ogg|m4a|aac/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (
    mime.startsWith('image/') && allowedImageTypes.test(ext) ||
    allowedDocTypes.test(ext) ||
    mime.startsWith('audio/') && allowedAudioTypes.test(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported: ${ext}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
  },
});

module.exports = upload;
