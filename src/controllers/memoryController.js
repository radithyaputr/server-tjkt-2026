const Memory = require('../models/Memory');
const path = require('path');
const fs = require('fs');

const MEMORY_CATEGORIES = ['MPLS', 'Bukber', 'Study_Tour', 'Class_Meeting', 'Praktik', 'Lainnya'];
const MEMO_DIR = path.resolve(__dirname, '../../repository/memories');

const getMemories = async (req, res) => {
  try {
    const { search, category, limit = 50, offset = 0 } = req.query;
    const pageLimit = Math.min(parseInt(limit, 10) || 50, 200);
    const pageOffset = parseInt(offset, 10) || 0;

    const where = {};
    if (category && MEMORY_CATEGORIES.includes(category)) {
      where.category = category;
    }
    if (search) {
      where.originalName = { [require('sequelize').Op.like]: `%${search}%` };
    }

    const { count, rows } = await Memory.findAndCountAll({
      where: Object.keys(where).length ? where : undefined,
      order: [['createdAt', 'DESC']],
      limit: pageLimit,
      offset: pageOffset,
    });

    const result = rows.map(r => {
      const filePath = path.join(MEMO_DIR, r.category, r.filename);
      let fileSize = 0;
      try { fileSize = fs.statSync(filePath).size; } catch (e) { fileSize = 0; }
      return {
        id: r.id,
        filename: r.filename,
        originalName: r.originalName,
        category: r.category,
        caption: r.caption || '',
        size: fileSize,
        createdAt: r.createdAt,
      };
    });

    res.json({ memories: result, total: count, limit: pageLimit, offset: pageOffset });
  } catch (error) {
    console.error('getMemories error:', error);
    res.status(500).json({ message: 'Failed to retrieve memories' });
  }
};

const uploadMemory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const category = req.body.category && MEMORY_CATEGORIES.includes(req.body.category)
      ? req.body.category
      : 'Lainnya';
    const memory = await Memory.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      category,
      caption: req.body.caption || '',
      uploadedBy: req.userId,
    });
    res.status(201).json({
      message: 'Memory uploaded successfully',
      memory: {
        id: memory.id,
        filename: memory.filename,
        originalName: memory.originalName,
        category: memory.category,
        caption: memory.caption,
      }
    });
  } catch (error) {
    console.error('uploadMemory error:', error);
    res.status(500).json({ message: 'Failed to upload memory' });
  }
};

const deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findByPk(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Memory not found' });
    const filePath = path.join(MEMO_DIR, memory.category, memory.filename);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(MEMO_DIR))) {
      return res.status(400).json({ message: 'Invalid file path' });
    }
    if (fs.existsSync(resolvedPath)) fs.unlinkSync(resolvedPath);
    await memory.destroy();
    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    console.error('deleteMemory error:', error);
    res.status(500).json({ message: 'Failed to delete memory' });
  }
};

module.exports = { getMemories, uploadMemory, deleteMemory };
