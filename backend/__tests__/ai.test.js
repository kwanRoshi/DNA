import fs from 'fs/promises';
import { analyzeHealthData, getAnalysisHistory } from '../controllers/aiController.js';
import User from '../models/User.js';
import deepseekService from '../services/deepseekService.js';

// Mock fs/promises
jest.mock('fs/promises');

// Mock User model
jest.mock('../models/User.js', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

// Mock deepseekService
jest.mock('../services/deepseekService.js', () => ({
  default: {
    analyzeText: jest.fn()
  }
}));

describe('AI Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      file: {
        path: '/test/path',
        mimetype: 'text/csv',
        size: 1024
      },
      user: {
        walletAddress: '0x123'
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // 重置所有 mock
    jest.clearAllMocks();
  });

  describe('analyzeHealthData', () => {
    it('应该分析健康数据文件并返回结果', async () => {
      const fileContent = 'test data';
      const mockDeepseekResponse = {
        summary: '测试分析摘要',
        recommendations: [
          { suggestion: '建议增加运动量', category: '运动', priority: 'high' },
          { suggestion: '注意作息规律', category: '生活习惯', priority: 'medium' }
        ],
        risks: [
          { description: '压力指数偏高', type: '心理健康', severity: 'medium' },
          { description: '睡眠质量需要改善', type: '生活习惯', severity: 'low' }
        ],
        metrics: {
          healthScore: 85,
          riskLevel: 'medium',
          reliabilityScore: 0.8
        }
      };

      fs.readFile.mockResolvedValue(fileContent);
      deepseekService.analyzeText.mockResolvedValue(mockDeepseekResponse);
      User.findOneAndUpdate.mockResolvedValue({});

      await analyzeHealthData(mockReq, mockRes);

      expect(fs.readFile).toHaveBeenCalledWith('/test/path', 'utf-8');
      expect(deepseekService.analyzeText).toHaveBeenCalledWith(fileContent);
      expect(User.findOneAndUpdate).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        analysis: {
          summary: mockDeepseekResponse.summary,
          recommendations: mockDeepseekResponse.recommendations.map(rec => rec.suggestion),
          riskFactors: mockDeepseekResponse.risks.map(risk => risk.description),
          metrics: {
            healthScore: mockDeepseekResponse.metrics.healthScore,
            stressLevel: mockDeepseekResponse.metrics.riskLevel,
            sleepQuality: 'medium'
          }
        }
      });
    });

    it('应该处理不支持的文件类型', async () => {
      mockReq.file.mimetype = 'image/jpeg';

      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '不支持的文件类型'
      });
    });

    it('应该处理缺失的文件', async () => {
      mockReq.file = null;

      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '未提供文件'
      });
    });

    it('应该处理文件读取错误', async () => {
      fs.readFile.mockRejectedValue(new Error('File read error'));

      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('读取文件失败')
      });
    });

    it('应该处理DeepSeek API错误', async () => {
      const fileContent = 'test data';
      fs.readFile.mockResolvedValue(fileContent);
      deepseekService.analyzeText.mockRejectedValue(new Error('API error'));

      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.any(String)
      });
    });

    it('应该清理上传的文件', async () => {
      fs.readFile.mockResolvedValue('test data');
      User.findOneAndUpdate.mockResolvedValue({});

      await analyzeHealthData(mockReq, mockRes);

      expect(fs.unlink).toHaveBeenCalledWith('/test/path');
    });
  });

  describe('getAnalysisHistory', () => {
    it('应该返回用户的分析历史', async () => {
      const mockHistory = [
        {
          timestamp: new Date(),
          analysis: {
            summary: '测试摘要',
            recommendations: ['建议1'],
            riskFactors: ['风险1'],
            metrics: { score: 85 }
          }
        }
      ];

      User.findOne.mockResolvedValue({
        walletAddress: '0x123',
        analysisHistory: mockHistory
      });

      await getAnalysisHistory(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ walletAddress: '0x123' });
      expect(mockRes.json).toHaveBeenCalledWith({ history: mockHistory });
    });

    it('应该处理用户未找到的情况', async () => {
      User.findOne.mockResolvedValue(null);

      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '用户未找到'
      });
    });

    it('应该处理数据库错误', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.any(String)
      });
    });
  });
});
