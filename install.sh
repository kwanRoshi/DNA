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
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        error "未安装Python3。请先安装Python3"
        exit 1
    fi
    
    # 检查pip
    if ! command -v pip3 &> /dev/null; then
        error "未安装pip3。请先安装pip3"
        exit 1
    fi
    
    info "系统要求检查完成 ✓"
}

# 创建必要的文件
create_files() {
    info "创建必要的文件..."
    
    # 创建虚拟环境
    python3 -m venv venv
    source venv/bin/activate
    
    # 安装依赖
    info "安装Python依赖..."
    cd backend && pip install -r requirements.txt
    cd ../dna-backend && pip install -r requirements.txt
    cd ..
    
    info "文件创建完成 ✓"
}

# 启动服务
start_services() {
    info "启动服务..."
    
    # 启动后端服务
    cd backend
    python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
    cd ../dna-backend
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8300 &
    cd ..
    
    info "服务启动成功 ✓"
}

# 检查服务健康状态
check_health() {
    info "检查服务健康状态..."
    
    # 等待服务启动
    sleep 5
    
    # 检查后端API
    if curl -s http://localhost:8000/health &> /dev/null; then
        info "backend 运行正常 ✓"
    else
        warn "backend 状态检查失败"
    fi
    
    if curl -s http://localhost:8300/healthz &> /dev/null; then
        info "dna-backend 运行正常 ✓"
    else
        warn "dna-backend 状态检查失败"
    fi
}

# 显示使用说明
show_instructions() {
    echo
    info "部署完成！"
    echo
    echo -e "${GREEN}访问地址:${NC}"
    echo -e "  backend API: ${YELLOW}http://localhost:8000${NC}"
    echo -e "  dna-backend API: ${YELLOW}http://localhost:8300${NC}"
    echo
    echo -e "${GREEN}常用命令:${NC}"
    echo -e "  启动服务: ${YELLOW}./install.sh${NC}"
    echo -e "  停止服务: ${YELLOW}pkill -f uvicorn${NC}"
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