const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MEMORY_CATEGORIES = ['MPLS', 'Bukber', 'Study_Tour', 'Class_Meeting', 'Praktik', 'Lainnya'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let category = req.body.category;
    if (!category || !MEMORY_CATEGORIES.includes(category)) {
      category = 'Lainnya';
    }
    const destDir = path.join(__dirname, '../../repository/memories', category);
    fs.mkdirSync(destDir, { recursive: true });
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const category = req.body.category && MEMORY_CATEGORIES.includes(req.body.category)
      ? req.body.category
      : 'Lainnya';
    const destDir = path.join(__dirname, '../../repository/memories', category);
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_');
    let finalName = safeName;
    let counter = 1;
    while (fs.existsSync(path.join(destDir, finalName))) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      finalName = `${base}_${counter}${ext}`;
      counter++;
    }
    cb(null, finalName);
  }
});

const ALLOWED_MEMORY_TYPES = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.mp4': ['video/mp4'],
  '.webm': ['video/webm'],
  '.ogg': ['video/ogg'],
};

const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_MEMORY_TYPES);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type "${ext}" not allowed. Only images & videos.`), false);
  }
  const allowedMimes = Array.isArray(ALLOWED_MEMORY_TYPES[ext])
    ? ALLOWED_MEMORY_TYPES[ext]
    : [ALLOWED_MEMORY_TYPES[ext]];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error(`MIME type mismatch for "${ext}".`), false);
  }
  cb(null, true);
};

const MEMORY_SIZE_LIMIT = Math.max(1, parseInt(process.env.MAX_MEMORY_SIZE_MB || '50', 10) || 50) * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MEMORY_SIZE_LIMIT,
    files: 1,
  },
});

module.exports = upload;
