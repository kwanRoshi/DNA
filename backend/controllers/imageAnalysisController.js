import deepseekService from '../services/deepseekService.js';
import User from '../models/User.js';
import fs from 'fs/promises';

export const analyzeImage = async (req, res) => {
  const file = req.file;
  const userId = req.user?.walletAddress;
  const analysisType = req.body.analysisType || 'general';

  try {
    if (!file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.mimetype)) {
      await fs.unlink(file.path);
      return res.status(400).json({ error: '不支持的文件类型。请上传 JPG、PNG 或 GIF 图片。' });
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      await fs.unlink(file.path);
      return res.status(400).json({ error: '文件大小不能超过 5MB' });
    }

    // 分析图片
    const analysisResult = await deepseekService.analyzeImage(file.path, analysisType);

    // 保存分析结果到用户记录
    if (userId) {
      await User.findOneAndUpdate(
        { walletAddress: userId },
        {
          $push: {
            imageAnalysis: {
              timestamp: new Date(),
              imageInfo: {
                fileName: file.originalname,
                fileType: file.mimetype,
                fileSize: file.size
              },
              analysisType,
              result: analysisResult
            }
          }
        },
        { new: true }
      );
    }

    // 返回分析结果
    res.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('图片分析错误:', error);
    res.status(500).json({ error: error.message || '图片分析失败' });
  } finally {
    // 清理上传的文件
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
      } catch (err) {
        console.error('清理文件失败:', err);
      }
    }
  }
};

export const getAnalysisHistory = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress });
    if (!user) {
      return res.status(404).json({ error: '用户未找到' });
    }

    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 获取分析历史记录
    const history = user.imageAnalysis || [];
    const totalItems = history.length;
    const paginatedHistory = history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + limit);

    res.json({
      history: paginatedHistory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('获取分析历史记录失败:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteAnalysis = async (req, res) => {
  const { analysisId } = req.params;
  const userId = req.user.walletAddress;

  try {
    const user = await User.findOne({ walletAddress: userId });
    if (!user) {
      return res.status(404).json({ error: '用户未找到' });
    }

    // 从分析历史中删除指定记录
    const result = await User.findOneAndUpdate(
      { walletAddress: userId },
      { $pull: { imageAnalysis: { _id: analysisId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: '分析记录未找到' });
    }

    res.json({ message: '分析记录已删除' });
  } catch (error) {
    console.error('删除分析记录失败:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateAnalysisNote = async (req, res) => {
  const { analysisId } = req.params;
  const { note } = req.body;
  const userId = req.user.walletAddress;

  try {
    const user = await User.findOne({ walletAddress: userId });
    if (!user) {
      return res.status(404).json({ error: '用户未找到' });
    }

    // 更新分析记录的备注
    const result = await User.findOneAndUpdate(
      { 
        walletAddress: userId,
        'imageAnalysis._id': analysisId 
      },
      { 
        $set: { 
          'imageAnalysis.$.note': note 
        } 
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: '分析记录未找到' });
    }

    res.json({ message: '备注已更新' });
  } catch (error) {
    console.error('更新分析记录备注失败:', error);
    res.status(500).json({ error: error.message });
  }
};
