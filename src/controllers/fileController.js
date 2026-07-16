const File = require('../models/File');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const file = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      uploadedBy: req.userId // from auth middleware
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: { id: file.id, filename: file.filename, originalName: file.originalName, downloadCount: file.downloadCount }
    });
  } catch (error) {
    console.error('uploadFile error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.findAll({
      include: [{ model: User, attributes: ['username', 'role'] }],
      attributes: { exclude: ['path'] }
    });
    res.status(200).json(files);
  } catch (error) {
    console.error('getFiles error:', error);
    res.status(500).json({ message: 'Failed to retrieve files' });
  }
};

const UPLOAD_DIR = path.resolve(__dirname, '../../repository');

const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileRecord = await File.findByPk(fileId);

    if (!fileRecord) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Reconstruct safe path to prevent DB-level path traversal
    const safePath = path.join(UPLOAD_DIR, path.basename(fileRecord.filename));
    const resolvedPath = path.resolve(safePath);

    // Ensure resolved path is still within uploads directory
    if (!resolvedPath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    if (fs.existsSync(resolvedPath)) {
      fileRecord.downloadCount += 1;
      await fileRecord.save();

      res.download(resolvedPath, fileRecord.originalName);
    } else {
      res.status(404).json({ message: 'File physically not found on server' });
    }
  } catch (error) {
    console.error('downloadFile error:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
};

const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileRecord = await File.findByPk(fileId);

    if (!fileRecord) {
      return res.status(404).json({ message: 'File not found' });
    }

    const safePath = path.join(UPLOAD_DIR, path.basename(fileRecord.filename));
    const resolvedPath = path.resolve(safePath);

    if (!resolvedPath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    await fileRecord.destroy();
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('deleteFile error:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile
};
