# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads && chmod 777 uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "run", "dev"]