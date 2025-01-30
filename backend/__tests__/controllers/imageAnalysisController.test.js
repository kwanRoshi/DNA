import fs from 'fs/promises';
import DeepseekService from '../../services/deepseekService.js';
import { analyzeImage } from '../../controllers/imageAnalysisController.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../services/deepseekService.js', () => {
  return jest.fn().mockImplementation(() => ({
    analyzeImage: jest.fn().mockResolvedValue({
      analysis: {
        summary: "Mock image analysis result",
        generalHealthScore: 85,
        riskFactorsScore: 80,
        lifestyleScore: 75
      },
      confidence: 0.9,
      recommendations: [
        { category: "Health", text: "Regular exercise recommended", priority: "high" }
      ],
      risks: [
        { type: "Lifestyle", severity: "medium", description: "Moderate health risks detected" }
      ]
    })
  }));
});

describe('Image Analysis Controller', () => {
  let mockReq;
  let mockRes;
  const consoleSpy = jest.spyOn(console, 'error');
  const mockDeepseekInstance = {
    analyzeImage: jest.fn().mockResolvedValue({
      analysis: {
        summary: "Mock image analysis result",
        generalHealthScore: 85,
        riskFactorsScore: 80,
        lifestyleScore: 75
      },
      confidence: 0.9,
      recommendations: [
        { category: "Health", text: "Regular exercise recommended", priority: "high" }
      ],
      risks: [
        { type: "Lifestyle", severity: "medium", description: "Moderate health risks detected" }
      ]
    })
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

    // Initialize services and mocks
    fs.unlink.mockResolvedValue();
    DeepseekService.mockImplementation(() => mockDeepseekInstance);
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('analyzeImage', () => {
    test('成功分析图片并保存结果', async () => {
      await analyzeImage(mockReq, mockRes);

      expect(mockDeepseekInstance.analyzeImage).toHaveBeenCalledWith('test/path', 'general');
      expect(mockDeepseekInstance.analyzeImage).toHaveBeenCalled();
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
      mockDeepseekInstance.analyzeImage.mockRejectedValueOnce(new Error('分析失败'));
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
