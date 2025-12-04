const database = require('../models/database');
const logger = require('../utils/logger');

class AlarmController {
  async getAlarms(req, res) {
    try {
      const { status, startTime, endTime, limit = 100 } = req.query;

      let sql = `
        SELECT
          a.*,
          dp.name as data_point_name,
          d.name as device_name
        FROM alarms a
        JOIN data_points dp ON a.data_point_id = dp.id
        JOIN devices d ON dp.device_id = d.id
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
      }

      if (startTime) {
        sql += ' AND a.created_at >= ?';
        params.push(startTime);
      }

      if (endTime) {
        sql += ' AND a.created_at <= ?';
        params.push(endTime);
      }

      sql += ' ORDER BY a.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const alarms = await database.all(sql, params);

      res.json({
        success: true,
        data: alarms
      });
    } catch (error) {
      logger.error('Get alarms error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async acknowledgeAlarm(req, res) {
    try {
      const { id } = req.params;
      const { user } = req.body;

      await database.run(
        'UPDATE alarms SET status = ?, ack_time = ?, ack_user = ? WHERE id = ?',
        ['acknowledged', new Date().toISOString(), user || 'system', id]
      );

      res.json({
        success: true,
        message: 'Alarm acknowledged'
      });
    } catch (error) {
      logger.error('Acknowledge alarm error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAlarmStatistics(req, res) {
    try {
      const { startTime, endTime } = req.query;

      let sql = `
        SELECT
          status,
          alarm_level,
          COUNT(*) as count
        FROM alarms
        WHERE 1=1
      `;

      const params = [];

      if (startTime) {
        sql += ' AND created_at >= ?';
        params.push(startTime);
      }

      if (endTime) {
        sql += ' AND created_at <= ?';
        params.push(endTime);
      }

      sql += ' GROUP BY status, alarm_level';

      const stats = await database.all(sql, params);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get alarm statistics error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AlarmController();
