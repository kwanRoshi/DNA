import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { catchAsync } from '../middleware/errorMiddleware.js';
import { analyzeHealthData } from '../controllers/aiController.js';
import { analyzeImage } from '../controllers/imageAnalysisController.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// File Analysis Routes
router.post('/analyze', 
  upload.single('healthData'),
  catchAsync(analyzeHealthData)
);

router.post('/image-analysis',
  upload.single('image'),
  catchAsync(analyzeImage)
);

// 文件上传路由
router.post('/upload', 
  catchAsync(async (req, res) => {
    let uploadError = null;
    await new Promise((resolve) => {
      upload.single('healthData')(req, res, (err) => {
        if (err) {
          uploadError = err;
        }
        resolve();
      });
    });

    if (uploadError) {
      return res.status(400).json({ error: '文件上传失败' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '请上传健康数据文件' });
    }

    let fileContent;
    try {
      fileContent = await fs.readFile(req.file.path, 'utf-8');
    } catch (error) {
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('清理文件失败:', err);
        }
      }
      throw error;
    }

    try {
      const fileInfo = {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        content: fileContent
      };

      // 删除临时文件
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('清理文件失败:', err);
        }
      }

      res.json({ 
        message: '文件上传成功',
        fileInfo 
      });
    } catch (error) {
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          console.error('清理文件失败:', err);
        }
      }
      throw error;
    }
  })
);

export default router;
