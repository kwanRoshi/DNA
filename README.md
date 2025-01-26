# DNA 数据分析平台

一个用于DNA数据分析的全栈应用平台，支持文件上传、数据分析和结果可视化。

## 快速开始

### 方法一：一键安装部署（推荐）

1. 下载安装脚本并执行：

```bash
curl -o install.sh https://raw.githubusercontent.com/yourusername/dna-platform/main/install.sh
chmod +x install.sh
./install.sh
```

或者直接运行：

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/yourusername/dna-platform/main/install.sh)"
```

2. 访问应用：
   - 前端界面：http://localhost:5173
   - API接口：http://localhost:3000

### 方法二：手动安装

#### 前置要求

- Node.js >= 18
- MongoDB >= 6.0
- Docker (可选)
- Git

#### 本地开发环境搭建

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/dna-platform.git
cd dna-platform
```

2. 安装依赖：
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install --legacy-peer-deps
```

3. 配置环境变量：
```bash
# 后端配置
cd backend
cp .env.example .env

# 前端配置
cd ../frontend
cp .env.example .env
```

4. 启动服务：
```bash
# 启动后端服务
cd backend
npm start

# 新开终端，启动前端服务
cd frontend
npm run dev
```

#### Docker 部署

1. 确保 Docker 和 Docker Compose 已安装

2. 一键启动所有服务：
```bash
docker-compose up --build
```

## 项目结构

```
.
├── backend/                 # 后端服务
│   ├── controllers/        # 业务逻辑控制器
│   ├── models/            # 数据模型
│   ├── routes/            # API路由
│   ├── config/            # 配置文件
│   └── server.js          # 入口文件
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── services/      # API服务
│   │   └── utils/         # 工具函数
│   └── index.html         # 入口HTML
└── docker-compose.yml      # Docker编排配置
```

## 环境变量配置

### 后端 (.env)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dna_analysis
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 前端 (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_MAX_UPLOAD_SIZE=5242880
```

## 功能特性

- 🔐 安全的用户认证
- 📊 DNA数据分析
- 📁 文件上传与管理
- 📈 结果可视化
- 📱 响应式设计

## 技术栈

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT认证
- Docker容器化

### 前端
- React 18
- Vite
- Axios
- Modern CSS

## 常见问题

1. 如果遇到 MongoDB 连接错误：
   - 确保 MongoDB 服务已启动
   - 检查连接字符串是否正确

2. 如果遇到前端依赖安装错误：
   - 使用 `npm install --legacy-peer-deps`
   - 或者清除 node_modules 后重新安装

3. 如果遇到 Docker 启动问题：
   - 确保 Docker Desktop 已启动
   - 检查端口是否被占用

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件