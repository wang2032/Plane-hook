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

## 配置

### 企业微信机器人配置

1. 在企业微信群中添加机器人，获取 Webhook URL

2. 创建 `.env` 文件（参考 `.env.example`）：
```bash
cp .env.example .env
```

3. 编辑 `.env` 文件，填入企业微信 Webhook URL：
```
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY_HERE
```

### 消息推送功能

服务会自动将 Plane 事件推送到企业微信群：

- **Issue 创建**: 显示标题、状态、优先级、创建者
- **Issue 更新**: 显示变更字段、当前状态、操作者
- **Issue 删除**: 显示标题、操作者
- **Issue 评论**: 显示评论操作和操作者
- **项目事件**: 显示项目操作和操作者

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

### Plane Webhook 数据结构

接收的消息包含以下字段：

- `event`: 事件类型（issue, issue_comment, project 等）
- `action`: 动作类型（created, updated, deleted）
- `webhook_id`: Webhook 唯一标识符
- `workspace_id`: 工作空间 ID
- `data`: 事件相关的具体数据
  - `id`: 数据的唯一标识符
  - `name`: 名称
  - `state`: 状态信息（仅 issue）
  - `priority`: 优先级（仅 issue）
  - 其他字段根据事件类型而不同
- `activity`: 操作详细信息
  - `actor`: 执行者信息（id, name, email, avatar 等）
  - `field`: 被更改的字段（仅更新事件）
  - `new_value`: 新值（仅更新事件）
  - `old_value`: 旧值（仅更新事件）

### 支持的事件类型

- `issue`: Issue 相关事件（创建、更新、删除）
- `issue_comment`: Issue 评论事件
- `project`: 项目相关事件

## 技术栈

- Node.js
- Express.js
- CORS
