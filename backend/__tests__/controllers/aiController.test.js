import fs from 'fs/promises';
import { analyzeHealthData } from '../../controllers/aiController.js';
import DeepseekService from '../../services/deepseekService.js';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../services/deepseekService.js', () => {
  return jest.fn().mockImplementation(() => ({
    analyzeText: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            summary: "Mock analysis of health data",
            recommendations: ["Maintain healthy diet", "Exercise regularly"],
            risks: ["No significant health risks detected"],
            generalHealthScore: 85,
            metrics: {
              stressLevel: "low",
              sleepQuality: "good"
            }
          })
        }
      }]
    })
  }));
});

describe('AI Controller', () => {
  let mockReq;
  let mockRes;
  const consoleSpy = jest.spyOn(console, 'error');
  const mockDeepseekInstance = {
    analyzeText: jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            summary: "Mock analysis of health data",
            recommendations: ["Maintain healthy diet", "Exercise regularly"],
            risks: ["No significant health risks detected"],
            generalHealthScore: 85,
            metrics: {
              stressLevel: "low",
              sleepQuality: "good"
            }
          })
        }
      }]
    })
  };

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();

    // 模拟请求对象
    mockReq = {
      file: {
        path: 'test/path',
        mimetype: 'text/plain'
      },
      user: {
        walletAddress: '0x123456789'
      }
    };

    // 模拟响应对象
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Initialize services and mocks
    fs.readFile.mockResolvedValue('test file content');
    fs.unlink.mockResolvedValue();
    DeepseekService.mockImplementation(() => mockDeepseekInstance);
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('analyzeHealthData', () => {
    test('成功分析健康数据并保存结果', async () => {
      await analyzeHealthData(mockReq, mockRes);

      expect(fs.readFile).toHaveBeenCalledWith('test/path', 'utf-8');
      expect(mockDeepseekInstance.analyzeText).toHaveBeenCalled();
      expect(fs.unlink).toHaveBeenCalledWith('test/path');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: expect.objectContaining({
            summary: expect.any(String),
            recommendations: expect.any(Array),
            riskFactors: expect.any(Array),
            metrics: expect.any(Object)
          })
        })
      );
    });

    test('未提供文件时返回错误', async () => {
      mockReq.file = null;
      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '未提供文件'
      });
    });

    test('不支持的文件类型返回错误', async () => {
      mockReq.file.mimetype = 'image/jpeg';
      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '不支持的文件类型'
      });
    });

    test('文件读取失败返回错误', async () => {
      fs.readFile.mockRejectedValue(new Error('读取失败'));
      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '读取文件失败: 读取失败'
      });
    });



    test('文件清理失败时记录错误但不影响响应', async () => {
      fs.unlink.mockRejectedValue(new Error('清理失败'));

      await analyzeHealthData(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith('清理文件失败:', expect.any(Error));
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: expect.any(Object)
        })
      );
    });

    test('文件路径不存在时跳过清理', async () => {
      mockReq.file = { mimetype: 'text/plain' }; // 没有 path 属性
      await analyzeHealthData(mockReq, mockRes);

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: expect.any(Object)
        })
      );
    });


  });


});
