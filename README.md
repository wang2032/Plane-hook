# Plane 消息钩子服务

这是一个使用 Express 框架搭建的消息监听服务。

## 安装依赖

```bash
npm install
```

## 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## Docker 部署

### 使用 Docker Compose 部署

1. 构建并启动服务：
```bash
docker-compose up -d --build
```

2. 查看日志：
```bash
docker-compose logs -f
```

3. 停止服务：
```bash
docker-compose down
```

### 快速部署脚本

给脚本添加执行权限：
```bash
chmod +x deploy.sh
```

运行部署脚本：
```bash
./deploy.sh
```

### 常用命令

```bash
# 重启服务
docker-compose restart

# 查看运行状态
docker-compose ps

# 进入容器
docker-compose exec plane-webhook sh
```

## API 接口

服务默认运行在 `http://localhost:3000`

### 消息钩子接口

- `GET /` - 健康检查
- `POST /api/plane/message-hook` - 接收 plane 消息

### 示例请求

发送消息：
```bash
curl -X POST http://localhost:3000/api/plane/message-hook \
  -H "Content-Type: application/json" \
  -d '{"type":"message","content":"测试消息"}'
```

## 项目结构

```
.
├── src/
│   ├── index.js                  # 应用入口
│   ├── routes/                   # 路由层
│   │   ├── index.js              # 路由主入口
│   │   └── planeRouter.js        # plane 消息路由
│   ├── controllers/              # 控制器层
│   │   └── messageController.js  # 消息控制器
│   └── services/                 # 服务层（业务逻辑）
│       └── messageService.js     # 消息服务
├── package.json
└── README.md
```

## 架构说明

- **Router（路由层）**：定义 API 端点，将请求分发到对应的 Controller
- **Controller（控制器层）**：处理 HTTP 请求和响应，调用 Service 层
- **Service（服务层）**：包含业务逻辑和数据处理

## 技术栈

- Node.js
- Express.js
- CORS
