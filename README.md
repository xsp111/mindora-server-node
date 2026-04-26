# Mindora Server

## env requirements

1. 下载 node 环境 >= 22.0.0：https://nodejs.org/en-zh/download/
2. 下载 mongodb 并创建 database：mindora
3. 下载 qdrant（https://github.com/qdrant/qdrant/releases），并将可执行文件解压到 ./src/services/agent/rag/vdb/qdrant/ 目录下

## .env

在根目录下创建 .env 文件，并添加以下环境变量：

```env
DATABASE_URL="mongodb://localhost:27017/mindora"
API_KEY=""
API_BASE_URL=""
MODEL=""
EMBEDDING_MODEL=""
```

不同厂商接口字段可能存在差异，建议使用 qwen3.5 以上模型，如有需要要查询厂商文档调整字段 ./src/services/agent/module/model.ts 中的字段

## install dependencies

```bash
npm install -g pnpm
pnpm install
```

## start server

```bash
# 同步 prisma 以及 数据库服务
pnpm run update:mgDB
pnpm run update:prisma:client

# 启动 qdrant 服务
pnpm run rag:build
pnpm run rag:run

# 启动服务
pnpm dev
```

服务会在 3000 端口启动

## relative

- [Mindora Frontend](https://github.com/xsp111/mindora-frontend)
