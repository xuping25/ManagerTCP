const ModbusClient = require('../protocols/modbus/modbusClient');
const SiemensClient = require('../protocols/siemens/siemensClient');
const OmronClient = require('../protocols/omron/omronClient');
const logger = require('../utils/logger');

class DeviceManager {
  constructor() {
    this.devices = new Map();
    this.connections = new Map();
  }

  createClient(device) {
    const protocol = device.protocol.toLowerCase();
    const config = {
      type: device.connection_type,
      host: device.host,
      port: device.port,
      serialPort: device.serial_port,
      baudRate: device.baud_rate,
      dataBits: device.data_bits,
      stopBits: device.stop_bits,
      parity: device.parity,
      slaveId: device.slave_id,
      rack: device.rack,
      slot: device.slot,
      timeout: device.timeout || 3000
    };

    switch (protocol) {
      case 'modbus_tcp':
      case 'modbus_rtu':
      case 'modbus_ascii':
        config.type = protocol.replace('modbus_', '');
        return new ModbusClient(config);

      case 'siemens':
      case 's7':
        return new SiemensClient(config);

      case 'omron':
      case 'fins':
        return new OmronClient(config);

      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }

  async connectDevice(device) {
    try {
      if (this.connections.has(device.id)) {
        logger.warn(`Device ${device.name} already connected`);
        return this.connections.get(device.id);
      }

      const client = this.createClient(device);
      await client.connect();

      this.devices.set(device.id, device);
      this.connections.set(device.id, client);

      logger.info(`Device ${device.name} connected successfully`);
      return client;
    } catch (error) {
      logger.error(`Failed to connect device ${device.name}:`, error);
      throw error;
    }
  }

  async disconnectDevice(deviceId) {
    try {
      const client = this.connections.get(deviceId);
      if (client) {
        await client.disconnect();
        this.connections.delete(deviceId);
        this.devices.delete(deviceId);
        logger.info(`Device ${deviceId} disconnected`);
      }
    } catch (error) {
      logger.error(`Failed to disconnect device ${deviceId}:`, error);
      throw error;
    }
  }

  async readDataPoint(deviceId, dataPoint) {
    const client = this.connections.get(deviceId);
    const device = this.devices.get(deviceId);

    if (!client || !client.isConnected()) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    try {
      let rawValue;
      const protocol = device.protocol.toLowerCase();

      if (protocol.startsWith('modbus')) {
        rawValue = await this.readModbusPoint(client, dataPoint);
      } else if (protocol === 'siemens' || protocol === 's7') {
        rawValue = await this.readSiemensPoint(client, dataPoint);
      } else if (protocol === 'omron' || protocol === 'fins') {
        rawValue = await this.readOmronPoint(client, dataPoint);
      }

      // 应用缩放和偏移
      const value = rawValue * (dataPoint.scale || 1.0) + (dataPoint.offset || 0.0);

      return {
        value,
        quality: 1,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to read data point ${dataPoint.name}:`, error);
      return {
        value: null,
        quality: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  async readModbusPoint(client, dataPoint) {
    const address = parseInt(dataPoint.address);
    const dataType = dataPoint.data_type.toLowerCase();

    let data;
    if (dataType.includes('coil')) {
      data = await client.readCoils(address, 1);
      return data[0] ? 1 : 0;
    } else if (dataType.includes('discrete')) {
      data = await client.readDiscreteInputs(address, 1);
      return data[0] ? 1 : 0;
    } else if (dataType.includes('input')) {
      data = await client.readInputRegisters(address, dataType === 'dword' ? 2 : 1);
    } else {
      data = await client.readHoldingRegisters(address, dataType === 'dword' ? 2 : 1);
    }

    return this.parseModbusValue(data, dataType);
  }

  parseModbusValue(data, dataType) {
    const buffer = Buffer.alloc(data.length * 2);
    data.forEach((val, idx) => {
      buffer.writeUInt16BE(val, idx * 2);
    });

    switch (dataType.toLowerCase()) {
      case 'int16':
        return buffer.readInt16BE(0);
      case 'uint16':
        return buffer.readUInt16BE(0);
      case 'int32':
      case 'dword':
        return buffer.readInt32BE(0);
      case 'uint32':
        return buffer.readUInt32BE(0);
      case 'float':
        return buffer.readFloatBE(0);
      default:
        return data[0];
    }
  }

  async readSiemensPoint(client, dataPoint) {
    const parts = dataPoint.address.split('.');
    const dbNumber = parseInt(parts[0].replace('DB', ''));
    const offset = parseInt(parts[1]);

    const size = this.getSiemensDataSize(dataPoint.data_type);
    const buffer = await client.readDB(dbNumber, offset, size);

    return client.parseValue(buffer, 0, dataPoint.data_type);
  }

  getSiemensDataSize(dataType) {
    const sizes = {
      'BOOL': 1,
      'BYTE': 1,
      'INT': 2,
      'WORD': 2,
      'DINT': 4,
      'DWORD': 4,
      'REAL': 4
    };
    return sizes[dataType] || 2;
  }

  async readOmronPoint(client, dataPoint) {
    const parts = dataPoint.address.split(/(\d+)/);
    const memoryArea = parts[0];
    const address = parseInt(parts[1]);

    const data = await client.readMemoryArea(memoryArea, address, 1);
    return data[0];
  }

  async writeDataPoint(deviceId, dataPoint, value) {
    const client = this.connections.get(deviceId);
    const device = this.devices.get(deviceId);

    if (!client || !client.isConnected()) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    try {
      const protocol = device.protocol.toLowerCase();

      if (protocol.startsWith('modbus')) {
        await this.writeModbusPoint(client, dataPoint, value);
      } else if (protocol === 'siemens' || protocol === 's7') {
        await this.writeSiemensPoint(client, dataPoint, value);
      } else if (protocol === 'omron' || protocol === 'fins') {
        await this.writeOmronPoint(client, dataPoint, value);
      }

      return true;
    } catch (error) {
      logger.error(`Failed to write data point ${dataPoint.name}:`, error);
      throw error;
    }
  }

  async writeModbusPoint(client, dataPoint, value) {
    const address = parseInt(dataPoint.address);
    const dataType = dataPoint.data_type.toLowerCase();

    if (dataType.includes('coil')) {
      await client.writeCoil(address, value !== 0);
    } else {
      await client.writeRegister(address, value);
    }
  }

  async writeSiemensPoint(client, dataPoint, value) {
    const parts = dataPoint.address.split('.');
    const dbNumber = parseInt(parts[0].replace('DB', ''));
    const offset = parseInt(parts[1]);

    const buffer = Buffer.alloc(this.getSiemensDataSize(dataPoint.data_type));

    switch (dataPoint.data_type) {
      case 'INT':
        buffer.writeInt16BE(value, 0);
        break;
      case 'DINT':
        buffer.writeInt32BE(value, 0);
        break;
      case 'REAL':
        buffer.writeFloatBE(value, 0);
        break;
      default:
        buffer.writeUInt16BE(value, 0);
    }

    await client.writeDB(dbNumber, offset, buffer);
  }

  async writeOmronPoint(client, dataPoint, value) {
    const parts = dataPoint.address.split(/(\d+)/);
    const memoryArea = parts[0];
    const address = parseInt(parts[1]);

    await client.writeMemoryArea(memoryArea, address, [value]);
  }

  getConnection(deviceId) {
    return this.connections.get(deviceId);
  }

  isDeviceConnected(deviceId) {
    const client = this.connections.get(deviceId);
    return client && client.isConnected();
  }

  async disconnectAll() {
    const promises = [];
    for (const [deviceId] of this.connections) {
      promises.push(this.disconnectDevice(deviceId));
    }
    await Promise.all(promises);
  }
}

module.exports = new DeviceManager();
