import okxService from '../services/okxService.js';
import { ethers } from 'ethers';

describe('OKX Service', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...process.env,
      OKX_API_KEY: 'test_api_key',
      OKX_SECRET_KEY: 'test_secret_key',
      OKX_PASSPHRASE: 'test_passphrase'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('verifyWalletSignature', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    const validSignature = '0x1234567890abcdef';
    const validMessage = `登录DNA数据分析平台\n\n时间戳: ${Date.now()}`;

    it('should return false for expired timestamp', async () => {
      const expiredMessage = `登录DNA数据分析平台\n\n时间戳: ${Date.now() - 6 * 60 * 1000}`;
      const result = await okxService.verifyWalletSignature(validAddress, validSignature, expiredMessage);
      expect(result).toBe(false);
    });

    it('should return false for invalid signature format', async () => {
      const invalidSignature = 'invalid-signature';
      const result = await okxService.verifyWalletSignature(validAddress, invalidSignature, validMessage);
      expect(result).toBe(false);
    });

    it('should return false for invalid address format', async () => {
      const invalidAddress = 'invalid-address';
      const result = await okxService.verifyWalletSignature(invalidAddress, validSignature, validMessage);
      expect(result).toBe(false);
    });

    it('should retry on API failure', async () => {
      const mockPost = jest.spyOn(okxService.client, 'post')
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          status: 200,
          data: {
            code: '0',
            data: { address: validAddress }
          }
        });

      const result = await okxService.verifyWalletSignature(validAddress, validSignature, validMessage);
      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalledTimes(3);
    });

    it('should handle API error response', async () => {
      const mockPost = jest.spyOn(okxService.client, 'post')
        .mockResolvedValueOnce({
          status: 400,
          data: {
            code: '1',
            msg: 'Invalid signature'
          }
        });

      const result = await okxService.verifyWalletSignature(validAddress, validSignature, validMessage);
      expect(result).toBe(false);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should verify matching addresses', async () => {
      const mockPost = jest.spyOn(okxService.client, 'post')
        .mockResolvedValueOnce({
          status: 200,
          data: {
            code: '0',
            data: { address: validAddress.toLowerCase() }
          }
        });

      const result = await okxService.verifyWalletSignature(validAddress, validSignature, validMessage);
      expect(result).toBe(true);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should return false for mismatched addresses', async () => {
      const mockPost = jest.spyOn(okxService.client, 'post')
        .mockResolvedValueOnce({
          status: 200,
          data: {
            code: '0',
            data: { address: '0x1234567890123456789012345678901234567890' }
          }
        });

      const result = await okxService.verifyWalletSignature(validAddress, validSignature, validMessage);
      expect(result).toBe(false);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
  });
});
