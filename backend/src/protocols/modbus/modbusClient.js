const ModbusRTU = require('modbus-serial');
const logger = require('../../utils/logger');

class ModbusClient {
  constructor(config) {
    this.config = config;
    this.client = new ModbusRTU();
    this.connected = false;
    this.type = config.type; // 'tcp', 'rtu', 'ascii'
  }

  async connect() {
    try {
      switch (this.type) {
        case 'tcp':
          await this.client.connectTCP(this.config.host, {
            port: this.config.port || 502
          });
          break;

        case 'rtu':
          await this.client.connectRTUBuffered(this.config.serialPort, {
            baudRate: this.config.baudRate || 9600,
            dataBits: this.config.dataBits || 8,
            stopBits: this.config.stopBits || 1,
            parity: this.config.parity || 'none'
          });
          break;

        case 'ascii':
          await this.client.connectAsciiSerial(this.config.serialPort, {
            baudRate: this.config.baudRate || 9600,
            dataBits: this.config.dataBits || 8,
            stopBits: this.config.stopBits || 1,
            parity: this.config.parity || 'none'
          });
          break;

        default:
          throw new Error(`Unsupported Modbus type: ${this.type}`);
      }

      this.client.setID(this.config.slaveId || 1);
      this.client.setTimeout(this.config.timeout || 3000);
      this.connected = true;
      logger.info(`Modbus ${this.type} connected successfully`);
      return true;
    } catch (error) {
      logger.error(`Modbus ${this.type} connection error:`, error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.connected) {
      await this.client.close();
      this.connected = false;
      logger.info(`Modbus ${this.type} disconnected`);
    }
  }

  async readHoldingRegisters(address, length) {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }
    try {
      const result = await this.client.readHoldingRegisters(address, length);
      return result.data;
    } catch (error) {
      logger.error(`Read holding registers error:`, error);
      throw error;
    }
  }

  async readInputRegisters(address, length) {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }
    try {
      const result = await this.client.readInputRegisters(address, length);
      return result.data;
    } catch (error) {
      logger.error(`Read input registers error:`, error);
      throw error;
    }
  }

  async readCoils(address, length) {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }
    try {
      const result = await this.client.readCoils(address, length);
      return result.data;
    } catch (error) {
      logger.error(`Read coils error:`, error);
      throw error;
    }
  }

  async readDiscreteInputs(address, length) {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }
    try {
      const result = await this.client.readDiscreteInputs(address, length);
      return result.data;
    } catch (error) {
      logger.error(`Read discrete inputs error:`, error);
      throw error;
    }
  }

  async writeRegister(address, value) {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }
    try {
      await this.client.writeRegister(address, value);
      return true;
    } catch (error) {
      logger.error(`Write register error:`, error);
      throw error;
    }
  }

  async writeCoil(address, value) {
    if (!this.connected) {
      throw new Error('Modbus client not connected');
    }
    try {
      await this.client.writeCoil(address, value);
      return true;
    } catch (error) {
      logger.error(`Write coil error:`, error);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = ModbusClient;
