#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 检查系统要求
check_requirements() {
    info "检查系统要求..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        error "未安装Docker。请先安装Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "未安装Docker Compose。请先安装Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    info "系统要求检查完成 ✓"
}

# 创建必要的文件
create_files() {
    info "创建必要的文件..."
    
    # 创建docker-compose.yml
    cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: dna-mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - dna-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: dna-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/dna_analysis
      - JWT_SECRET=your_jwt_secret_key_here
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      - mongodb
    networks:
      - dna-network
    volumes:
      - ./backend:/usr/src/app
      - /usr/src/app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: dna-frontend
    restart: always
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000/api
    depends_on:
      - backend
    networks:
      - dna-network
    volumes:
      - ./frontend:/usr/src/app
      - /usr/src/app/node_modules

networks:
  dna-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
EOL

    # 创建后端 Dockerfile
    mkdir -p backend
    cat > backend/Dockerfile << 'EOL'
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p uploads && chmod 777 uploads

EXPOSE 3000

CMD ["npm", "start"]
EOL

    # 创建前端 Dockerfile
    mkdir -p frontend
    cat > frontend/Dockerfile << 'EOL'
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
EOL

    # 创建后端 package.json
    cat > backend/package.json << 'EOL'
{
  "name": "dna-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "mongoose": "^7.0.3",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOL

    # 创建前端 package.json
    cat > frontend/package.json << 'EOL'
{
  "name": "dna-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "axios": "^1.3.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.1"
  }
}
EOL

    # 创建后端入口文件
    cat > backend/server.js << 'EOL'
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOL

    # 创建前端入口文件
    mkdir -p frontend/src
    cat > frontend/src/main.jsx << 'EOL'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOL

    cat > frontend/src/App.jsx << 'EOL'
import React from 'react'

function App() {
  return (
    <div className="app">
      <h1>DNA Analysis Platform</h1>
      <p>Welcome to DNA Analysis Platform</p>
    </div>
  )
}

export default App
EOL

    cat > frontend/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DNA Analysis Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOL

    # 创建 vite 配置文件
    cat > frontend/vite.config.js << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true
      }
    }
  }
})
EOL

    info "文件创建完成 ✓"
}

# 启动Docker服务
start_services() {
    info "启动Docker服务..."
    
    # 停止可能存在的旧容器
    docker-compose down --volumes --remove-orphans &> /dev/null
    
    # 构建和启动服务
    if docker-compose up --build -d; then
        info "服务启动成功 ✓"
    else
        error "服务启动失败，请检查日志"
        exit 1
    fi
}

# 检查服务健康状态
check_health() {
    info "检查服务健康状态..."
    
    # 等待服务启动
    sleep 20
    
    # 检查MongoDB
    if docker-compose exec mongodb mongosh --eval "db.stats()" &> /dev/null; then
        info "MongoDB 运行正常 ✓"
    else
        warn "MongoDB 状态检查失败，但可能仍在启动中"
    fi
    
    # 检查后端API
    if curl -s http://localhost:3000/api/health &> /dev/null; then
        info "后端API 运行正常 ✓"
    else
        warn "后端API 状态检查失败，但可能仍在启动中"
    fi
    
    # 检查前端服务
    if curl -s http://localhost:5173 &> /dev/null; then
        info "前端服务 运行正常 ✓"
    else
        warn "前端服务 状态检查失败，但可能仍在启动中"
    fi
}

# 显示使用说明
show_instructions() {
    echo
    info "部署完成！"
    echo
    echo -e "${GREEN}访问地址:${NC}"
    echo -e "  前端界面: ${YELLOW}http://localhost:5173${NC}"
    echo -e "  API接口: ${YELLOW}http://localhost:3000${NC}"
    echo
    echo -e "${GREEN}常用命令:${NC}"
    echo -e "  查看所有容器状态: ${YELLOW}docker-compose ps${NC}"
    echo -e "  查看服务日志: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  重启服务: ${YELLOW}docker-compose restart${NC}"
    echo -e "  停止服务: ${YELLOW}docker-compose down${NC}"
    echo
    echo -e "${YELLOW}注意：首次启动可能需要几分钟时间完成所有服务的初始化${NC}"
    echo
}

# 主函数
main() {
    echo "=== DNA 数据分析平台安装脚本 ==="
    echo
    
    # 执行安装步骤
    check_requirements
    create_files
    start_services
    check_health
    show_instructions
}

# 执行主函数
main 