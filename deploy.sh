#!/bin/bash

echo "开始部署 Plane Webhook 服务..."

# 停止并删除旧容器
docker-compose down

# 构建并启动新容器
docker-compose up -d --build

# 查看日志
echo "服务已启动，查看日志："
docker-compose logs -f
