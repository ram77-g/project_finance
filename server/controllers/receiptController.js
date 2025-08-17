import Receipt from '../models/Receipt.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/receipts - List user's receipts
export const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ user: req.user?.userId }).sort({ uploadedAt: -1 });
    res.json(receipts);
  } catch (err) {
    console.error('Error fetching receipts:', err);
    res.status(500).json({ error: 'Failed to fetch receipts.' });
  }
};

// GET /api/receipts/:id/download - Force file download (works for PDF, etc.)
export const downloadReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, user: req.user?.userId });
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found.' });
    }
    const filePath = path.join(__dirname, '..', receipt.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }
    // Set correct headers; will force download for all types
    res.download(filePath, receipt.originalName);
  } catch (err) {
    console.error('Error downloading receipt:', err);
    res.status(500).json({ error: 'Failed to download receipt.' });
  }
};

// POST /api/receipts/upload - Save new receipts
export const uploadReceipt = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: User not found in request.' });
    }
    const savedReceipts = [];
    for (const file of req.files) {
      const newReceipt = await Receipt.create({
        user: req.user.userId,
        filename: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/${file.filename}`, // relative path for browser
      });
      savedReceipts.push(newReceipt);
    }
    res.status(201).json(savedReceipts); // Always an array
  } catch (err) {
    console.error('Receipt upload error:', err);
    res.status(500).json({ error: 'Failed to upload receipts.' });
  }
};

// DELETE /api/receipts/:id - Remove receipt and file
export const deleteReceipt = async (req, res) => {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, user: req.user?.userId });
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found.' });
    }
    const filePath = path.join(__dirname, '..', receipt.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await receipt.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting receipt:', err);
    res.status(500).json({ error: 'Failed to delete receipt.' });
  }
};