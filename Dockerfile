# 第一阶段：构建阶段
FROM node:22 AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY . .
RUN ls
# 安装 pnpm 并安装依赖
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# 修复 sm-crypto：构建 dist/ 并添加 exports 字段，解决 ESM 导入问题
WORKDIR /app/node_modules/sm-crypto
RUN node -e "const fs = require('fs'); \
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')); \
pkg.exports = { \
  '.': { import: './dist/sm3.js', require: './dist/sm3.js' }, \
  './sm2': './dist/sm2.js', \
  './sm3': './dist/sm3.js', \
  './sm4': './dist/sm4.js' \
}; \
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2)); \
if (!fs.existsSync('./dist/index.js')) { \
  fs.writeFileSync('./dist/index.js', 'module.exports = { sm2: require(\"./sm2\"), sm3: require(\"./sm3\"), sm4: require(\"./sm4\") };'); \
} \
console.log('sm-crypto patched');"

# 构建 TypeScript
WORKDIR /app
RUN pnpm run build
# 阶段2：运行
FROM nginx:alpine
ARG ENV=saas-prod
COPY --from=builder /app/data-center-admin /data/web/data-center-admin
COPY /k8s/${ENV}/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
