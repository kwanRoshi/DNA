# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 创建src目录并复制源代码
RUN mkdir -p src
COPY src/ src/
COPY index.html .
COPY vite.config.js .

# 暴露端口
EXPOSE 5173

# 启动命令
CMD ["npm", "run", "dev", "--", "--host"]