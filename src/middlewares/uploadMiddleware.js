const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseDir = path.join(__dirname, '../../repository');

const CATEGORIES = ['01_Sistem_Operasi', '02_Aplikasi_Utama', '03_Tools_Praktik_TJKT', '04_Video_Tutorial'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let category = req.body.category;
    if (!category || !CATEGORIES.includes(category)) {
      category = '03_Tools_Praktik_TJKT';
    }
    const destDir = path.join(baseDir, category);
    fs.mkdirSync(destDir, { recursive: true });
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const category = req.body.category && CATEGORIES.includes(req.body.category)
      ? req.body.category
      : '03_Tools_Praktik_TJKT';
    const destDir = path.join(baseDir, category);
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
  '.mp4': ['video/mp4', 'application/octet-stream'],
  '.mp3': ['audio/mpeg', 'audio/mp3'],
  // New TJKT specific extensions
  '.exe': ['application/x-msdownload', 'application/octet-stream', 'application/x-ms-dos-executable', 'application/x-dosexec'],
  '.msi': ['application/x-msi', 'application/octet-stream'],
  '.ova': ['application/x-virtualbox-ova', 'application/octet-stream'],
  '.ovf': ['application/x-virtualbox-ovf', 'application/octet-stream'],
  '.tar': ['application/x-tar', 'application/octet-stream'],
  '.gz': ['application/gzip', 'application/x-gzip', 'application/octet-stream'],
  '.tgz': ['application/gzip', 'application/x-gzip', 'application/octet-stream'],
  '.deb': ['application/vnd.debian.binary-package', 'application/x-debian-package', 'application/octet-stream'],
  '.rpm': ['application/x-rpm', 'application/x-redhat-package-manager', 'application/octet-stream'],
  '.sh': ['application/x-sh', 'text/x-shellscript', 'application/octet-stream', 'text/plain'],
  '.bat': ['application/x-msdos-program', 'application/octet-stream', 'text/plain'],
  '.ps1': ['application/octet-stream', 'text/plain'],
  '.img': ['application/octet-stream', 'application/x-raw-disk-image'],
  '.txt': 'text/plain',
  '.csv': ['text/csv', 'application/vnd.ms-excel'],
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

const FILE_SIZE_LIMIT = Math.max(1, parseInt(process.env.MAX_FILE_SIZE_MB || '200', 10) || 200) * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: 1,
  },
});

module.exports = upload;
