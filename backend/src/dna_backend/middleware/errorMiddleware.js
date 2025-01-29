import logger from '../config/logger.js';

// 自定义错误类
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 处理 JWT 错误
const handleJWTError = () => {
  return new AppError('无效的令牌，请重新登录', 401);
};

// 处理 JWT 过期错误
const handleJWTExpiredError = () => {
  return new AppError('令牌已过期，请重新登录', 401);
};

// 处理 MongoDB 重复键错误
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  return new AppError(`重复的字段值: ${value}。请使用其他值`, 400);
};

// 处理 MongoDB 验证错误
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  return new AppError(`无效的输入数据。${errors.join('. ')}`, 400);
};

// 开发环境错误处理
const sendErrorDev = (err, res) => {
  logger.error('开发环境错误:', {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// 生产环境错误处理
const sendErrorProd = (err, res) => {
  // 可操作的、可信的错误
  if (err.isOperational) {
    logger.error('操作错误:', {
      status: err.status,
      message: err.message
    });

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // 编程错误或未知错误
  else {
    logger.error('系统错误:', {
      error: err,
      message: err.message,
      stack: err.stack
    });

    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
  }
};

// 全局错误处理中间件
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};

// 捕获未处理的异步错误
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
