import fs from 'fs/promises';
import deepseekService from '../../services/deepseekService.js';
import { analyzeImage } from '../../controllers/imageAnalysisController.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../services/deepseekService.js');

describe('Image Analysis Controller', () => {
  let mockReq;
  let mockRes;
  const consoleSpy = jest.spyOn(console, 'error');
  const mockUser = {
    walletAddress: '0x123456789',
    imageAnalysis: [
      {
        _id: 'analysis1',
        timestamp: new Date('2025-01-01'),
        imageInfo: {
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024
        },
        analysisType: 'general',
        result: { description: '测试分析结果' }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      file: {
        path: 'test/path',
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      },
      user: {
        walletAddress: '0x123456789'
      },
      body: {},
      query: {},
      params: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // 模拟文件操作
    fs.unlink.mockResolvedValue();

    // 模拟 deepseek 服务
    deepseekService.analyzeImage.mockResolvedValue({
      description: '测试分析结果'
    });

    // 模拟 deepseek 服务
    deepseekService.analyzeImage.mockResolvedValue({
      description: '测试分析结果'
    });
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('analyzeImage', () => {
    test('成功分析图片并保存结果', async () => {
      await analyzeImage(mockReq, mockRes);

      expect(deepseekService.analyzeImage).toHaveBeenCalledWith('test/path', 'general');
      expect(deepseekService.analyzeImage).toHaveBeenCalled();
      expect(fs.unlink).toHaveBeenCalledWith('test/path');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        analysis: expect.any(Object)
      });
    });

    test('未提供文件时返回400错误', async () => {
      mockReq.file = null;
      await analyzeImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '请上传图片文件'
      });
    });

    test('不支持的文件类型返回400错误', async () => {
      mockReq.file.mimetype = 'text/plain';
      await analyzeImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '不支持的文件类型。请上传 JPG、PNG 或 GIF 图片。'
      });
      expect(fs.unlink).toHaveBeenCalledWith('test/path');
    });

    test('文件大小超过限制返回400错误', async () => {
      mockReq.file.size = 6 * 1024 * 1024; // 6MB
      await analyzeImage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '文件大小不能超过 5MB'
      });
      expect(fs.unlink).toHaveBeenCalledWith('test/path');
    });

    test('分析服务失败时返回500错误', async () => {
      deepseekService.analyzeImage.mockRejectedValue(new Error('分析失败'));
      await analyzeImage(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith('图片分析错误:', expect.any(Error));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '分析失败'
      });
    });

    test('文件清理失败时记录错误但不影响响应', async () => {
      fs.unlink.mockRejectedValue(new Error('清理失败'));

      await analyzeImage(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith('清理文件失败:', expect.any(Error));
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        analysis: expect.any(Object)
      });
    });


  });


});
