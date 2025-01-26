import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import connectDB from './config/db.js';
import apiRoutes from './routes/apiRoutes.js';
import { loggerMiddleware, errorLogger } from './config/logger.js';
import { globalErrorHandler } from './middleware/errorMiddleware.js';

// 环境变量配置
dotenv.config();
const app = express();

// 创建日志目录
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// 连接数据库
connectDB();

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use(loggerMiddleware);

// API 路由
app.use('/api', apiRoutes);

// 处理 favicon.ico 请求
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 处理 404 错误
app.all('*', (req, res, next) => {
  const err = new Error(`找不到路径: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});

// 错误处理中间件
app.use(errorLogger);
app.use(globalErrorHandler);

// 优雅关闭服务器
const server = app.listen(process.env.BACKEND_PORT || 5000, () => {
  console.log(`Server running on port ${process.env.BACKEND_PORT || 5000}`);
});

process.on('unhandledRejection', (err) => {
  console.error('未处理的 Promise 拒绝:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，优雅关闭中...');
  server.close(() => {
    console.log('进程终止');
    process.exit(0);
  });
});
