import fs from 'fs/promises';
import User from '../models/User.js';
import deepseekService from '../services/deepseekService.js';

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

    // 检测文件内容类型并选择合适的分析提示词
    let analysisType = 'text_health';
    if (fileContent.includes('检验报告') || fileContent.includes('化验单') || 
        fileContent.includes('医疗记录') || fileContent.includes('诊断报告')) {
      analysisType = 'text_medical';
    }

    // 使用DeepSeek进行文本分析
    const deepseekResponse = await deepseekService.analyzeText(fileContent, analysisType);
    const parsedContent = JSON.parse(deepseekResponse.choices[0].message.content);
    
    // 转换为与现有格式兼容的结构
    const analysis = {
      summary: parsedContent.summary,
      recommendations: parsedContent.recommendations.map(rec => rec.text || rec),
      riskFactors: parsedContent.risks.map(risk => risk.description || risk),
      metrics: {
        healthScore: parsedContent.generalHealthScore || parsedContent.metrics?.healthScore || 75,
        stressLevel: parsedContent.metrics?.stressLevel || 'medium',
        sleepQuality: parsedContent.metrics?.sleepQuality || 'medium'
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
