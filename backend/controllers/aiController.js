import fs from 'fs/promises';
import deepseekService from '../services/deepseekService.js';

const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const analyzeHealthData = async (req, res) => {
  const file = req.file;

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
    const content = JSON.parse(deepseekResponse.choices[0].message.content);
    
    const analysis = {
      summary: content.summary,
      recommendations: content.recommendations.map(rec => typeof rec === 'string' ? rec : rec.text),
      riskFactors: content.risks.map(risk => typeof risk === 'string' ? risk : risk.description),
      metrics: {
        healthScore: content.generalHealthScore,
        stressLevel: content.metrics?.stressLevel || 'medium',
        sleepQuality: content.metrics?.sleepQuality || 'medium'
      }
    };

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message || '数据库错误' });
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
