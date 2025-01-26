import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findOne({ walletAddress: decoded.walletAddress });
      if (!user) {
        throw new Error('用户未找到');
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: '未授权，token无效' });
    }
  }

  if (!token) {
    res.status(401).json({ error: '未授权，没有token' });
  }
};

export const generateToken = (walletAddress) => {
  return jwt.sign({ walletAddress }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};
