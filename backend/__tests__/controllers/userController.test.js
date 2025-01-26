import User from '../../models/User.js';
import { loginUser, getUserData } from '../../controllers/userController.js';
import { generateToken } from '../../middleware/authMiddleware.js';

// 模拟依赖
jest.mock('../../models/User.js');
jest.mock('../../middleware/authMiddleware.js');

describe('User Controller', () => {
  let mockReq;
  let mockRes;
  const mockWalletAddress = '0x123456789';
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {
        walletAddress: mockWalletAddress
      },
      user: {
        walletAddress: mockWalletAddress
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // 模拟 generateToken
    generateToken.mockReturnValue(mockToken);

    // 模拟用户数据
    const mockUser = {
      walletAddress: mockWalletAddress,
      healthData: [
        {
          fileName: 'test.txt',
          fileType: 'text/plain',
          fileSize: 1024,
          content: 'test data'
        }
      ]
    };

    // 模拟数据库操作
    User.findOne.mockResolvedValue(mockUser);
    User.create.mockResolvedValue(mockUser);
  });

  describe('loginUser', () => {
    test('成功登录已存在的用户', async () => {
      await loginUser(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ walletAddress: mockWalletAddress });
      expect(User.create).not.toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalledWith(mockWalletAddress);
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: mockWalletAddress,
        token: mockToken
      });
    });

    test('成功注册新用户', async () => {
      User.findOne.mockResolvedValueOnce(null);

      await loginUser(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ walletAddress: mockWalletAddress });
      expect(User.create).toHaveBeenCalledWith({ walletAddress: mockWalletAddress });
      expect(generateToken).toHaveBeenCalledWith(mockWalletAddress);
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: mockWalletAddress,
        token: mockToken
      });
    });

    test('未提供钱包地址时返回400错误', async () => {
      mockReq.body = {};
      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '请提供钱包地址'
      });
    });

    test('数据库操作失败时返回500错误', async () => {
      User.findOne.mockRejectedValue(new Error('数据库错误'));
      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '数据库错误'
      });
    });

    test('用户创建失败时返回500错误', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('创建用户失败'));

      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '创建用户失败'
      });
    });
  });

  describe('getUserData', () => {
    test('成功获取用户数据', async () => {
      await getUserData(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ walletAddress: mockWalletAddress });
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: mockWalletAddress,
        healthData: expect.any(Array)
      });
    });

    test('用户不存在时返回404错误', async () => {
      User.findOne.mockResolvedValue(null);
      await getUserData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '用户未找到'
      });
    });

    test('数据库查询失败时返回500错误', async () => {
      User.findOne.mockRejectedValue(new Error('数据库错误'));
      await getUserData(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '数据库错误'
      });
    });

    test('返回的用户数据不包含敏感信息', async () => {
      const mockUserWithSensitiveData = {
        walletAddress: mockWalletAddress,
        healthData: [{ content: 'test' }],
        password: 'secret',
        __v: 0,
        _id: 'some-id'
      };

      User.findOne.mockResolvedValue(mockUserWithSensitiveData);
      await getUserData(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).not.toHaveProperty('password');
      expect(responseData).not.toHaveProperty('__v');
      expect(responseData).not.toHaveProperty('_id');
      expect(responseData).toHaveProperty('walletAddress');
      expect(responseData).toHaveProperty('healthData');
    });
  });
});