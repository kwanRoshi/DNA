#!/usr/bin/env bash
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}DNA Analysis Platform Installation Script${NC}"

# Check Python version
if ! command -v python3.12 &> /dev/null; then
    echo -e "${RED}Python 3.12 is required but not found${NC}"
    exit 1
fi

# Install MongoDB
echo -e "${YELLOW}Installing MongoDB...${NC}"
bash backend/install_mongodb.sh

# Install Ollama
echo -e "${YELLOW}Installing/Updating Ollama...${NC}"
curl -fsSL https://ollama.com/install.sh | sh
echo -e "${YELLOW}Pulling DeepSeek model...${NC}"
ollama pull deepseek-r1:1.5b

# Setup Python environment
echo -e "${YELLOW}Setting up Python environment...${NC}"
cd backend
python -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt

# Verify Python environment
python verify_python_deps.py
python verify_environment.py

# Setup Node.js environment
echo -e "${YELLOW}Setting up Node.js environment...${NC}"
cd ../frontend
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
pnpm install

# Verify Node.js environment
node verify_node_deps.js

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}To start the services:${NC}"
echo -e "1. Start backend: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8080"
echo -e "2. Start frontend: cd frontend && pnpm dev"
