import request from 'supertest';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { analyzeHealthData } from '../../controllers/aiController.js';
import { analyzeImage } from '../../controllers/imageAnalysisController.js';

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

jest.mock('../../controllers/aiController.js');
jest.mock('../../controllers/imageAnalysisController.js');
jest.mock('fs/promises');

// 导入路由
import router from '../../routes/apiRoutes.js';

describe('API Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);

    // Reset all mocks
    jest.clearAllMocks();

    // Mock controller functions
    analyzeHealthData.mockImplementation((req, res) => res.json({ analysis: 'mock-analysis' }));
    analyzeImage.mockImplementation((req, res) => res.json({ analysis: 'mock-image-analysis' }));

    // Mock file operations
    fs.readFile.mockResolvedValue('test file content');
    fs.unlink.mockResolvedValue();
  });

  describe('Health Data Analysis Routes', () => {
    test('POST /api/analyze - analyze health data', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(response.status).toBe(200);
      expect(analyzeHealthData).toHaveBeenCalled();
    });
  });

  describe('Image Analysis Routes', () => {
    test('POST /api/image-analysis - analyze image', async () => {
      const response = await request(app)
        .post('/api/image-analysis')
        .attach('image', Buffer.from('test image'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(analyzeImage).toHaveBeenCalled();
    });
  });

  describe('File Upload Routes', () => {
    test('POST /api/upload - upload health data file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '文件上传成功');
    });

    test('POST /api/upload - return error on upload failure', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('skip-file', 'true');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '请上传健康数据文件');
    });

    test('POST /api/upload - return 500 on file read failure', async () => {
      fs.readFile.mockRejectedValue(new Error('读取失败'));

      const response = await request(app)
        .post('/api/upload')
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(response.status).toBe(500);
    });

    test('POST /api/upload - log error on file cleanup failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      fs.unlink.mockRejectedValue(new Error('清理失败'));

      const response = await request(app)
        .post('/api/upload')
        .attach('healthData', Buffer.from('test data'), 'test.txt');

      expect(consoleSpy).toHaveBeenCalledWith('清理文件失败:', expect.any(Error));
      expect(response.status).toBe(200);
      consoleSpy.mockRestore();
    });
  });
});
