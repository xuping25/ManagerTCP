const database = require('../models/database');
const logger = require('../utils/logger');

class HistoryController {
  async getHistoryData(req, res) {
    try {
      const { dataPointId } = req.params;
      const { startTime, endTime, limit = 1000 } = req.query;

      let sql = 'SELECT * FROM history_data WHERE data_point_id = ?';
      const params = [dataPointId];

      if (startTime) {
        sql += ' AND timestamp >= ?';
        params.push(startTime);
      }

      if (endTime) {
        sql += ' AND timestamp <= ?';
        params.push(endTime);
      }

      sql += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(parseInt(limit));

      const data = await database.all(sql, params);

      res.json({
        success: true,
        data: data.reverse()
      });
    } catch (error) {
      logger.error('Get history data error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAggregatedData(req, res) {
    try {
      const { dataPointId } = req.params;
      const { startTime, endTime, interval = '1h' } = req.query;

      // 简单的聚合实现
      let sql = `
        SELECT
          AVG(value) as avg_value,
          MIN(value) as min_value,
          MAX(value) as max_value,
          COUNT(*) as count,
          datetime((strftime('%s', timestamp) / 3600) * 3600, 'unixepoch') as time_bucket
        FROM history_data
        WHERE data_point_id = ?
      `;

      const params = [dataPointId];

      if (startTime) {
        sql += ' AND timestamp >= ?';
        params.push(startTime);
      }

      if (endTime) {
        sql += ' AND timestamp <= ?';
        params.push(endTime);
      }

      sql += ' GROUP BY time_bucket ORDER BY time_bucket ASC';

      const data = await database.all(sql, params);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Get aggregated data error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportHistoryData(req, res) {
    try {
      const { dataPointIds, startTime, endTime } = req.body;

      let sql = `
        SELECT
          dp.name as data_point_name,
          d.name as device_name,
          h.value,
          h.quality,
          h.timestamp
        FROM history_data h
        JOIN data_points dp ON h.data_point_id = dp.id
        JOIN devices d ON dp.device_id = d.id
        WHERE 1=1
      `;

      const params = [];

      if (dataPointIds && dataPointIds.length > 0) {
        sql += ` AND h.data_point_id IN (${dataPointIds.map(() => '?').join(',')})`;
        params.push(...dataPointIds);
      }

      if (startTime) {
        sql += ' AND h.timestamp >= ?';
        params.push(startTime);
      }

      if (endTime) {
        sql += ' AND h.timestamp <= ?';
        params.push(endTime);
      }

      sql += ' ORDER BY h.timestamp ASC';

      const data = await database.all(sql, params);

      // 转换为CSV格式
      let csv = 'Device,Data Point,Value,Quality,Timestamp\n';
      data.forEach(row => {
        csv += `${row.device_name},${row.data_point_name},${row.value},${row.quality},${row.timestamp}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=history_data.csv');
      res.send(csv);

    } catch (error) {
      logger.error('Export history data error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new HistoryController();
