import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
import { DEEPSEEK_API_KEY } from '../config/config.js';

// Load environment variables
dotenv.config();

class DeepseekService {
  constructor() {
    // DeepSeek API v3配置
    // API文档: https://api-docs.deepseek.com/zh-cn/
    this.apiKey = DEEPSEEK_API_KEY;
    if (!this.apiKey) {
      console.warn('[DeepSeek] API key not found in environment variables');
      throw new Error('DeepSeek API key is required');
    }
    this.apiUrl = 'https://api.deepseek.com/v3';
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
      timeout: 30000 // 30秒超时
    });

    // 添加请求拦截器用于日志记录
    this.client.interceptors.request.use(config => {
      console.log(`[DeepSeek API Request] ${config.method.toUpperCase()} ${config.url}`);
      return config;
    });

    // 添加响应拦截器用于错误处理
    this.client.interceptors.response.use(
      response => {
        console.log(`[DeepSeek API Response] Status: ${response.status}`);
        return response;
      },
      error => {
        console.error('[DeepSeek API Error]', error.response?.data || error.message);
        throw error;
      }
    );
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
    text_health: `作为专业的健康顾问，请对以下健康相关文本进行全面分析，重点关注：

1. 健康状况综述
   - 整体健康评估
   - 关键健康指标分析
   - 生活方式评估

2. 风险分析
   - 当前存在的健康风险
   - 潜在的健康隐患
   - 风险等级评估（低/中/高）

3. 改善建议
   - 生活方式调整建议
   - 饮食营养建议
   - 运动建议
   - 作息时间建议

4. 后续跟进
   - 需要定期监测的指标
   - 建议进行的健康检查
   - 预防保健措施

请以专业但通俗易懂的语言提供分析结果，确保建议具体且可执行。`,

    text_medical: `作为专业的医疗顾问，请对以下医疗检验报告进行专业解读，重点关注：

1. 检验指标解读
   - 异常指标识别和分析
   - 指标间关联性分析
   - 参考值范围对比

2. 健康风险评估
   - 当前健康问题诊断
   - 潜在疾病风险评估
   - 并发症风险分析

3. 诊疗建议
   - 建议就医科室
   - 建议进行的进一步检查
   - 用药建议（如适用）
   - 生活方式调整建议

4. 预防保健措施
   - 短期改善建议
   - 长期健康管理计划
   - 定期复查建议

请使用专业但易于理解的语言，提供详细的分析和明确的建议。对于异常指标，请特别说明其可能的原因和影响。`
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
      const response = await this.client.post('/vision/completions', formData, {
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
            content: '你是一个专业的健康顾问，负责分析健康数据并提供专业的建议。请以JSON格式返回分析结果。'
          },
          {
            role: 'user',
            content: `${DeepseekService.ANALYSIS_PROMPTS[analysisType]}\n\n${text}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3, // 降低随机性以获得更稳定的结果
        top_p: 0.8,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        response_format: { type: 'json_object' }
      });

      // 处理响应
      const responseData = response.data;
      if (!responseData.choices?.[0]?.message?.content) {
        return {
          summary: '无法解析响应',
          recommendations: [],
          risks: [],
          metrics: {
            healthScore: 75,
            stressLevel: 'medium',
            sleepQuality: 'medium'
          }
        };
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
      const content = JSON.parse(rawResponse.choices[0].message.content);
      return {
        summary: content.summary,
        recommendations: content.recommendations.map(rec => typeof rec === 'string' ? rec : rec.text),
        riskFactors: content.risks.map(risk => typeof risk === 'string' ? risk : risk.description),
        metrics: {
          healthScore: content.generalHealthScore || 85,
          stressLevel: content.metrics?.stressLevel || 'medium',
          sleepQuality: content.metrics?.sleepQuality || 'medium'
        }
      };
    } catch (error) {
      console.error('[DeepSeek] 处理响应失败:', error);
      // 返回用户友好的错误信息
      throw new Error(`处理健康数据失败: ${error.message}`);
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
