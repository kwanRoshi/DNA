import crypto from 'crypto';
import axios from 'axios';
import { ethers } from 'ethers';

class OKXService {
  constructor() {
    this.apiKey = process.env.OKX_API_KEY;
    this.secretKey = process.env.OKX_SECRET_KEY;
    this.passphrase = process.env.OKX_PASSPHRASE;
    
    if (!this.apiKey || !this.secretKey || !this.passphrase) {
      const missing = [];
      if (!this.apiKey) missing.push('OKX_API_KEY');
      if (!this.secretKey) missing.push('OKX_SECRET_KEY');
      if (!this.passphrase) missing.push('OKX_PASSPHRASE');
      console.error('Missing OKX credentials:', missing.join(', '));
      throw new Error(`Missing required OKX credentials: ${missing.join(', ')}`);
    }

    this.client = axios.create({
      baseURL: 'https://www.okx.com',
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => status >= 200 && status < 500
    });

    // Add logging interceptors
    this.client.interceptors.request.use(config => {
      console.log(`[OKX API Request] ${config.method.toUpperCase()} ${config.url}`);
      return config;
    });

    this.client.interceptors.response.use(
      response => {
        console.log(`[OKX API Response] Status: ${response.status}`);
        return response;
      },
      error => {
        console.error('[OKX API Error]', error.response?.data || error.message);
        throw error;
      }
    );
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
  async verifyWalletSignature(address, signature, message, retryCount = 3) {
    try {
      // 验证签名时间戳（5分钟有效期）
      const messageTimestamp = parseInt(message.match(/时间戳: (\d+)/)[1]);
      const now = Date.now();
      if (Math.abs(now - messageTimestamp) > 5 * 60 * 1000) {
        console.warn('[OKX Auth] 签名已过期:', { address, timestamp: messageTimestamp });
        return false;
      }

      // 验证签名格式
      if (!ethers.utils.isHexString(signature)) {
        console.warn('[OKX Auth] 无效的签名格式:', { address, signature });
        return false;
      }

      // 验证地址格式
      if (!ethers.utils.isAddress(address)) {
        console.warn('[OKX Auth] 无效的钱包地址格式:', { address });
        return false;
      }

      const timestamp = new Date().toISOString();
      const requestPath = '/api/v5/users/verify-signature';
      const messageHash = ethers.utils.hashMessage(message);
      
      const body = JSON.stringify({
        address,
        signature,
        message,
        messageHash
      });

      // 生成API请求签名
      const apiSignature = this.generateSignature(timestamp, 'POST', requestPath, body);

      let lastError = null;
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          console.log(`[OKX Auth] 尝试验证签名 (${attempt}/${retryCount})`, { address });
          
          // 调用OKX API验证签名
          const response = await this.client.post(requestPath, body, {
            headers: {
              'OK-ACCESS-KEY': this.apiKey,
              'OK-ACCESS-SIGN': apiSignature,
              'OK-ACCESS-TIMESTAMP': timestamp,
              'OK-ACCESS-PASSPHRASE': this.passphrase,
              'Content-Type': 'application/json'
            }
          });

          if (response.status === 200 && response.data.code === '0') {
            // 验证返回的地址与请求的地址匹配
            const recoveredAddress = response.data.data?.address;
            if (recoveredAddress && recoveredAddress.toLowerCase() === address.toLowerCase()) {
              console.log('[OKX Auth] 签名验证成功:', { address });
              return true;
            }
            console.warn('[OKX Auth] 恢复的地址与请求地址不匹配:', {
              requestAddress: address,
              recoveredAddress
            });
            return false;
          }

          lastError = new Error(`API返回错误: ${response.data.msg || '未知错误'}`);
          console.warn('[OKX Auth] API验证失败:', {
            attempt,
            status: response.status,
            code: response.data.code,
            message: response.data.msg
          });

          // 如果是最后一次尝试，直接返回失败
          if (attempt === retryCount) {
            return false;
          }

          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } catch (error) {
          lastError = error;
          console.error('[OKX Auth] API请求失败:', {
            attempt,
            error: error.message,
            address
          });

          if (attempt === retryCount) {
            throw error;
          }

          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      throw lastError;
    } catch (error) {
      console.error('验证OKX钱包签名失败:', error);
      return false;
    }
  }
}

export default new OKXService();
