require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/', (req, res) => {
  res.json({ message: '欢迎使用简单后端服务', status: 'ok' });
});

// 挂载路由
app.use('/api', routes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '路由不存在' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
