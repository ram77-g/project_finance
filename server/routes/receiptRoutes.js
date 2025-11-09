import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import * as receiptController from '../controllers/receiptController.js';
import requireAuth from '../middleware/requireAuth.js';

//Handle __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

//Multer storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

//File type & size validation
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'application/pdf'
];
const MAX_SIZE = 5 * 1024 * 1024; //5MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image and text/PDF files allowed!'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE }
});

//Routes
router.get('/', requireAuth, receiptController.getReceipts);

router.get('/:id/download', requireAuth, receiptController.downloadReceipt);

router.post(
  '/upload',
  requireAuth,
  upload.array('receipts', 5),
  receiptController.uploadReceipt
);
router.delete('/:id', requireAuth, receiptController.deleteReceipt);

export default router;