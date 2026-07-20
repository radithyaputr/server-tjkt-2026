const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const fileController = require('../controllers/fileController');
const memoryController = require('../controllers/memoryController');
const { verifyToken, isAdminOrGuru } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const uploadMemory = require('../middlewares/uploadMemoryMiddleware');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', verifyToken, authController.logout);
router.get('/auth/me', verifyToken, authController.getMe);
router.get('/auth/check-repo', verifyToken, authController.checkRepoAccess);
router.put('/auth/change-password', verifyToken, authController.changePassword);

// File Routes (public — no login required to view & download)
router.get('/files', fileController.getFiles);
router.get('/files/download/:id', fileController.downloadFile);

// Upload with Multer error handling
router.post('/files/upload', [verifyToken, isAdminOrGuru], (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 200MB.'
        : err.message || 'Upload failed.';
      return res.status(400).json({ message });
    }
    next();
  });
}, fileController.uploadFile);

router.delete('/files/:id', [verifyToken, isAdminOrGuru], fileController.deleteFile);

// Memory Routes (Gallery)
router.get('/memories', memoryController.getMemories);
router.post('/memories/upload', [verifyToken, isAdminOrGuru], (req, res, next) => {
  uploadMemory.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload failed.' });
    next();
  });
}, memoryController.uploadMemory);
router.delete('/memories/:id', [verifyToken, isAdminOrGuru], memoryController.deleteMemory);

module.exports = router;
