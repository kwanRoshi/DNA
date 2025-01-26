import fs from 'fs/promises';
import User from '../../models/User.js';
import { analyzeHealthData, getAnalysisHistory } from '../../controllers/aiController.js';

// 模拟依赖
jest.mock('fs/promises');
jest.mock('../../models/User.js');

describe('AI Controller', () => {
  let mockReq;
  let mockRes;
  const consoleSpy = jest.spyOn(console, 'error');

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

    // 模拟文件操作
    fs.readFile.mockResolvedValue('test file content');
    fs.unlink.mockResolvedValue();

    // 模拟数据库操作
    User.findOneAndUpdate.mockResolvedValue({
      walletAddress: '0x123456789',
      analysisHistory: []
    });

    User.findOne.mockResolvedValue({
      walletAddress: '0x123456789',
      analysisHistory: []
    });
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('analyzeHealthData', () => {
    test('成功分析健康数据并保存结果', async () => {
      await analyzeHealthData(mockReq, mockRes);

      expect(fs.readFile).toHaveBeenCalledWith('test/path', 'utf-8');
      expect(User.findOneAndUpdate).toHaveBeenCalled();
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

    test('数据库更新失败返回错误', async () => {
      User.findOneAndUpdate.mockRejectedValue(new Error('数据库错误'));
      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '数据库错误'
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

    test('未登录用户也能获取分析结果', async () => {
      mockReq.user = null;
      await analyzeHealthData(mockReq, mockRes);

      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          analysis: expect.any(Object)
        })
      );
    });
  });

  describe('getAnalysisHistory', () => {
    test('成功获取分析历史', async () => {
      const mockHistory = [
        {
          timestamp: new Date(),
          analysis: {
            summary: '测试分析',
            recommendations: ['建议1', '建议2'],
            riskFactors: ['风险1'],
            metrics: { healthScore: 90 }
          }
        }
      ];

      User.findOne.mockResolvedValue({
        walletAddress: '0x123456789',
        analysisHistory: mockHistory
      });

      await getAnalysisHistory(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        walletAddress: '0x123456789'
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        history: mockHistory
      });
    });

    test('用户不存在时返回404', async () => {
      User.findOne.mockResolvedValue(null);
      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '用户未找到'
      });
    });

    test('数据库查询失败时返回500', async () => {
      User.findOne.mockRejectedValue(new Error('数据库错误'));
      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '数据库错误'
      });
    });

    test('用户没有分析历史时返回空数组', async () => {
      User.findOne.mockResolvedValue({
        walletAddress: '0x123456789',
        analysisHistory: null
      });

      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        history: []
      });
    });
  });
});