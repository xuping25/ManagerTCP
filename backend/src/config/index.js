require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  websocket: {
    port: process.env.WS_PORT || 3001
  },
  database: {
    path: process.env.DB_PATH || './data/manager_ua.db'
  },
  dataCollection: {
    interval: parseInt(process.env.DATA_COLLECTION_INTERVAL) || 5000
  },
  history: {
    retentionDays: parseInt(process.env.HISTORY_RETENTION_DAYS) || 90
  },
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
