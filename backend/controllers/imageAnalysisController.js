import deepseekService from '../services/deepseekService.js';
import fs from 'fs/promises';

export const analyzeImage = async (req, res) => {
  const file = req.file;
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
