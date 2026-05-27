const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|zip|txt|csv/;
  const allowedAudioTypes = /mp3|wav|ogg|m4a|aac/;
  const allowedVideoTypes = /mp4|mov|webm|avi|mkv|3gp/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (
    (mime.startsWith('image/') && allowedImageTypes.test(ext)) ||
    allowedDocTypes.test(ext) ||
    (mime.startsWith('audio/') && allowedAudioTypes.test(ext)) ||
    (mime.startsWith('video/') && allowedVideoTypes.test(ext))
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
