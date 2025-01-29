import fs from 'fs/promises';
import { analyzeHealthData } from '../controllers/aiController.js';
import deepseekService from '../services/deepseekService.js';

// Mock fs/promises
jest.mock('fs/promises');

// Mock deepseekService
const mockAnalyzeText = jest.fn();
jest.mock('../services/deepseekService.js', () => ({
  __esModule: true,
  default: {
    analyzeText: (...args) => mockAnalyzeText(...args)
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
        choices: [{
          message: {
            content: JSON.stringify({
              summary: '测试分析摘要',
              recommendations: [
                { text: '建议增加运动量', category: '运动', priority: 'high' },
                { text: '注意作息规律', category: '生活习惯', priority: 'medium' }
              ],
              risks: [
                { description: '压力指数偏高', type: '心理健康', severity: 'medium' },
                { description: '睡眠质量需要改善', type: '生活习惯', severity: 'low' }
              ],
              generalHealthScore: 85,
              riskFactorsScore: 75,
              lifestyleScore: 75
            })
          }
        }]
      };

      fs.readFile.mockResolvedValue(fileContent);
      mockAnalyzeText.mockResolvedValue(mockDeepseekResponse);

      await analyzeHealthData(mockReq, mockRes);

      expect(fs.readFile).toHaveBeenCalledWith('/test/path', 'utf-8');
      expect(mockAnalyzeText).toHaveBeenCalledWith(fileContent, 'text_health');
      expect(mockRes.json).toHaveBeenCalledWith({
        analysis: {
          summary: JSON.parse(mockDeepseekResponse.choices[0].message.content).summary,
          recommendations: JSON.parse(mockDeepseekResponse.choices[0].message.content).recommendations.map(rec => rec.text),
          riskFactors: JSON.parse(mockDeepseekResponse.choices[0].message.content).risks.map(risk => risk.description),
          metrics: {
            healthScore: JSON.parse(mockDeepseekResponse.choices[0].message.content).generalHealthScore,
            stressLevel: 'medium',
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
      mockAnalyzeText.mockRejectedValue(new Error('API error'));

      await analyzeHealthData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.any(String)
      });
    });

    it('应该清理上传的文件', async () => {
      fs.readFile.mockResolvedValue('test data');

      await analyzeHealthData(mockReq, mockRes);

      expect(fs.unlink).toHaveBeenCalledWith('/test/path');
    });
  });


});
