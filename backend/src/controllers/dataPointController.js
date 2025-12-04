const database = require('../models/database');
const deviceManager = require('../services/deviceManager');
const logger = require('../utils/logger');

class DataPointController {
  async getDataPoints(req, res) {
    try {
      const { deviceId } = req.params;

      const dataPoints = await database.all(
        'SELECT * FROM data_points WHERE device_id = ? ORDER BY created_at DESC',
        [deviceId]
      );

      res.json({
        success: true,
        data: dataPoints
      });
    } catch (error) {
      logger.error('Get data points error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createDataPoint(req, res) {
    try {
      const { deviceId } = req.params;
      const dataPoint = req.body;

      const result = await database.run(
        `INSERT INTO data_points (device_id, name, address, data_type, unit, scale, offset,
         description, enabled, alarm_enabled, alarm_high, alarm_low)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deviceId,
          dataPoint.name,
          dataPoint.address,
          dataPoint.data_type,
          dataPoint.unit,
          dataPoint.scale || 1.0,
          dataPoint.offset || 0.0,
          dataPoint.description,
          dataPoint.enabled !== undefined ? dataPoint.enabled : 1,
          dataPoint.alarm_enabled || 0,
          dataPoint.alarm_high,
          dataPoint.alarm_low
        ]
      );

      res.json({
        success: true,
        data: { id: result.id },
        message: 'Data point created successfully'
      });
    } catch (error) {
      logger.error('Create data point error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateDataPoint(req, res) {
    try {
      const { id } = req.params;
      const dataPoint = req.body;

      await database.run(
        `UPDATE data_points SET name = ?, address = ?, data_type = ?, unit = ?,
         scale = ?, offset = ?, description = ?, enabled = ?, alarm_enabled = ?,
         alarm_high = ?, alarm_low = ? WHERE id = ?`,
        [
          dataPoint.name,
          dataPoint.address,
          dataPoint.data_type,
          dataPoint.unit,
          dataPoint.scale,
          dataPoint.offset,
          dataPoint.description,
          dataPoint.enabled,
          dataPoint.alarm_enabled,
          dataPoint.alarm_high,
          dataPoint.alarm_low,
          id
        ]
      );

      res.json({
        success: true,
        message: 'Data point updated successfully'
      });
    } catch (error) {
      logger.error('Update data point error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteDataPoint(req, res) {
    try {
      const { id } = req.params;

      await database.run('DELETE FROM data_points WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Data point deleted successfully'
      });
    } catch (error) {
      logger.error('Delete data point error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async readDataPoint(req, res) {
    try {
      const { id } = req.params;

      const dataPoint = await database.get('SELECT * FROM data_points WHERE id = ?', [id]);

      if (!dataPoint) {
        return res.status(404).json({
          success: false,
          message: 'Data point not found'
        });
      }

      const result = await deviceManager.readDataPoint(dataPoint.device_id, dataPoint);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Read data point error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async writeDataPoint(req, res) {
    try {
      const { id } = req.params;
      const { value } = req.body;

      const dataPoint = await database.get('SELECT * FROM data_points WHERE id = ?', [id]);

      if (!dataPoint) {
        return res.status(404).json({
          success: false,
          message: 'Data point not found'
        });
      }

      await deviceManager.writeDataPoint(dataPoint.device_id, dataPoint, value);

      res.json({
        success: true,
        message: 'Value written successfully'
      });
    } catch (error) {
      logger.error('Write data point error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DataPointController();
