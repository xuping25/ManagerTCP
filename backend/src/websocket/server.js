const WebSocket = require('ws');
const logger = require('../utils/logger');
const dataCollector = require('../services/dataCollector');

class WebSocketServer {
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.clients = new Set();
    this.setupServer();
  }

  setupServer() {
    this.wss.on('connection', (ws) => {
      logger.info('WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // 发送欢迎消息
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Manager UA WebSocket Server'
      }));
    });

    // 监听数据采集事件
    dataCollector.on('data', (data) => {
      this.broadcast({
        type: 'realtime_data',
        data
      });
    });

    // 监听报警事件
    dataCollector.on('alarm', (alarm) => {
      this.broadcast({
        type: 'alarm',
        data: alarm
      });
    });

    logger.info(`WebSocket server started on port ${this.wss.options.port}`);
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'subscribe':
        // 客户端订阅特定设备或数据点
        logger.info(`Client subscribed to: ${message.data}`);
        break;

      default:
        logger.warn(`Unknown message type: ${message.type}`);
    }
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  close() {
    this.wss.close(() => {
      logger.info('WebSocket server closed');
    });
  }
}

module.exports = WebSocketServer;
