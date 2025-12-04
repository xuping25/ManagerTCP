const database = require('../models/database');
const deviceManager = require('./deviceManager');
const logger = require('../utils/logger');
const config = require('../config');
const EventEmitter = require('events');

class DataCollector extends EventEmitter {
  constructor() {
    super();
    this.collectionInterval = null;
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Data collector already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting data collector...');

    this.collectionInterval = setInterval(
      () => this.collectData(),
      config.dataCollection.interval
    );

    // 立即执行一次
    await this.collectData();
  }

  async stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isRunning = false;
    logger.info('Data collector stopped');
  }

  async collectData() {
    try {
      // 获取所有启用的设备
      const devices = await database.all(
        'SELECT * FROM devices WHERE enabled = 1'
      );

      for (const device of devices) {
        // 确保设备已连接
        if (!deviceManager.isDeviceConnected(device.id)) {
          try {
            await deviceManager.connectDevice(device);
          } catch (error) {
            logger.error(`Failed to connect device ${device.name}:`, error);
            continue;
          }
        }

        // 获取设备的所有数据点
        const dataPoints = await database.all(
          'SELECT * FROM data_points WHERE device_id = ? AND enabled = 1',
          [device.id]
        );

        // 读取每个数据点
        for (const dataPoint of dataPoints) {
          try {
            const result = await deviceManager.readDataPoint(device.id, dataPoint);

            // 存储历史数据
            await this.saveHistoryData(dataPoint.id, result);

            // 检查报警
            await this.checkAlarm(dataPoint, result.value);

            // 发送实时数据事件
            this.emit('data', {
              deviceId: device.id,
              deviceName: device.name,
              dataPointId: dataPoint.id,
              dataPointName: dataPoint.name,
              ...result
            });

          } catch (error) {
            logger.error(`Failed to collect data for ${dataPoint.name}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Data collection error:', error);
    }
  }

  async saveHistoryData(dataPointId, result) {
    try {
      await database.run(
        'INSERT INTO history_data (data_point_id, value, quality, timestamp) VALUES (?, ?, ?, ?)',
        [dataPointId, result.value, result.quality, result.timestamp]
      );

      // 清理旧数据
      await this.cleanOldData();
    } catch (error) {
      logger.error('Save history data error:', error);
    }
  }

  async checkAlarm(dataPoint, value) {
    if (!dataPoint.alarm_enabled || value === null) {
      return;
    }

    let alarmType = null;
    let threshold = null;

    if (dataPoint.alarm_high !== null && value > dataPoint.alarm_high) {
      alarmType = 'HIGH';
      threshold = dataPoint.alarm_high;
    } else if (dataPoint.alarm_low !== null && value < dataPoint.alarm_low) {
      alarmType = 'LOW';
      threshold = dataPoint.alarm_low;
    }

    if (alarmType) {
      // 检查是否已存在活跃报警
      const existingAlarm = await database.get(
        'SELECT * FROM alarms WHERE data_point_id = ? AND status = "active" AND alarm_type = ?',
        [dataPoint.id, alarmType]
      );

      if (!existingAlarm) {
        const message = `${dataPoint.name} ${alarmType === 'HIGH' ? '超过上限' : '低于下限'}: ${value} (阈值: ${threshold})`;

        await database.run(
          `INSERT INTO alarms (data_point_id, alarm_type, alarm_level, value, threshold, message, status)
           VALUES (?, ?, ?, ?, ?, ?, 'active')`,
          [dataPoint.id, alarmType, 'WARNING', value, threshold, message]
        );

        // 发送报警事件
        this.emit('alarm', {
          dataPointId: dataPoint.id,
          dataPointName: dataPoint.name,
          alarmType,
          value,
          threshold,
          message
        });

        logger.warn(`Alarm triggered: ${message}`);
      }
    } else {
      // 值正常,清除之前的报警
      await database.run(
        'UPDATE alarms SET status = "cleared" WHERE data_point_id = ? AND status = "active"',
        [dataPoint.id]
      );
    }
  }

  async cleanOldData() {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - config.history.retentionDays);

      const result = await database.run(
        'DELETE FROM history_data WHERE timestamp < ?',
        [retentionDate.toISOString()]
      );

      if (result.changes > 0) {
        logger.info(`Cleaned ${result.changes} old history records`);
      }
    } catch (error) {
      logger.error('Clean old data error:', error);
    }
  }
}

module.exports = new DataCollector();
