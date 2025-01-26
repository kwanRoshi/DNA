import winston from 'winston';
import { loggerMiddleware, errorLogger } from '../../config/logger.js';

// Mock winston
jest.mock('winston', () => ({
  format: {
    timestamp: jest.fn().mockReturnValue(() => {}),
    errors: jest.fn().mockReturnValue(() => {}),
    splat: jest.fn().mockReturnValue(() => {}),
    json: jest.fn().mockReturnValue(() => {}),
    combine: jest.fn().mockReturnValue(() => {}),
    colorize: jest.fn().mockReturnValue(() => {}),
    simple: jest.fn().mockReturnValue(() => {})
  },
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    add: jest.fn()
  }),
  transports: {
    File: jest.fn(),
    Console: jest.fn()
  }
}));

describe('Logger Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;
  let logger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
      user: {
        walletAddress: '0x123'
      }
    };

    mockRes = {
      on: jest.fn(),
      statusCode: 200
    };

    nextFunction = jest.fn();
    logger = winston.createLogger();
  });

  describe('loggerMiddleware', () => {
    it('应该记录请求信息', () => {
      loggerMiddleware(mockReq, mockRes, nextFunction);

      expect(logger.info).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        userId: '0x123'
      });
    });

    it('应该记录响应信息', () => {
      mockRes.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      });

      loggerMiddleware(mockReq, mockRes, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/test',
          status: 200,
          duration: expect.stringMatching(/\d+ms/)
        })
      );
    });

    it('应该调用 next()', () => {
      loggerMiddleware(mockReq, mockRes, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('应该处理没有用户信息的请求', () => {
      mockReq.user = undefined;
      loggerMiddleware(mockReq, mockRes, nextFunction);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined
        })
      );
    });
  });

  describe('errorLogger', () => {
    it('应该记录错误信息', () => {
      const error = new Error('测试错误');
      error.stack = 'Error: 测试错误\n    at Test';

      errorLogger(error, mockReq, mockRes, nextFunction);

      expect(logger.error).toHaveBeenCalledWith({
        message: '测试错误',
        stack: 'Error: 测试错误\n    at Test',
        method: 'GET',
        url: '/test',
        userId: '0x123'
      });
    });

    it('应该调用 next() 并传递错误', () => {
      const error = new Error('测试错误');
      errorLogger(error, mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(error);
    });

    it('应该处理没有堆栈信息的错误', () => {
      const error = new Error('测试错误');
      error.stack = undefined;

      errorLogger(error, mockReq, mockRes, nextFunction);

      expect(logger.error).toHaveBeenCalledWith({
        message: '测试错误',
        stack: undefined,
        method: 'GET',
        url: '/test',
        userId: '0x123'
      });
    });
  });

  describe('Logger Configuration', () => {
    it('应该在开发环境添加控制台输出', () => {
      process.env.NODE_ENV = 'development';
      jest.isolateModules(() => {
        require('../../config/logger.js');
        expect(winston.transports.Console).toHaveBeenCalled();
      });
    });

    it('应该在生产环境不添加控制台输出', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockConsole = jest.fn();
      winston.transports.Console.mockImplementation(() => ({
        format: jest.fn()
      }));
      
      jest.isolateModules(() => {
        require('../../config/logger.js');
      });
      
      expect(winston.transports.Console).not.toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });
  });
});
