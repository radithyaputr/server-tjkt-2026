const File = require('../models/File');
const { FILE_CATEGORIES, REPO_DIR, formatSize } = require('../config/constants');
const path = require('path');
const fs = require('fs');


const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const category = req.body.category && FILE_CATEGORIES.includes(req.body.category)
      ? req.body.category
      : '03_Tools_Praktik_TJKT';

    const file = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      category: category,
      uploadedBy: req.userId
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        category: file.category,
        downloadCount: file.downloadCount
      }
    });
  } catch (error) {
    console.error('uploadFile error:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

const getFiles = async (req, res) => {
  try {
    const { search, category, limit = 50, offset = 0 } = req.query;
    const pageLimit = Math.min(parseInt(limit, 10) || 50, 200);
    const pageOffset = parseInt(offset, 10) || 0;

    let result = [];

    for (const cat of FILE_CATEGORIES) {
      if (category && category !== 'all' && category !== cat) continue;

      const dir = path.join(REPO_DIR, cat);
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;

        if (search && !entry.name.toLowerCase().includes(search.toLowerCase())) continue;

        let record = await File.findOne({ where: { filename: entry.name, category: cat } });
        if (!record) {
          record = await File.create({
            filename: entry.name,
            originalName: entry.name,
            path: path.join(REPO_DIR, cat, entry.name),
            category: cat,
            uploadedBy: 1,
          });
        }

        const filePath = path.join(REPO_DIR, cat, entry.name);
        let fileSize = 0;
        try { fileSize = fs.statSync(filePath).size; } catch (e) { fileSize = 0; }

        result.push({
          id: record.id,
          filename: record.filename,
          originalName: record.originalName,
          category: record.category,
          downloadCount: record.downloadCount,
          size: fileSize,
          sizeFormatted: formatSize(fileSize),
          createdAt: record.createdAt,
        });
      }
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = result.length;
    result = result.slice(pageOffset, pageOffset + pageLimit);
    res.status(200).json({ files: result, total, limit: pageLimit, offset: pageOffset });
  } catch (error) {
    console.error('getFiles error:', error);
    res.status(500).json({ message: 'Failed to retrieve files' });
  }
};

const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileRecord = await File.findByPk(fileId);

    if (!fileRecord) {
      return res.status(404).json({ message: 'File not found' });
    }

    const category = fileRecord.category && FILE_CATEGORIES.includes(fileRecord.category)
      ? fileRecord.category
      : '03_Tools_Praktik_TJKT';
    const safePath = path.join(REPO_DIR, category, path.basename(fileRecord.filename));
    const resolvedPath = path.resolve(safePath);

    const allowedBase = path.resolve(REPO_DIR);
    if (!resolvedPath.startsWith(allowedBase)) {
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

    const category = fileRecord.category && FILE_CATEGORIES.includes(fileRecord.category)
      ? fileRecord.category
      : '03_Tools_Praktik_TJKT';
    const safePath = path.join(REPO_DIR, category, path.basename(fileRecord.filename));
    const resolvedPath = path.resolve(safePath);

    const allowedBase = path.resolve(REPO_DIR);
    if (!resolvedPath.startsWith(allowedBase)) {
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


