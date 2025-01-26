import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

class DeepseekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = 'https://api.deepseek.com/v1';
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });
  }

  // 图片分析提示词模板
  static ANALYSIS_PROMPTS = {
    general: `请分析这张图片中的健康相关信息，包括但不限于：
1. 主要健康指标
2. 可能存在的健康风险
3. 建议采取的措施
请用专业但易懂的语言描述，并给出具体的改善建议。`,

    medical_report: `请分析这份医疗报告图片，重点关注：
1. 关键检测指标及其含义
2. 异常值分析
3. 健康风险评估
4. 建议的后续措施
请用专业的医学术语解释，同时提供通俗的解释。`,

    lifestyle: `请分析这张生活方式相关的图片，关注：
1. 当前的生活习惯对健康的影响
2. 潜在的健康风险
3. 改善建议
4. 可以采取的具体行动
请提供实用的、可执行的建议。`
  };

  /**
   * 分析图片
   * @param {string} imagePath - 图片文件路径
   * @param {string} analysisType - 分析类型（general/medical_report/lifestyle）
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeImage(imagePath, analysisType = 'general') {
    try {
      // 读取图片文件
      const imageBuffer = fs.readFileSync(imagePath);
      const formData = new FormData();
      
      // 添加图片文件
      formData.append('image', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });

      // 添加提示词
      formData.append('prompt', DeepseekService.ANALYSIS_PROMPTS[analysisType]);

      // 调用 DeepSeek API
      const response = await this.client.post('/vision/analyze', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      // 处理响应
      return this.processAnalysisResponse(response.data);
    } catch (error) {
      console.error('图片分析失败:', error);
      throw new Error(error.response?.data?.error || '图片分析失败');
    }
  }

  /**
   * 处理分析响应
   * @param {Object} rawResponse - API 原始响应
   * @returns {Object} 处理后的分析结果
   */
  processAnalysisResponse(rawResponse) {
    // 提取关键信息
    const {
      analysis,
      confidence,
      recommendations,
      risks
    } = rawResponse;

    // 结构化返回结果
    return {
      summary: analysis.summary,
      confidence: confidence,
      metrics: {
        healthScore: this.calculateHealthScore(analysis),
        riskLevel: this.assessRiskLevel(risks),
        reliabilityScore: confidence
      },
      recommendations: recommendations.map(rec => ({
        category: rec.category,
        suggestion: rec.text,
        priority: rec.priority
      })),
      risks: risks.map(risk => ({
        type: risk.type,
        severity: risk.severity,
        description: risk.description
      })),
      rawAnalysis: analysis
    };
  }

  /**
   * 计算健康评分
   * @param {Object} analysis - 分析结果
   * @returns {number} 健康评分（0-100）
   */
  calculateHealthScore(analysis) {
    // 基于多个因素计算综合健康评分
    const factors = {
      generalHealth: analysis.generalHealthScore || 70,
      riskFactors: analysis.riskFactorsScore || 80,
      lifestyle: analysis.lifestyleScore || 75
    };

    const weights = {
      generalHealth: 0.4,
      riskFactors: 0.35,
      lifestyle: 0.25
    };

    return Object.keys(factors).reduce((score, factor) => {
      return score + (factors[factor] * weights[factor]);
    }, 0);
  }

  /**
   * 评估风险等级
   * @param {Array} risks - 风险列表
   * @returns {string} 风险等级（low/medium/high）
   */
  assessRiskLevel(risks) {
    const severityScores = {
      low: 1,
      medium: 2,
      high: 3
    };

    const averageSeverity = risks.reduce((sum, risk) => {
      return sum + severityScores[risk.severity.toLowerCase()];
    }, 0) / risks.length;

    if (averageSeverity <= 1.5) return 'low';
    if (averageSeverity <= 2.5) return 'medium';
    return 'high';
  }
}

export default new DeepseekService();
