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
   - 前端界面：http://localhost:5174
   - API接口：http://localhost:8000

### 方法二：手动安装

#### 前置要求

- Python >= 3.12
- Node.js >= 18
- Git
- Ollama

#### Ollama安装与配置

1. 安装Ollama
```bash
# Linux
curl https://ollama.ai/install.sh | sh

# MacOS
brew install ollama
```

2. 下载并运行模型
```bash
# 下载deepseek-r1:1.5b模型
ollama pull deepseek-r1:1.5b

# 启动Ollama服务（确保11434端口可用）
ollama serve

# 在新终端中运行模型
ollama run deepseek-r1:1.5b
```

3. 验证安装
```bash
# 测试模型是否正常运行
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-r1:1.5b",
  "prompt": "你好"
}'
```

### AI服务配置

本项目使用多层AI服务架构，按以下优先级处理DNA序列分析：

1. Ollama (deepseek-r1:1.5b)
   - 主要本地处理引擎
   - 运行在本地11434端口
   - 无需API密钥

2. DeepSeek API
   - 第一备选服务
   - 需要在.env中配置DEEPSEEK_API_KEY
   - 当本地Ollama服务不可用时自动切换

3. Claude API
   - 第二备选服务
   - 需要在.env中配置CLAUDE_API_KEY
   - 当DeepSeek API不可用时自动切换

系统会自动进行服务切换，确保DNA分析服务的持续可用性。所有分析结果均以中文返回，包含序列特征、健康影响和专业建议。

### AI服务故障转移逻辑

系统采用多层故障转移机制，确保服务的可靠性：

```python
async def analyze_sequence(sequence: str):
    try:
        # 尝试使用本地Ollama服务
        result = await ollama_service.analyze_sequence(sequence)
        if result:
            return result
    except Exception:
        logger.warning("Ollama服务不可用，切换至DeepSeek API")
    
    try:
        # 尝试使用DeepSeek API
        result = await deepseek_service.analyze_sequence(sequence)
        if result:
            return result
    except Exception:
        logger.warning("DeepSeek API不可用，切换至Claude API")
    
    # 最后尝试使用Claude API
    return await claude_service.analyze_sequence(sequence)
```

当某个服务不可用时，系统会自动切换到下一个可用的服务，确保分析请求能够得到处理。所有服务都会返回统一格式的中文分析结果。

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
pip install -r requirements.txt

# 安装前端依赖
cd ../frontend
pnpm install
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
# 启动Ollama服务
ollama run deepseek-r1:1.5b

# 新开终端，启动后端服务
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 新开终端，启动前端服务
cd frontend
pnpm dev
```

## 项目结构

```
.
├── backend/                 # FastAPI后端服务
│   ├── app/               # 应用主目录
│   │   ├── services/     # AI服务和路由
│   │   ├── config.py    # 配置文件
│   │   └── main.py      # 入口文件
│   └── tests/            # 测试文件
├── frontend/               # React前端应用
│   ├── src/
│   │   ├── components/   # React组件
│   │   ├── services/     # API服务
│   │   ├── test/        # 测试文件
│   │   └── utils/       # 工具函数
│   └── index.html        # 入口HTML
```

## 环境变量配置

### 后端 (.env)

```env
# AI Provider Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

### 前端 (.env)

```env
VITE_API_URL=http://localhost:8000
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
- Python + FastAPI
- Ollama (deepseek-r1:1.5b)
- DeepSeek API
- Claude API

### 前端
- React 18
- Vite
- Vitest
- Material-UI

## 常见问题

1. 如果遇到 MongoDB 连接错误：
   - 确保 MongoDB 服务已启动
   - 检查连接字符串是否正确

2. 如果遇到前端依赖安装错误：
   - 使用 `npm install --legacy-peer-deps`
   - 或者清除 node_modules 后重新安装

3. 如果遇到端口占用问题：
   - 检查8000端口和5174端口是否被其他程序占用
   - 使用 `lsof -i :端口号` 查看占用进程

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
