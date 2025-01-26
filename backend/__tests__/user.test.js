import { loginUser, getUserData } from '../controllers/userController.js';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';

jest.mock('../models/User.js');
jest.mock('../middleware/authMiddleware.js');

describe('User Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('loginUser', () => {
    it('should return 400 if no wallet address provided', async () => {
      await loginUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '请提供钱包地址' });
    });

    it('should create new user if wallet address not found', async () => {
      const mockWalletAddress = '0x123';
      const mockToken = 'test_token';
      mockReq.body.walletAddress = mockWalletAddress;
      
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ walletAddress: mockWalletAddress });
      generateToken.mockReturnValue(mockToken);

      await loginUser(mockReq, mockRes);
      expect(User.create).toHaveBeenCalledWith({ walletAddress: mockWalletAddress });
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: mockWalletAddress,
        token: mockToken,
      });
    });

    it('should login existing user', async () => {
      const mockWalletAddress = '0x123';
      const mockToken = 'test_token';
      mockReq.body.walletAddress = mockWalletAddress;
      
      User.findOne.mockResolvedValue({ walletAddress: mockWalletAddress });
      generateToken.mockReturnValue(mockToken);

      await loginUser(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: mockWalletAddress,
        token: mockToken,
      });
    });

    it('should handle errors', async () => {
      mockReq.body.walletAddress = '0x123';
      User.findOne.mockRejectedValue(new Error('Database error'));

      await loginUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getUserData', () => {
    it('should return 404 if user not found', async () => {
      mockReq.user = { walletAddress: '0x123' };
      User.findOne.mockResolvedValue(null);

      await getUserData(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '用户未找到' });
    });

    it('should return user data if found', async () => {
      const mockUser = {
        walletAddress: '0x123',
        healthData: [{ data: 'test' }],
      };
      mockReq.user = { walletAddress: mockUser.walletAddress };
      User.findOne.mockResolvedValue(mockUser);

      await getUserData(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: mockUser.walletAddress,
        healthData: mockUser.healthData,
      });
    });

    it('should handle errors', async () => {
      mockReq.user = { walletAddress: '0x123' };
      User.findOne.mockRejectedValue(new Error('Database error'));

      await getUserData(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
});
