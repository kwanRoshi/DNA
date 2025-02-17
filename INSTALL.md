# DNA Analysis Platform Installation Guide

## System Requirements

### Software Dependencies
- Python 3.12 or higher
- Node.js 18.x or higher
- Ollama 0.5.7 or higher
- MongoDB 7.0 or higher
- pnpm 8.x (recommended) or npm 10.x

### AI Model Requirements
- Primary: Ollama with DeepSeek-R1 1.5b model (支持中文分析)
- Fallback: DeepSeek API access (requires API key)
- Optional: Claude API access (for additional fallback)

### Language Support
- Full Chinese (中文) support for health analysis
- Bilingual interface (Chinese/English)
- Unicode-compliant data processing

## Installation Steps

### 1. Python Environment Setup
```bash
# Install Python dependencies
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r backend/requirements.txt

# Install development dependencies for testing
python -m pip install -r backend/requirements-dev.txt
```

### 2. Node.js Environment Setup
```bash
# Install pnpm (recommended)
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Install Node.js dependencies
cd frontend
pnpm install

# Alternative: Using npm
npm install
```

### 3. Ollama Setup
```bash
# Install Ollama (Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
systemctl --user start ollama
systemctl --user enable ollama

# Pull DeepSeek model
ollama pull deepseek-r1:1.5b

# Verify model installation
ollama list
```

### 4. MongoDB Setup
```bash
# 快速安装

使用一键安装脚本安装所有依赖：

```bash
chmod +x one_click_install.sh
./one_click_install.sh
```

此脚本将自动安装和配置：
- Python 3.12 环境
- Node.js 18 和 pnpm
- MongoDB 数据库
- Ollama 和 deepseek-r1:1.5b 模型
- 所有项目依赖

# 手动安装

如果需要手动安装各个组件：

## 1. MongoDB
```bash
bash backend/install_mongodb.sh
mongosh --eval "db.version()"  # 验证安装
```

## 2. Python 环境
```bash
python3.12 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install -r backend/requirements-dev.txt
```

## 3. Node.js 环境
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh

# 安装 Node.js
nvm install 18
nvm use 18

# 安装 pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
```

## 4. Ollama 设置
```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull deepseek-r1:1.5b

# 验证模型
ollama run deepseek-r1:1.5b "你好，请分析这段健康数据：血压 120/80，血糖 5.2"
```

## 环境变量配置

后端配置 (backend/.env):
```env
# AI 模型配置
OLLAMA_ENABLED=true
OLLAMA_MODEL=deepseek-r1:1.5b
OLLAMA_API_BASE=http://localhost:11434
OLLAMA_TIMEOUT_SECONDS=120

# 模型优先级配置
MODEL_FALLBACK_PRIORITY=ollama,deepseek,claude

# 服务器配置
PORT=8080
HOST=0.0.0.0
```

前端配置 (frontend/.env):
```env
VITE_API_URL=http://localhost:8080
VITE_ENABLE_CHINESE_UI=true
VITE_ENABLE_LOCAL_MODEL=true
```
```

### 5. Environment Configuration

The system includes verification scripts to ensure proper setup:
```bash
# Verify entire environment
python backend/verify_environment.py

# Verify Python dependencies
python backend/verify_python_deps.py

# Verify Node.js environment
node frontend/verify_node_deps.js
```

Create a `.env` file in the backend directory:
```env
# Required Configuration
OLLAMA_ENABLED=true
OLLAMA_MODEL=deepseek-r1:1.5b
OLLAMA_API_BASE=http://localhost:11434
OLLAMA_TIMEOUT_SECONDS=120

# Database Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=dna_analysis

# Optional API Keys (for fallback)
DEEPSEEK_API_KEY=your_deepseek_api_key
CLAUDE_API_KEY=your_claude_api_key
```

### 6. Running the Application

#### Backend Services
```bash
cd backend

# Development mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

# Production mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --workers 4
```

#### Frontend Development
```bash
cd frontend

# Using pnpm (recommended)
pnpm dev

# Alternative: Using npm
npm run dev
```

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
python -m pytest

# Run with coverage report
python -m pytest --cov=app --cov-report=term-missing

# Run specific test file
python -m pytest tests/test_analysis_pipeline.py -v
```

### Frontend Tests
```bash
cd frontend

# Using pnpm (recommended)
pnpm test
pnpm test:coverage

# Alternative: Using npm
npm run test
npm run test:coverage
```

## Model Configuration

The system uses a fallback priority system:
1. Local Ollama (DeepSeek-R1 1.5b) - Optimized for Chinese text analysis
2. DeepSeek API - Full Chinese language support
3. Claude API (if configured) - Multilingual capability

### Model Performance Notes
- Local Ollama model provides fastest response times
- All models support Chinese medical terminology
- Consistent response format across all providers
- Automatic fallback on service disruption

Model fallback order can be configured in `backend/app/config.py`:
```python
MODEL_FALLBACK_PRIORITY = ["ollama", "deepseek", "claude"]
```

## Health Check

Verify the installation:
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
    "status": "healthy",
    "ollama": "connected",
    "version": "0.5.7",
    "models": ["deepseek-r1:1.5b"]
}
```

## Troubleshooting

### 1. Ollama Issues
- Verify Ollama service: `systemctl --user status ollama`
- Check model availability: `ollama list`
- Test model: `ollama run deepseek-r1:1.5b "测试"`
- Check logs: `journalctl --user -u ollama`

### 2. MongoDB Issues
- Check service status: `sudo systemctl status mongodb`
- Verify connection: `mongosh`
- Check logs: `sudo journalctl -u mongodb`

### 3. API Connection Issues
- Test DeepSeek API: `curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" https://api.deepseek.com/v1/models`
- Verify environment variables: `python backend/config_check.py`
- Check network connectivity: `curl -v http://localhost:11434/api/health`

### 4. Common Problems
- Port conflicts: Check if ports 8080 (backend) and 5173 (frontend) are available
- Python version mismatch: Verify with `python --version`
- Node.js version issues: Use `nvm install 18` if needed
- Permission issues: Check file ownership in backend/frontend directories

## Support

For technical issues:
1. Check the logs:
   - Backend: `backend/logs/app.log`
   - Ollama: `journalctl --user -u ollama`
   - MongoDB: `sudo journalctl -u mongodb`

2. Run diagnostics:
   ```bash
   python backend/verify_services.py
   python backend/test_services.py
   ```

3. Review documentation:
   - API documentation: http://localhost:8080/docs
   - Test coverage report: `backend/htmlcov/index.html`
