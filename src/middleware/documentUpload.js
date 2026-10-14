const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const allowedExtensions = new Set(['pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx', 'jpg', 'png']);
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE_MB || 50) * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).slice(1).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return callback(new ApiError('Unsupported file extension', 400, 'INVALID_FILE_TYPE'));
    }
    callback(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError('File exceeds the maximum upload size', 400, 'FILE_TOO_LARGE'));
    }
      if (error instanceof multer.MulterError && error.code === 'MISSING_FIELD_NAME') {
        return next(new ApiError(
          'Every multipart form-data row must have a field name. Use file for the upload and document_request_id for the request ID.',
          400,
          'MISSING_FIELD_NAME'
        ));
      }
    next(error);
  });
};

module.exports = handleUpload;