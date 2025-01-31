# DNA 数据分析平台

一个用于DNA数据分析的全栈应用平台，支持文件上传、数据分析和结果可视化。支持本地优先的AI模型架构，提供完整的中文分析能力。

## 快速开始

### 系统要求

#### 软件依赖
- Python 3.12+ (推荐: 3.12.8)
- Node.js 18.x (推荐: v18.20.6)
- MongoDB 7.0+
- Ollama 0.5.7+
- pnpm 8.x (推荐) 或 npm 10.x

#### AI模型要求
- 主要模型: Ollama with DeepSeek-R1 1.5b (支持中文分析)
- 备选模型: DeepSeek API (需要API密钥)
- 可选模型: Claude API (额外备选)

#### 硬件要求
- 内存: 8GB以上 (推荐16GB)
- 存储: 20GB可用空间
- 系统: Linux (推荐Ubuntu 22.04 LTS)

### 安装步骤

1. 安装基础环境：
```bash
# 安装Python 3.12
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install python3.12 python3.12-venv

# 安装Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18.20.6
nvm use 18.20.6

# 安装pnpm
npm install -g pnpm@latest

# 安装MongoDB
bash backend/install_mongodb.sh

# 安装Ollama和模型
curl -fsSL https://ollama.com/install.sh | sh
ollama pull deepseek-r1:1.5b
```

2. 克隆项目：
```bash
git clone https://github.com/kwanRoshi/DNA.git
cd DNA
```

3. 后端设置：
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 配置环境
cp config_example.env .env
cp deployment.env.example deployment.env
```

4. 前端设置：
```bash
cd frontend
pnpm install
cp .env.example .env
cp deployment.env.example deployment.env
```

#### 本地部署

1. 一键安装所有依赖：
```bash
chmod +x one_click_install.sh
./one_click_install.sh
```

2. 启动服务：

后端服务:
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

前端服务:
```bash
cd frontend
pnpm dev
```

系统使用本地 Ollama 模型 (deepseek-r1:1.5b) 作为主要 AI 引擎，DeepSeek API 和 Claude API 作为备用选项。

### 示例分析

以下是一个健康数据分析示例：

```text
姓名：张三
年龄：45岁
性别：男

基本指标：
血压：135/85
血糖：5.8
胆固醇：5.2
BMI：24.5
睡眠：每天6-7小时
压力：中等偏高

生活习惯：
- 每周运动1-2次
- 饮食不规律
- 经常加班
```

系统会自动分析数据并提供建议：

```json
{
  "analysis": {
    "summary": "血压轻度偏高，其他指标在正常范围内。睡眠时间略短，工作压力较大。",
    "recommendations": [
      "建议增加运动频率至每周3-4次",
      "保持规律作息，确保充足睡眠",
      "注意饮食规律，控制盐分摄入"
    ],
    "risk_factors": [
      "血压偏高需要关注",
      "工作压力可能影响健康",
      "运动量不足"
    ]
  }
}
```

## 项目结构

```
.
├── backend/                 # Python后端服务
│   ├── app/               # 主应用目录
│   │   ├── models/       # 数据模型
│   │   ├── routers/      # API路由
│   │   ├── services/     # AI服务集成
│   │   └── utils/        # 工具函数
│   ├── tests/            # 测试目录
│   └── config/           # 配置文件
├── frontend/              # React前端应用
│   ├── src/
│   │   ├── components/   # React组件
│   │   ├── services/     # API服务
│   │   └── utils/        # 工具函数
│   └── tests/            # 前端测试
```

## 环境配置

### 后端配置 (.env)
```env
# AI模型配置
OLLAMA_ENABLED=true
OLLAMA_MODEL=deepseek-r1:1.5b
OLLAMA_API_BASE=http://localhost:11434
OLLAMA_TIMEOUT_SECONDS=120

# 数据库配置
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=dna_analysis

# 模型优先级配置
MODEL_FALLBACK_PRIORITY=ollama,deepseek,claude
```

### 前端配置 (.env)
```env
# API配置
VITE_API_URL=http://localhost:8080
VITE_WEBSOCKET_URL=ws://localhost:8080/ws

# 功能开关
VITE_ENABLE_CHINESE_UI=true
VITE_ENABLE_LOCAL_MODEL=true
```

## 功能特性

- 🤖 本地优先的AI模型架构
- 🌏 完整的中文分析支持
- 📊 DNA序列分析
- 🏥 健康数据评估
- 📈 结果可视化
- 📱 响应式设计

## 技术栈

### 后端
- Python 3.12 + FastAPI
- MongoDB
- Ollama (本地AI模型)
- DeepSeek API (备选)
- Claude API (可选备选)

### 前端
- React 18
- Vite
- Ant Design
- Modern CSS

## 运行和测试

### 启动服务
```bash
# 启动MongoDB
sudo systemctl start mongod

# 启动Ollama
ollama serve &
ollama run deepseek-r1:1.5b

# 启动后端 (新终端)
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080

# 启动前端 (新终端)
cd frontend
pnpm dev
```

### 运行测试
```bash
# 后端测试
cd backend
pytest tests/ -v --cov=app

# 前端测试
cd frontend
pnpm test
```

## 常见问题

1. Ollama模型问题：
```bash
# 检查模型状态
ollama list
# 重新下载模型
ollama pull deepseek-r1:1.5b --force
```

2. MongoDB问题：
```bash
# 检查服务状态
sudo systemctl status mongod
# 重启服务
sudo systemctl restart mongod
```

3. 环境验证：
```bash
# 验证后端环境
cd backend
python verify_environment.py

# 验证前端环境
cd frontend
node verify_node_deps.js
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加新特性'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
