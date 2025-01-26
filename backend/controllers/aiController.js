import fs from 'fs/promises';
import User from '../models/User.js';

const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const analyzeHealthData = async (req, res) => {
  const file = req.file;
  const userId = req.user?.walletAddress;

  if (!file) {
    return res.status(500).json({ error: '未提供文件' });
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
    return res.status(500).json({ error: '不支持的文件类型' });
  }

  try {
    let fileContent;
    try {
      fileContent = await fs.readFile(file.path, 'utf-8');
    } catch (error) {
      return res.status(500).json({ error: '读取文件失败: ' + error.message });
    }

    // 模拟AI分析结果
    const analysis = {
      summary: '根据健康数据分析，整体状况良好',
      recommendations: [
        '建议增加运动量',
        '注意作息规律',
        '保持均衡饮食'
      ],
      riskFactors: [
        '压力指数偏高',
        '睡眠质量需要改善'
      ],
      metrics: {
        healthScore: 85,
        stressLevel: 'medium',
        sleepQuality: 'fair'
      }
    };

    // 保存分析结果到用户记录
    if (userId) {
      await User.findOneAndUpdate(
        { walletAddress: userId },
        { 
          $push: { 
            analysisHistory: {
              timestamp: new Date(),
              analysis,
              originalContent: fileContent
            }
          }
        },
        { new: true }
      );
    }

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    res.json({ history: user.analysisHistory || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
