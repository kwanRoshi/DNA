import { AppError, globalErrorHandler, catchAsync } from '../../middleware/errorMiddleware.js';
import logger from '../../config/logger.js';

// Mock logger
jest.mock('../../config/logger.js', () => ({
  error: jest.fn(),
  __esModule: true,
  default: { error: jest.fn() }
}));

describe('Error Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/test'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    process.env.NODE_ENV = 'development';
  });

  describe('AppError', () => {
    it('应该正确创建操作错误', () => {
      const error = new AppError('测试错误', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.message).toBe('测试错误');
    });

    it('应该正确创建服务器错误', () => {
      const error = new AppError('服务器错误', 500);
      
      expect(error.statusCode).toBe(500);
      expect(error.status).toBe('error');
    });
  });

  describe('globalErrorHandler', () => {
    describe('开发环境', () => {
      it('应该发送详细的错误信息', () => {
        const error = new Error('测试错误');
        error.statusCode = 400;
        error.status = 'fail';
        error.stack = 'Error stack';

        globalErrorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'fail',
          error: error,
          message: '测试错误',
          stack: 'Error stack'
        });
      });
    });

    describe('生产环境', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('应该处理可操作的错误', () => {
        const error = new AppError('验证错误', 400);

        globalErrorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'fail',
          message: '验证错误'
        });
      });

      it('应该处理编程错误', () => {
        const error = new Error('未知错误');

        globalErrorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'error',
          message: '服务器内部错误'
        });
      });

      it('应该处理 JWT 错误', () => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';

        globalErrorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'fail',
          message: '无效的令牌，请重新登录'
        });
      });

      it('应该处理 JWT 过期错误', () => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';

        globalErrorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'fail',
          message: '令牌已过期，请重新登录'
        });
      });

      it('应该处理 MongoDB 重复键错误', () => {
        const error = new Error('duplicate key error');
        error.code = 11000;
        error.errmsg = 'duplicate key error index: test.collection.$email_1 dup key: { email: "test@test.com" }';

        globalErrorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json.mock.calls[0][0].message).toContain('重复的字段值');
      });

      it('应该处理 MongoDB 验证错误', () => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.errors = {
          field1: { message: '字段1错误' },
          field2: { message: '字段2错误' }
        };

        globalErrorHandler(error, mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json.mock.calls[0][0].message).toContain('无效的输入数据');
      });
    });
  });

  describe('catchAsync', () => {
    it('应该捕获异步错误', async () => {
      const error = new Error('异步错误');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = catchAsync(asyncFn);

      await wrappedFn(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('应该正常处理成功的异步操作', async () => {
      const result = { data: 'success' };
      const asyncFn = jest.fn().mockResolvedValue(result);
      const wrappedFn = catchAsync(asyncFn);

      await wrappedFn(mockReq, mockRes, nextFunction);

      expect(asyncFn).toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
