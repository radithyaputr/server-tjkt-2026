const path = require('path');

const FILE_CATEGORIES = ['01_Sistem_Operasi', '02_Aplikasi_Utama', '03_Tools_Praktik_TJKT', '04_Video_Tutorial'];
const MEMORY_CATEGORIES = ['MPLS', 'Bukber', 'Study_Tour', 'Class_Meeting', 'Praktik', 'Lainnya'];

const REPO_DIR = path.resolve(__dirname, '../../repository');
const MEMO_DIR = path.resolve(__dirname, '../../repository/memories');

const CATEGORY_LABELS = {
  '01_Sistem_Operasi': 'Sistem Operasi',
  '02_Aplikasi_Utama': 'Aplikasi Utama',
  '03_Tools_Praktik_TJKT': 'Tools Praktik TJKT',
  '04_Video_Tutorial': 'Video Tutorial',
  'MPLS': 'MPLS',
  'Bukber': 'Bukber',
  'Study_Tour': 'Study Tour',
  'Class_Meeting': 'Class Meeting',
  'Praktik': 'Praktik',
  'Lainnya': 'Lainnya',
};

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

function sanitizePath(filePath, allowedBase) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(allowedBase))) return null;
  return resolved;
}

module.exports = {
  FILE_CATEGORIES,
  MEMORY_CATEGORIES,
  REPO_DIR,
  MEMO_DIR,
  CATEGORY_LABELS,
  formatSize,
  sanitizePath,
};