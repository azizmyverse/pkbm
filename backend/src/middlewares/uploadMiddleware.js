const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ROOT_UPLOAD = path.resolve(process.env.UPLOAD_PATH || './uploads');
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.doc', '.docx'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function safeFilename(original) {
  const cleaned = original.replace(/\s/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
  return `${Date.now()}-${cleaned}`;
}

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.includes(ext)) {
    return cb(null, true);
  }
  return cb(new Error('Tipe file tidak diizinkan'));
}

function buildMulter(subdir) {
  const dest = path.join(ROOT_UPLOAD, subdir);
  ensureDir(dest);

  const storage = multer.diskStorage({
    destination(_req, _file, cb) {
      ensureDir(dest);
      cb(null, dest);
    },
    filename(_req, file, cb) {
      cb(null, safeFilename(file.originalname));
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
  });
}

const uploadAvatar = buildMulter('avatars').single('avatar');
const uploadMateri = buildMulter('materi').single('file');
const uploadTugas = buildMulter('tugas').single('file');
const uploadAny = buildMulter('misc').any();

module.exports = {
  uploadAvatar,
  uploadMateri,
  uploadTugas,
  uploadAny,
};
