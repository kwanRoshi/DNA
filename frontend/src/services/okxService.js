import axios from 'axios';
// OKX Wallet Service for frontend authentication
// Uses window.okxwallet browser extension API

class OKXService {
  constructor() {
    this.baseURL = 'https://www.okx.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  generateSignature(timestamp, method, requestPath, body = '') {
    const message = `${timestamp}${method}${requestPath}${body}`;
    const signature = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(message, process.env.VITE_OKX_SECRET_KEY)
    );
    return signature;
  }

  async requestWalletConnection() {
    try {
      // 使用 window.okxwallet API
      if (!window.okxwallet) {
        throw new Error('请先安装OKX钱包');
      }

      const accounts = await window.okxwallet.request({
        method: 'eth_requestAccounts'
      });

      return {
        address: accounts[0]
      };
    } catch (error) {
      throw new Error('OKX钱包连接失败: ' + error.message);
    }
  }

  async signMessage(message, address) {
    try {
      if (!window.okxwallet) {
        throw new Error('请先安装OKX钱包');
      }

      const signature = await window.okxwallet.request({
        method: 'personal_sign',
        params: [message, address]
      });

      return {
        signature,
        address
      };
    } catch (error) {
      throw new Error('消息签名失败: ' + error.message);
    }
  }
}

export default new OKXService();
