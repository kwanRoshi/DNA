import fs from 'fs/promises';
import deepseekService from '../../services/deepseekService.js';
import User from '../../models/User.js';
import {
  analyzeImage,
  getAnalysisHistory,
  deleteAnalysis,
  updateAnalysisNote
} from '../../controllers/imageAnalysisController.js';

// 模拟依赖
jest.mock('fs/promises');
jest.mock('../../services/deepseekService.js');
jest.mock('../../models/User.js');

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

    // 模拟数据库操作
    User.findOne.mockResolvedValue(mockUser);
    User.findOneAndUpdate.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    consoleSpy.mockClear();
  });

  describe('analyzeImage', () => {
    test('成功分析图片并保存结果', async () => {
      await analyzeImage(mockReq, mockRes);

      expect(deepseekService.analyzeImage).toHaveBeenCalledWith('test/path', 'general');
      expect(User.findOneAndUpdate).toHaveBeenCalled();
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

    test('未登录用户也能获取分析结果', async () => {
      mockReq.user = null;
      await analyzeImage(mockReq, mockRes);

      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        analysis: expect.any(Object)
      });
    });
  });

  describe('getAnalysisHistory', () => {
    test('成功获取分页的分析历史', async () => {
      mockReq.query = { page: '2', limit: '1' };
      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        history: expect.any(Array),
        pagination: {
          currentPage: 2,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 1
        }
      });
    });

    test('使用默认分页参数', async () => {
      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        history: expect.any(Array),
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10
        }
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

      expect(consoleSpy).toHaveBeenCalledWith('获取分析历史记录失败:', expect.any(Error));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '数据库错误'
      });
    });

    test('用户没有分析历史时返回空数组', async () => {
      User.findOne.mockResolvedValue({
        walletAddress: '0x123456789',
        imageAnalysis: null
      });

      await getAnalysisHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        history: [],
        pagination: expect.any(Object)
      });
    });
  });

  describe('deleteAnalysis', () => {
    test('成功删除分析记录', async () => {
      mockReq.params.analysisId = 'analysis1';
      await deleteAnalysis(mockReq, mockRes);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { walletAddress: '0x123456789' },
        { $pull: { imageAnalysis: { _id: 'analysis1' } } },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '分析记录已删除'
      });
    });

    test('用户不存在时返回404', async () => {
      User.findOne.mockResolvedValue(null);
      await deleteAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '用户未找到'
      });
    });

    test('分析记录不存在时返回404', async () => {
      User.findOneAndUpdate.mockResolvedValue(null);
      await deleteAnalysis(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '分析记录未找到'
      });
    });

    test('删除失败时返回500', async () => {
      User.findOneAndUpdate.mockRejectedValue(new Error('删除失败'));
      await deleteAnalysis(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith('删除分析记录失败:', expect.any(Error));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '删除失败'
      });
    });
  });

  describe('updateAnalysisNote', () => {
    test('成功更新分析记录备注', async () => {
      mockReq.params.analysisId = 'analysis1';
      mockReq.body.note = '新的备注';
      await updateAnalysisNote(mockReq, mockRes);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { 
          walletAddress: '0x123456789',
          'imageAnalysis._id': 'analysis1'
        },
        { 
          $set: { 
            'imageAnalysis.$.note': '新的备注'
          }
        },
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '备注已更新'
      });
    });

    test('用户不存在时返回404', async () => {
      User.findOne.mockResolvedValue(null);
      await updateAnalysisNote(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '用户未找到'
      });
    });

    test('分析记录不存在时返回404', async () => {
      User.findOneAndUpdate.mockResolvedValue(null);
      await updateAnalysisNote(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '分析记录未找到'
      });
    });

    test('更新失败时返回500', async () => {
      User.findOneAndUpdate.mockRejectedValue(new Error('更新失败'));
      await updateAnalysisNote(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith('更新分析记录备注失败:', expect.any(Error));
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '更新失败'
      });
    });
  });
});