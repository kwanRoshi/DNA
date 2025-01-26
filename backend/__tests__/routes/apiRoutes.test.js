import request from 'supertest';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { loginUser, getUserData } from '../../controllers/userController.js';
import { analyzeHealthData, getAnalysisHistory } from '../../controllers/aiController.js';
import {
  analyzeImage,
  getAnalysisHistory as getImageAnalysisHistory,
  deleteAnalysis,
  updateAnalysisNote
} from '../../controllers/imageAnalysisController.js';

// 模拟所有依赖
jest.mock('multer', () => {
  const multerMock = () => ({
    single: jest.fn().mockImplementation(field => (req, res, next) => {
      if (req.shouldFailUpload) {
        return next(new Error('文件上传失败'));
      }
      if (req.headers['skip-file']) {
        return res.status(400).json({ error: '请上传健康数据文件' });
      }
      req.file = {
        path: 'mock/path',
        originalname: `test.${field === 'image' ? 'jpg' : 'txt'}`,
        mimetype: field === 'image' ? 'image/jpeg' : 'text/plain',
        size: 1024
      };
      next();
    })
  });
  multerMock.memoryStorage = jest.fn();
  return multerMock;
});

jest.mock('../../models/User.js');
jest.mock('../../controllers/userController.js');
jest.mock('../../controllers/aiController.js');
jest.mock('../../controllers/imageAnalysisController.js');
jest.mock('../../middleware/validateMiddleware.js', () => ({
  validateWalletAddress: jest.fn((req, res, next) => next()),
  validateHealthDataUpload: jest.fn((req, res, next) => next())
}));
jest.mock('../../middleware/authMiddleware.js', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { walletAddress: '0x123456789' };
    next();
  })
}));
jest.mock('fs/promises');

// 导入路由
import router from '../../routes/apiRoutes.js';

describe('API Routes', () => {
  let app;
  const mockToken = 'mock-token';
  const mockUser = {
    walletAddress: '0x123456789',
    healthData: []
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);

    // 重置所有模拟
    jest.clearAllMocks();

    // 模拟控制器函数
    loginUser.mockImplementation((req, res) => res.json({ token: 'mock-token' }));
    getUserData.mockImplementation((req, res) => res.json({ user: 'mock-user' }));
    analyzeHealthData.mockImplementation((req, res) => res.json({ analysis: 'mock-analysis' }));
    getAnalysisHistory.mockImplementation((req, res) => res.json({ history: [] }));
    analyzeImage.mockImplementation((req, res) => res.json({ analysis: 'mock-image-analysis' }));
    getImageAnalysisHistory.mockImplementation((req, res) => res.json({ history: [] }));
    deleteAnalysis.mockImplementation((req, res) => res.json({ message: '删除成功' }));
    updateAnalysisNote.mockImplementation((req, res) => res.json({ message: '更新成功' }));

    // 模拟 JWT 验证
    jest.spyOn(jwt, 'verify').mockImplementation(() => ({ walletAddress: mockUser.walletAddress }));

    // 模拟文件操作
    fs.readFile.mockResolvedValue('test file content');
    fs.unlink.mockResolvedValue();

    // 模拟数据库操作
    User.findOne.mockResolvedValue(mockUser);
    User.findOneAndUpdate.mockResolvedValue(mockUser);
  });

  describe('认证路由', () => {
    test('POST /api/login - 成功登录', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ walletAddress: mockUser.walletAddress });

      expect(response.status).toBe(200);
      expect(loginUser).toHaveBeenCalled();
    });

    test('GET /api/user - 获取用户数据', async () => {
      const response = await request(app)
        .get('/api/user')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(getUserData).toHaveBeenCalled();
    });

    test('GET /api/user - 无token时返回401', async () => {
      const { protect } = require('../../middleware/authMiddleware.js');
      protect.mockImplementationOnce((req, res) => {
        res.status(401).json({ error: '未授权' });
      });

      const response = await request(app)
        .get('/api/user');

      expect(response.status).toBe(401);
    });
  });

  describe('健康数据分析路由', () => {
    test('POST /api/analyze - 分析健康数据', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .set('Authorization', `Bearer ${mockToken}`)
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(response.status).toBe(200);
      expect(analyzeHealthData).toHaveBeenCalled();
    });

    test('GET /api/analysis-history - 获取分析历史', async () => {
      const response = await request(app)
        .get('/api/analysis-history')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(getAnalysisHistory).toHaveBeenCalled();
    });
  });

  describe('图片分析路由', () => {
    test('POST /api/image-analysis - 分析图片', async () => {
      const response = await request(app)
        .post('/api/image-analysis')
        .set('Authorization', `Bearer ${mockToken}`)
        .attach('image', Buffer.from('test image'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(analyzeImage).toHaveBeenCalled();
    });

    test('GET /api/image-analysis-history - 获取图片分析历史', async () => {
      const response = await request(app)
        .get('/api/image-analysis-history')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(getImageAnalysisHistory).toHaveBeenCalled();
    });

    test('DELETE /api/image-analysis/:analysisId - 删除分析', async () => {
      const response = await request(app)
        .delete('/api/image-analysis/123')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(deleteAnalysis).toHaveBeenCalled();
    });

    test('PATCH /api/image-analysis/:analysisId/note - 更新分析笔记', async () => {
      const response = await request(app)
        .patch('/api/image-analysis/123/note')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ note: '测试笔记' });

      expect(response.status).toBe(200);
      expect(updateAnalysisNote).toHaveBeenCalled();
    });
  });

  describe('文件上传路由', () => {
    test('POST /api/upload - 上传健康数据文件', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${mockToken}`)
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '文件上传成功');
    });

    test('POST /api/upload - 文件上传失败时返回错误', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${mockToken}`)
        .set('skip-file', 'true');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '请上传健康数据文件');
    });

    test('POST /api/upload - 文件读取失败时返回500', async () => {
      fs.readFile.mockRejectedValue(new Error('读取失败'));

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${mockToken}`)
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(response.status).toBe(500);
    });

    test('POST /api/upload - 文件清理失败时记录错误', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      fs.unlink.mockRejectedValue(new Error('清理失败'));

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${mockToken}`)
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(consoleSpy).toHaveBeenCalledWith('清理文件失败:', expect.any(Error));
      expect(response.status).toBe(200);
      consoleSpy.mockRestore();
    });
  });

  describe('错误处理', () => {
    test('无效的 token 应返回 401', async () => {
      const { protect } = require('../../middleware/authMiddleware.js');
      protect.mockImplementationOnce((req, res) => {
        res.status(401).json({ error: '无效的 token' });
      });

      const response = await request(app)
        .get('/api/user')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('无效的钱包地址应返回 400', async () => {
      const { validateWalletAddress } = require('../../middleware/validateMiddleware.js');
      validateWalletAddress.mockImplementationOnce((req, res) => {
        res.status(400).json({ error: '无效的钱包地址' });
      });

      const response = await request(app)
        .post('/api/login')
        .send({ walletAddress: 'invalid-address' });

      expect(response.status).toBe(400);
    });

    test('无效的健康数据文件应返回 400', async () => {
      const { validateHealthDataUpload } = require('../../middleware/validateMiddleware.js');
      validateHealthDataUpload.mockImplementationOnce((req, res) => {
        res.status(400).json({ error: '无效的健康数据文件' });
      });

      const response = await request(app)
        .post('/api/analyze')
        .set('Authorization', `Bearer ${mockToken}`)
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(response.status).toBe(400);
    });
  });
});