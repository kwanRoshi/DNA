import crypto from 'crypto';

class OKXService {
  constructor() {
    this.apiKey = process.env.OKX_API_KEY;
    this.secretKey = process.env.OKX_SECRET_KEY;
    
    if (!this.apiKey || !this.secretKey) {
      console.warn('OKX API credentials not found in environment variables');
      throw new Error('Missing required OKX API credentials');
    }
  }

  generateSignature(timestamp, method, requestPath, body = '') {
    const message = `${timestamp}${method}${requestPath}${body}`;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('base64');
  }

  verifySignature(timestamp, method, requestPath, signature, body = '') {
    const expectedSignature = this.generateSignature(timestamp, method, requestPath, body);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // 验证OKX钱包签名
  async verifyWalletSignature(address, signature, message) {
    try {
      const timestamp = new Date().toISOString();
      const requestPath = '/api/v5/users/verify-signature';
      const body = JSON.stringify({ address, signature, message });
      
      // 生成API请求签名
      const apiSignature = this.generateSignature(timestamp, 'POST', requestPath, body);
      
      // 验证签名时间戳（5分钟有效期）
      const messageTimestamp = parseInt(message.match(/时间戳: (\d+)/)[1]);
      const now = Date.now();
      if (Math.abs(now - messageTimestamp) > 5 * 60 * 1000) {
        return false;
      }

      return true; // 在实际环境中，这里应该调用OKX API进行验证
    } catch (error) {
      console.error('验证OKX钱包签名失败:', error);
      return false;
    }
  }
}

export default new OKXService();
