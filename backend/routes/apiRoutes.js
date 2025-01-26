import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import User from '../models/User.js';
import { validateWalletAddress, validateHealthDataUpload } from '../middleware/validateMiddleware.js';
import { catchAsync } from '../middleware/errorMiddleware.js';
import { analyzeHealthData, getAnalysisHistory } from '../controllers/aiController.js';
import { loginUser, getUserData } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  analyzeImage,
  getAnalysisHistory as getImageAnalysisHistory,
  deleteAnalysis,
  updateAnalysisNote
} from '../controllers/imageAnalysisController.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// 用户认证路由
router.post('/login', validateWalletAddress, catchAsync(loginUser));
router.get('/user', protect, catchAsync(getUserData));

// 健康数据分析路由
router.post('/analyze', 
  protect, 
  upload.single('healthData'),
  validateHealthDataUpload,
  catchAsync(analyzeHealthData)
);
router.get('/analysis-history', protect, catchAsync(getAnalysisHistory));

// 图片分析路由
router.post('/image-analysis',
  protect,
  upload.single('image'),
  catchAsync(analyzeImage)
);

router.get('/image-analysis-history',
  protect,
  catchAsync(getImageAnalysisHistory)
);

router.delete('/image-analysis/:analysisId',
  protect,
  catchAsync(deleteAnalysis)
);

router.patch('/image-analysis/:analysisId/note',
  protect,
  catchAsync(updateAnalysisNote)
);

// 文件上传路由
router.post('/upload', 
  protect,
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

      // 更新用户的健康数据记录
      await User.findOneAndUpdate(
        { walletAddress: req.user.walletAddress },
        { $push: { healthData: fileInfo } },
        { new: true }
      );

      // 删除临时文件
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('清理文件失败:', err);
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
