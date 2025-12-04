const database = require('../models/database');
const deviceManager = require('../services/deviceManager');
const logger = require('../utils/logger');

class DeviceController {
  async getAllDevices(req, res) {
    try {
      const devices = await database.all('SELECT * FROM devices ORDER BY created_at DESC');

      // 添加连接状态
      const devicesWithStatus = devices.map(device => ({
        ...device,
        connected: deviceManager.isDeviceConnected(device.id)
      }));

      res.json({
        success: true,
        data: devicesWithStatus
      });
    } catch (error) {
      logger.error('Get all devices error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDevice(req, res) {
    try {
      const { id } = req.params;
      const device = await database.get('SELECT * FROM devices WHERE id = ?', [id]);

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      device.connected = deviceManager.isDeviceConnected(device.id);

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('Get device error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createDevice(req, res) {
    try {
      const device = req.body;

      const result = await database.run(
        `INSERT INTO devices (name, type, protocol, connection_type, host, port, serial_port,
         baud_rate, data_bits, stop_bits, parity, slave_id, rack, slot, timeout, enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          device.name,
          device.type,
          device.protocol,
          device.connection_type,
          device.host,
          device.port,
          device.serial_port,
          device.baud_rate,
          device.data_bits,
          device.stop_bits,
          device.parity,
          device.slave_id,
          device.rack,
          device.slot,
          device.timeout,
          device.enabled !== undefined ? device.enabled : 1
        ]
      );

      res.json({
        success: true,
        data: { id: result.id },
        message: 'Device created successfully'
      });
    } catch (error) {
      logger.error('Create device error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const device = req.body;

      // 如果设备已连接,先断开
      if (deviceManager.isDeviceConnected(id)) {
        await deviceManager.disconnectDevice(parseInt(id));
      }

      await database.run(
        `UPDATE devices SET name = ?, type = ?, protocol = ?, connection_type = ?,
         host = ?, port = ?, serial_port = ?, baud_rate = ?, data_bits = ?,
         stop_bits = ?, parity = ?, slave_id = ?, rack = ?, slot = ?,
         timeout = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          device.name,
          device.type,
          device.protocol,
          device.connection_type,
          device.host,
          device.port,
          device.serial_port,
          device.baud_rate,
          device.data_bits,
          device.stop_bits,
          device.parity,
          device.slave_id,
          device.rack,
          device.slot,
          device.timeout,
          device.enabled,
          id
        ]
      );

      res.json({
        success: true,
        message: 'Device updated successfully'
      });
    } catch (error) {
      logger.error('Update device error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteDevice(req, res) {
    try {
      const { id } = req.params;

      // 断开连接
      if (deviceManager.isDeviceConnected(id)) {
        await deviceManager.disconnectDevice(parseInt(id));
      }

      await database.run('DELETE FROM devices WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      logger.error('Delete device error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async testConnection(req, res) {
    try {
      const device = req.body;

      // 创建临时设备对象
      const tempDevice = {
        id: 'temp_' + Date.now(),
        ...device
      };

      const client = deviceManager.createClient(tempDevice);
      await client.connect();
      await client.disconnect();

      res.json({
        success: true,
        message: 'Connection test successful'
      });
    } catch (error) {
      logger.error('Test connection error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DeviceController();
