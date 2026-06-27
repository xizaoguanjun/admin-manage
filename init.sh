#!/bin/bash
# billing-system 项目初始化脚本
# 用于 AI 代理快速启动开发环境
#
# 使用方法：
#   chmod +x init.sh
#   ./init.sh
#
# 功能：
#   1. 检查 Node.js 和 pnpm 版本
#   2. 安装依赖（如需要）
#   3. 启动开发服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 版本比较函数
version_ge() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

echo ""
echo "=========================================="
echo "  billing-system 开发环境初始化"
echo "=========================================="
echo ""

# 1. 检查 Node.js
info "检查 Node.js 版本..."
check_command node
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_NODE="20.19.0"

if version_ge "$NODE_VERSION" "$REQUIRED_NODE"; then
    success "Node.js 版本: v$NODE_VERSION (要求 >= v$REQUIRED_NODE)"
else
    error "Node.js 版本过低: v$NODE_VERSION (要求 >= v$REQUIRED_NODE)"
    exit 1
fi

# 2. 检查 pnpm
info "检查 pnpm 版本..."
check_command pnpm
PNPM_VERSION=$(pnpm -v)
REQUIRED_PNPM="9"

if version_ge "$PNPM_VERSION" "$REQUIRED_PNPM"; then
    success "pnpm 版本: v$PNPM_VERSION (要求 >= v$REQUIRED_PNPM)"
else
    error "pnpm 版本过低: v$PNPM_VERSION (要求 >= v$REQUIRED_PNPM)"
    exit 1
fi

# 3. 检查并安装依赖
info "检查依赖状态..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    warning "依赖需要安装/更新"
    info "正在安装依赖..."
    pnpm install
    success "依赖安装完成"
else
    success "依赖已是最新状态"
fi

# 4. 检查必要的配置文件
info "检查配置文件..."
if [ ! -f "public/platform-config.json" ]; then
    warning "platform-config.json 不存在，可能需要配置"
fi

# 5. 显示可用命令
echo ""
echo "=========================================="
echo "  环境初始化完成"
echo "=========================================="
echo ""
info "可用命令："
echo "  pnpm dev          - 启动开发服务器"
echo "  pnpm build        - 构建生产版本"
echo "  pnpm lint         - 运行代码检查"
echo "  pnpm test         - 运行测试"
echo "  pnpm typecheck    - 类型检查"
echo ""

# 6. 询问是否启动开发服务器
read -p "是否立即启动开发服务器? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "启动开发服务器..."
    echo ""
    pnpm dev
fi

