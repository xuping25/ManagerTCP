const logger = require('../../utils/logger');

let snap7;
try {
  snap7 = require('node-snap7');
} catch (err) {
  logger.warn('node-snap7 not available. Siemens S7 protocol will not work.');
}

class SiemensClient {
  constructor(config) {
    this.config = config;
    if (!snap7) {
      throw new Error('node-snap7 module not installed. Please install it to use Siemens S7 protocol.');
    }
    this.client = new snap7.S7Client();
    this.connected = false;
  }

  async connect() {
    try {
      const result = await new Promise((resolve, reject) => {
        this.client.ConnectTo(
          this.config.host,
          this.config.rack || 0,
          this.config.slot || 1,
          (err) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });

      this.connected = true;
      logger.info(`Siemens S7 connected to ${this.config.host}`);
      return result;
    } catch (error) {
      logger.error(`Siemens S7 connection error:`, error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.connected) {
      await new Promise((resolve) => {
        this.client.Disconnect();
        resolve();
      });
      this.connected = false;
      logger.info('Siemens S7 disconnected');
    }
  }

  async readDB(dbNumber, start, size) {
    if (!this.connected) {
      throw new Error('Siemens S7 client not connected');
    }

    try {
      const buffer = Buffer.alloc(size);
      await new Promise((resolve, reject) => {
        this.client.DBRead(dbNumber, start, size, buffer, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      return buffer;
    } catch (error) {
      logger.error(`Read DB error:`, error);
      throw error;
    }
  }

  async writeDB(dbNumber, start, buffer) {
    if (!this.connected) {
      throw new Error('Siemens S7 client not connected');
    }

    try {
      await new Promise((resolve, reject) => {
        this.client.DBWrite(dbNumber, start, buffer.length, buffer, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      return true;
    } catch (error) {
      logger.error(`Write DB error:`, error);
      throw error;
    }
  }

  async readArea(area, dbNumber, start, amount, wordLen) {
    if (!this.connected) {
      throw new Error('Siemens S7 client not connected');
    }

    try {
      const buffer = Buffer.alloc(amount);
      await new Promise((resolve, reject) => {
        this.client.ReadArea(area, dbNumber, start, amount, wordLen, buffer, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      return buffer;
    } catch (error) {
      logger.error(`Read area error:`, error);
      throw error;
    }
  }

  parseValue(buffer, offset, dataType) {
    switch (dataType) {
      case 'BOOL':
        return (buffer[offset] & 0x01) === 1;
      case 'BYTE':
        return buffer.readUInt8(offset);
      case 'INT':
        return buffer.readInt16BE(offset);
      case 'DINT':
        return buffer.readInt32BE(offset);
      case 'REAL':
        return buffer.readFloatBE(offset);
      case 'WORD':
        return buffer.readUInt16BE(offset);
      case 'DWORD':
        return buffer.readUInt32BE(offset);
      default:
        return buffer[offset];
    }
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = SiemensClient;
