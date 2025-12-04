const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const logger = require('./utils/logger');
const database = require('./models/database');
const routes = require('./routes');
const WebSocketServer = require('./websocket/server');
const dataCollector = require('./services/dataCollector');
const deviceManager = require('./services/deviceManager');
const fs = require('fs');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 错误处理
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 初始化函数
async function initialize() {
  try {
    // 创建必要的目录
    const dirs = ['logs', 'data'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // 初始化数据库
    await database.initialize();
    logger.info('Database initialized');

    // 启动数据采集
    await dataCollector.start();
    logger.info('Data collector started');

    // 连接所有启用的设备
    const devices = await database.all('SELECT * FROM devices WHERE enabled = 1');
    for (const device of devices) {
      try {
        await deviceManager.connectDevice(device);
        logger.info(`Device ${device.name} connected`);
      } catch (error) {
        logger.error(`Failed to connect device ${device.name}:`, error);
      }
    }

    // 启动HTTP服务器
    app.listen(config.server.port, () => {
      logger.info(`HTTP server listening on port ${config.server.port}`);
    });

    // 启动WebSocket服务器
    const wsServer = new WebSocketServer(config.websocket.port);

    // 优雅关闭
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await shutdown(wsServer);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await shutdown(wsServer);
    });

  } catch (error) {
    logger.error('Initialization error:', error);
    process.exit(1);
  }
}

async function shutdown(wsServer) {
  try {
    // 停止数据采集
    await dataCollector.stop();

    // 断开所有设备
    await deviceManager.disconnectAll();

    // 关闭WebSocket服务器
    wsServer.close();

    // 关闭数据库
    await database.close();

    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Shutdown error:', error);
    process.exit(1);
  }
}

// 启动应用
initialize();

module.exports = app;
