import User from '../../models/User.js';
import { loginUser, getUserData } from '../../controllers/userController.js';
import { generateToken } from '../../middleware/authMiddleware.js';
import okxService from '../../services/okxService.js';
import { ethers } from 'ethers';

// 模拟依赖
jest.mock('../../models/User.js');
jest.mock('../../middleware/authMiddleware.js');
jest.mock('../../services/okxService.js', () => ({
  __esModule: true,
  default: {
    verifyWalletSignature: jest.fn()
  }
}));

describe('User Controller', () => {
  let mockReq;
  let mockRes;
  const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();

    // 默认成功验证OKX签名
    okxService.verifyWalletSignature.mockResolvedValue(true);

    const timestamp = Date.now();
    const message = `登录DNA数据分析平台\n\n时间戳: ${timestamp}`;

    // 模拟用户数据
    const mockUser = {
      walletAddress: validAddress,
      healthData: [
        {
          fileName: 'test.txt',
          fileType: 'text/plain',
          fileSize: 1024,
          content: 'test data'
        }
      ]
    };

    mockReq = {
      body: {
        walletAddress: validAddress,
        signature: '0x1234567890abcdef', // 使用有效的签名格式
        message,
        walletType: 'okx'  // 默认使用OKX钱包
      },
      user: {
        walletAddress: validAddress
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // 模拟 generateToken
    generateToken.mockReturnValue(mockToken);

    // 重置所有mock的实现
    User.findOne.mockReset().mockResolvedValue(mockUser);
    User.create.mockReset().mockResolvedValue(mockUser);
    generateToken.mockReset().mockReturnValue(mockToken);

    // 确保每个测试前重置所有mock
    okxService.verifyWalletSignature.mockReset().mockResolvedValue(true);
  });

  describe('loginUser', () => {
    describe('MetaMask登录', () => {
      beforeEach(() => {
        mockReq.body.walletType = 'metamask';
      });

      test('成功登录已存在的用户', async () => {
        // Mock successful signature verification
        const mockVerifySignature = jest.spyOn(ethers.utils, 'verifyMessage')
          .mockReturnValue(validAddress);

        await loginUser(mockReq, mockRes);

        expect(User.findOne).toHaveBeenCalledWith({ walletAddress: validAddress });
        expect(User.create).not.toHaveBeenCalled();
        expect(generateToken).toHaveBeenCalledWith(validAddress);
        expect(mockRes.json).toHaveBeenCalledWith({
          walletAddress: validAddress,
          token: mockToken
        });

        mockVerifySignature.mockRestore();
      });
    });

    describe('OKX钱包登录', () => {
      beforeEach(() => {
        mockReq.body.walletType = 'okx';
      });

      test('成功验证OKX签名并登录', async () => {
        await loginUser(mockReq, mockRes);

        expect(okxService.verifyWalletSignature).toHaveBeenCalledWith(
          validAddress,
          mockReq.body.signature,
          mockReq.body.message
        );
        expect(User.findOne).toHaveBeenCalledWith({ walletAddress: validAddress });
        expect(mockRes.json).toHaveBeenCalledWith({
          walletAddress: validAddress,
          token: mockToken
        });
      });

      test('OKX签名验证失败时返回400错误', async () => {
        okxService.verifyWalletSignature.mockResolvedValueOnce(false);
        await loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'OKX钱包签名验证失败'
        });
      });

      test('OKX验证服务错误时返回500错误', async () => {
        okxService.verifyWalletSignature.mockRejectedValueOnce(new Error('验证服务错误'));
        await loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: '签名验证过程出错，请重试'
        });
      });

      test('不支持的钱包类型返回400错误', async () => {
        mockReq.body.walletType = 'unsupported';
        await loginUser(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: '不支持的钱包类型'
        });
      });
    });

    test('成功注册新用户', async () => {
      // 使用有效的钱包地址
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      mockReq.body.walletAddress = validAddress;
      User.findOne.mockResolvedValueOnce(null);

      await loginUser(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ walletAddress: validAddress });
      expect(User.create).toHaveBeenCalledWith({ walletAddress: validAddress });
      expect(generateToken).toHaveBeenCalledWith(validAddress);
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: validAddress,
        token: mockToken
      });
    });

    test('未提供登录信息时返回400错误', async () => {
      mockReq.body = {};
      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '缺少必要的登录信息'
      });
    });

    test('提供无效的钱包地址时返回400错误', async () => {
      mockReq.body.walletAddress = 'invalid-address';
      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '无效的钱包地址'
      });
    });

    test('提供过期的时间戳时返回400错误', async () => {
      const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6分钟前
      mockReq.body.message = `登录DNA数据分析平台\n\n时间戳: ${oldTimestamp}`;
      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '登录请求已过期'
      });
    });

    test('数据库操作失败时返回500错误', async () => {
      // 确保使用有效的钱包地址和签名
      mockReq.body.walletAddress = validAddress;
      mockReq.body.signature = '0x1234567890abcdef';
      User.findOne.mockRejectedValue(new Error('数据库错误'));
      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '登录失败，请重试'
      });
    });

    test('用户创建失败时返回500错误', async () => {
      // 确保使用有效的钱包地址和签名
      mockReq.body.walletAddress = validAddress;
      mockReq.body.signature = '0x1234567890abcdef';
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('创建用户失败'));

      await loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: '登录失败，请重试'
      });
    });
  });

  describe('getUserData', () => {
    test('成功获取用户数据', async () => {
      await getUserData(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ walletAddress: validAddress });
      expect(mockRes.json).toHaveBeenCalledWith({
        walletAddress: validAddress,
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
        walletAddress: validAddress,
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
