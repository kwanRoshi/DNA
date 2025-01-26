import { validateHealthDataUpload, validateWalletAddress } from '../../middleware/validateMiddleware.js';

describe('Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      file: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('validateWalletAddress', () => {
    it('应该通过有效的钱包地址验证', async () => {
      mockReq.body.walletAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      await validateWalletAddress[0](mockReq, mockRes, nextFunction);
      await validateWalletAddress[1](mockReq, mockRes, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('应该拒绝无效的钱包地址格式', async () => {
      mockReq.body.walletAddress = 'invalid-address';
      
      await validateWalletAddress[0](mockReq, mockRes, nextFunction);
      await validateWalletAddress[1](mockReq, mockRes, nextFunction);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: '无效的钱包地址格式'
            })
          ])
        })
      );
    });

    it('应该拒绝空的钱包地址', async () => {
      mockReq.body.walletAddress = '';
      
      await validateWalletAddress[0](mockReq, mockRes, nextFunction);
      await validateWalletAddress[1](mockReq, mockRes, nextFunction);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: '钱包地址不能为空'
            })
          ])
        })
      );
    });
  });

  describe('validateHealthDataUpload', () => {
    it('应该通过有效的文件上传', async () => {
      mockReq.file = {
        mimetype: 'text/csv',
        size: 1024 * 1024 // 1MB
      };
      
      await validateHealthDataUpload[0](mockReq, mockRes, nextFunction);
      await validateHealthDataUpload[1](mockReq, mockRes, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('应该拒绝缺失的文件', async () => {
      mockReq.file = null;
      
      await validateHealthDataUpload[0](mockReq, mockRes, nextFunction);
      await validateHealthDataUpload[1](mockReq, mockRes, nextFunction);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: '请上传文件'
            })
          ])
        })
      );
    });

    it('应该拒绝不支持的文件类型', async () => {
      mockReq.file = {
        mimetype: 'image/jpeg',
        size: 1024 * 1024
      };
      
      await validateHealthDataUpload[0](mockReq, mockRes, nextFunction);
      await validateHealthDataUpload[1](mockReq, mockRes, nextFunction);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: '不支持的文件类型'
            })
          ])
        })
      );
    });

    it('应该拒绝超过大小限制的文件', async () => {
      mockReq.file = {
        mimetype: 'text/csv',
        size: 6 * 1024 * 1024 // 6MB
      };
      
      await validateHealthDataUpload[0](mockReq, mockRes, nextFunction);
      await validateHealthDataUpload[1](mockReq, mockRes, nextFunction);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              msg: '文件大小不能超过5MB'
            })
          ])
        })
      );
    });
  });
});
