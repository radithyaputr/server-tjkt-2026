const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../repository');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');
    // Avoid overwriting existing files
    let finalName = safeName;
    let counter = 1;
    while (fs.existsSync(path.join(uploadDir, finalName))) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      finalName = `${base}_${counter}${ext}`;
      counter++;
    }
    cb(null, finalName);
  }
});

const MIMETYPE_MAP = {
  '.pdf': 'application/pdf',
  '.zip': ['application/zip', 'application/x-zip-compressed'],
  '.rar': ['application/vnd.rar', 'application/x-rar-compressed'],
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.iso': ['application/octet-stream', 'application/x-iso9660-image'],
};

const ALLOWED_EXTENSIONS = Object.keys(MIMETYPE_MAP);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type "${ext}" is not allowed. Only: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
  const allowedMimes = Array.isArray(MIMETYPE_MAP[ext]) ? MIMETYPE_MAP[ext] : [MIMETYPE_MAP[ext]];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error(`MIME type "${file.mimetype}" does not match extension "${ext}".`), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {}
});

module.exports = upload;
