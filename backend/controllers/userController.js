import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { ethers } from 'ethers';

// 验证签名
const verifySignature = (message, signature, walletAddress) => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    return false;
  }
};

// 验证时间戳（防止重放攻击）
const isValidTimestamp = (message) => {
  try {
    const timestampMatch = message.match(/时间戳: (\d+)/);
    if (!timestampMatch) return false;
    
    const timestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    // 允许5分钟的时间差
    return Math.abs(now - timestamp) <= 5 * 60 * 1000;
  } catch (error) {
    return false;
  }
};

export const loginUser = async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: '缺少必要的登录信息' });
    }

    // 验证钱包地址格式
    if (!ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({ error: '无效的钱包地址' });
    }

    // 验证时间戳
    if (!isValidTimestamp(message)) {
      return res.status(400).json({ error: '登录请求已过期' });
    }

    // 验证签名
    if (!verifySignature(message, signature, walletAddress)) {
      return res.status(400).json({ error: '签名验证失败' });
    }

    // 查找或创建用户
    let user = await User.findOne({ walletAddress });
    if (!user) {
      user = await User.create({ walletAddress });
    }

    res.json({
      walletAddress: user.walletAddress,
      token: generateToken(user.walletAddress)
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请重试' });
  }
};

export const getUserData = async (req, res) => {
  try {
    const user = await User.findOne({ walletAddress: req.user.walletAddress });
    if (!user) {
      return res.status(404).json({ error: '用户未找到' });
    }
    
    res.json({
      walletAddress: user.walletAddress,
      healthData: user.healthData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
