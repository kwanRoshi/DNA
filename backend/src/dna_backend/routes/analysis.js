import express from 'express';
import multer from 'multer';
import { MulterError } from 'multer';
import DeepseekService from '../services/deepseekService.js';
import fs from 'fs';

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimeTypes = {
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'xls': 'application/vnd.ms-excel',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    
    const detectedType = mimeTypes[ext];
    if (detectedType) {
      file.mimetype = detectedType;
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}`));
    }
  }
});
const deepseekService = new DeepseekService();

router.post('/analyze', (req, res, next) => {
  upload.single('healthData')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileContent = await fs.promises.readFile(req.file.path, 'utf8');
    console.log('Analyzing content with DeepSeek...');
    
    let result;
    if (req.file.mimetype.startsWith('image/')) {
      result = await deepseekService.analyzeImage(req.file.path);
    } else {
      result = await deepseekService.analyzeText(fileContent);
    }

    // Clean up uploaded file
    try {
      await fs.promises.unlink(req.file.path);
    } catch (err) {
      console.error('Error cleaning up file:', err);
    }

    res.json(result);
  } catch (error) {
    console.error('Error analyzing content:', error);
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file after error:', err);
      }
    }
    res.status(400).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export { router };             