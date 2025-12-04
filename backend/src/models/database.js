const sqlite3 = require('sqlite3').verbose();
const config = require('../config');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
  }

  initialize() {
    return new Promise((resolve, reject) => {
      const dbDir = path.dirname(config.database.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(config.database.path, (err) => {
        if (err) {
          logger.error('Database connection error:', err);
          reject(err);
        } else {
          logger.info('Database connected successfully');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 设备配置表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            protocol TEXT NOT NULL,
            connection_type TEXT NOT NULL,
            host TEXT,
            port INTEGER,
            serial_port TEXT,
            baud_rate INTEGER,
            data_bits INTEGER,
            stop_bits INTEGER,
            parity TEXT,
            slave_id INTEGER,
            rack INTEGER,
            slot INTEGER,
            timeout INTEGER,
            enabled INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 数据点配置表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS data_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            data_type TEXT NOT NULL,
            unit TEXT,
            scale REAL DEFAULT 1.0,
            offset REAL DEFAULT 0.0,
            description TEXT,
            enabled INTEGER DEFAULT 1,
            alarm_enabled INTEGER DEFAULT 0,
            alarm_high REAL,
            alarm_low REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
          )
        `);

        // 历史数据表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS history_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_point_id INTEGER NOT NULL,
            value REAL NOT NULL,
            quality INTEGER DEFAULT 1,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (data_point_id) REFERENCES data_points (id) ON DELETE CASCADE
          )
        `);

        // 报警记录表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_point_id INTEGER NOT NULL,
            alarm_type TEXT NOT NULL,
            alarm_level TEXT NOT NULL,
            value REAL NOT NULL,
            threshold REAL,
            message TEXT,
            status TEXT DEFAULT 'active',
            ack_time DATETIME,
            ack_user TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (data_point_id) REFERENCES data_points (id) ON DELETE CASCADE
          )
        `);

        // 自定义仪表板配置表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS dashboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            layout TEXT,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            logger.error('Create tables error:', err);
            reject(err);
          } else {
            logger.info('Database tables created successfully');
            resolve();
          }
        });

        // 创建索引
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history_data(timestamp)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_history_point ON history_data(data_point_id)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_alarms_status ON alarms(status)`);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();
