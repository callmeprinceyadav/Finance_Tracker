const express = require('express');
const {
  upload,
  uploadStatement,
  getUploadHistory,
  handleUploadErrors
} = require('../controllers/uploadController');

const router = express.Router();

// POST /api/upload/statement - Upload bank statement file
router.post('/statement', upload, uploadStatement, handleUploadErrors);

// GET /api/upload/history - Get upload history and stats
router.get('/history', getUploadHistory);

module.exports = router;
