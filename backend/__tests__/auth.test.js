import jwt from 'jsonwebtoken';
import { protect, generateToken } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

jest.mock('../models/User.js');

// 设置测试环境变量
process.env.JWT_SECRET = 'test_secret_key';

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('protect middleware', () => {
    it('should return 401 if no token is provided', async () => {
      await protect(mockReq, mockRes, nextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '未授权，没有token' });
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalid_token';
      await protect(mockReq, mockRes, nextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '未授权，token无效' });
    });

    it('should return 401 if user not found', async () => {
      const token = jwt.sign({ walletAddress: '0x123' }, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      User.findOne.mockResolvedValue(null);

      await protect(mockReq, mockRes, nextFunction);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '未授权，token无效' });
    });

    it('should call next() if token is valid and user exists', async () => {
      const mockUser = { walletAddress: '0x123' };
      const token = jwt.sign({ walletAddress: mockUser.walletAddress }, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      User.findOne.mockResolvedValue(mockUser);

      await protect(mockReq, mockRes, nextFunction);
      expect(mockReq.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const walletAddress = '0x123';
      const token = generateToken(walletAddress);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.walletAddress).toBe(walletAddress);
      expect(decoded).toHaveProperty('exp');
    });
  });
});
