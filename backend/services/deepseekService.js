import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

class DeepseekService {
  constructor() {
    // DeepSeek API v3配置
    // API文档: https://api-docs.deepseek.com/zh-cn/
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    if (!this.apiKey) {
      console.warn('DeepSeek API key not found in environment variables');
    }
    this.apiUrl = 'https://api.deepseek.com/v3/chat/completions';
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });
  }

  // 分析提示词模板
  static ANALYSIS_PROMPTS = {
    // 图片分析提示词
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
请提供实用的、可执行的建议。`,

    // 文本分析提示词
    text_health: `请分析以下健康相关文本，重点关注：
1. 主要健康状况和指标
2. 潜在的健康风险
3. 生活方式建议
4. 需要改善的方面
请提供专业的分析和具体可行的建议。`,

    text_medical: `请分析以下医疗相关文本，重点关注：
1. 关键健康指标解读
2. 异常值分析
3. 健康风险评估
4. 建议的后续措施
请用专业但易懂的语言描述，并给出明确的建议。`
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

  /**
   * 分析文本内容
   * @param {string} text - 要分析的文本内容
   * @param {string} analysisType - 分析类型（text_health/text_medical）
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeText(text, analysisType = 'text_health') {
    try {
      // 调用 DeepSeek API v3
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的健康顾问，负责分析健康数据并提供专业的建议。'
          },
          {
            role: 'user',
            content: `${DeepseekService.ANALYSIS_PROMPTS[analysisType]}\n\n${text}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      // 处理响应
      const responseData = response.data;
      if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        throw new Error('Invalid API response format');
      }
      return this.processTextResponse(responseData);
    } catch (error) {
      console.error('文本分析失败:', error);
      if (error.message === 'Invalid API response format') {
        throw error;
      }
      throw new Error(error.response?.data?.error || '文本分析失败');
    }
  }

  /**
   * 处理文本分析响应
   * @param {Object} rawResponse - API 原始响应
   * @returns {Object} 处理后的分析结果
   */
  processTextResponse(rawResponse) {
    try {
      if (!rawResponse?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }
      // 从原始响应中提取结构化信息
      const analysis = this.extractStructuredInfo(rawResponse.choices[0].message.content);

    // 结构化返回结果
    return {
      summary: analysis.summary,
      confidence: rawResponse.confidence || 0.8,
      metrics: {
        healthScore: this.calculateHealthScore(analysis),
        riskLevel: this.assessRiskLevel(analysis.risks),
        reliabilityScore: rawResponse.confidence || 0.8
      },
      recommendations: analysis.recommendations.map(rec => ({
        category: rec.category || '建议',
        suggestion: rec.text,
        priority: rec.priority || 'medium'
      })),
      risks: analysis.risks.map(risk => ({
        type: risk.type || '健康风险',
        severity: risk.severity || 'medium',
        description: risk.description
      })),
      rawAnalysis: rawResponse
    };
    } catch (error) {
      console.error('处理DeepSeek响应失败:', error);
      throw error;
    }
  }

  /**
   * 从文本响应中提取结构化信息
   * @param {string} text - DeepSeek响应文本
   * @returns {Object} 结构化信息
   */
  extractStructuredInfo(text) {
    // 初始化默认结构
    const defaultStructure = {
      summary: '',
      recommendations: [],
      risks: [],
      generalHealthScore: 75,
      riskFactorsScore: 75,
      lifestyleScore: 75
    };

    try {
      // 尝试将文本解析为JSON（如果DeepSeek返回JSON格式）
      const parsed = JSON.parse(text);
      return {
        ...defaultStructure,
        ...parsed
      };
    } catch (e) {
      // 如果不是JSON，进行文本分析提取结构化信息
      const sections = text.split('\n\n');
      const structure = { ...defaultStructure };

      // 提取摘要（第一段）
      structure.summary = sections[0] || '';

      // 提取建议和风险（根据关键词）
      sections.forEach(section => {
        if (section.toLowerCase().includes('建议') || section.toLowerCase().includes('推荐')) {
          structure.recommendations.push({
            text: section,
            category: '一般建议',
            priority: 'medium'
          });
        } else if (section.toLowerCase().includes('风险') || section.toLowerCase().includes('警告')) {
          structure.risks.push({
            description: section,
            type: '健康风险',
            severity: 'medium'
          });
        }
      });

      return structure;
    }
  }
}

export default new DeepseekService();
