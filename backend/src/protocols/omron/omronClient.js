const net = require('net');
const { SerialPort } = require('serialport');
const logger = require('../../utils/logger');

class OmronClient {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.connected = false;
    this.type = config.type; // 'tcp' or 'serial'
    this.responseBuffer = Buffer.alloc(0);
  }

  async connect() {
    try {
      if (this.type === 'tcp') {
        await this.connectTCP();
      } else if (this.type === 'serial') {
        await this.connectSerial();
      }
      this.connected = true;
      logger.info(`Omron ${this.type} connected successfully`);
      return true;
    } catch (error) {
      logger.error(`Omron ${this.type} connection error:`, error);
      this.connected = false;
      throw error;
    }
  }

  async connectTCP() {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket();

      this.client.connect(this.config.port || 9600, this.config.host, () => {
        resolve();
      });

      this.client.on('error', (err) => {
        reject(err);
      });

      this.client.on('data', (data) => {
        this.responseBuffer = Buffer.concat([this.responseBuffer, data]);
      });
    });
  }

  async connectSerial() {
    return new Promise((resolve, reject) => {
      this.client = new SerialPort({
        path: this.config.serialPort,
        baudRate: this.config.baudRate || 9600,
        dataBits: this.config.dataBits || 7,
        stopBits: this.config.stopBits || 2,
        parity: this.config.parity || 'even'
      });

      this.client.on('open', () => {
        resolve();
      });

      this.client.on('error', (err) => {
        reject(err);
      });

      this.client.on('data', (data) => {
        this.responseBuffer = Buffer.concat([this.responseBuffer, data]);
      });
    });
  }

  async disconnect() {
    if (this.client && this.connected) {
      if (this.type === 'tcp') {
        this.client.destroy();
      } else {
        await this.client.close();
      }
      this.connected = false;
      logger.info(`Omron ${this.type} disconnected`);
    }
  }

  buildFinsCommand(memoryArea, address, count, isRead = true) {
    // FINS (Factory Interface Network Service) Protocol
    const cmd = Buffer.alloc(34);

    // FINS Header
    cmd[0] = 0x46; // 'F'
    cmd[1] = 0x49; // 'I'
    cmd[2] = 0x4E; // 'N'
    cmd[3] = 0x53; // 'S'

    // Command code
    if (isRead) {
      cmd[10] = 0x01; // Memory area read
      cmd[11] = 0x01;
    } else {
      cmd[10] = 0x01; // Memory area write
      cmd[11] = 0x02;
    }

    // Memory area code
    cmd[12] = this.getMemoryAreaCode(memoryArea);

    // Starting address
    cmd.writeUInt16BE(address, 13);

    // Number of items
    cmd.writeUInt16BE(count, 15);

    return cmd;
  }

  getMemoryAreaCode(memoryArea) {
    const codes = {
      'CIO': 0xB0,  // CIO Area
      'WR': 0xB1,   // Work Area
      'HR': 0xB2,   // Holding Area
      'AR': 0xB3,   // Auxiliary Area
      'DM': 0x82,   // Data Memory
      'EM': 0xA0    // Extended Memory
    };
    return codes[memoryArea] || 0x82;
  }

  async readMemoryArea(memoryArea, address, count) {
    if (!this.connected) {
      throw new Error('Omron client not connected');
    }

    try {
      const command = this.buildFinsCommand(memoryArea, address, count, true);
      this.responseBuffer = Buffer.alloc(0);

      await this.sendCommand(command);
      await this.waitForResponse(2000);

      return this.parseResponse(this.responseBuffer);
    } catch (error) {
      logger.error(`Read memory area error:`, error);
      throw error;
    }
  }

  async writeMemoryArea(memoryArea, address, data) {
    if (!this.connected) {
      throw new Error('Omron client not connected');
    }

    try {
      const command = this.buildFinsCommand(memoryArea, address, data.length, false);
      const dataBuffer = Buffer.from(data);
      const fullCommand = Buffer.concat([command, dataBuffer]);

      this.responseBuffer = Buffer.alloc(0);
      await this.sendCommand(fullCommand);
      await this.waitForResponse(2000);

      return true;
    } catch (error) {
      logger.error(`Write memory area error:`, error);
      throw error;
    }
  }

  sendCommand(command) {
    return new Promise((resolve, reject) => {
      if (this.type === 'tcp') {
        this.client.write(command, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        this.client.write(command, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  }

  waitForResponse(timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Response timeout'));
      }, timeout);

      const checkResponse = setInterval(() => {
        if (this.responseBuffer.length > 0) {
          clearInterval(checkResponse);
          clearTimeout(timer);
          resolve();
        }
      }, 50);
    });
  }

  parseResponse(buffer) {
    if (buffer.length < 14) {
      throw new Error('Invalid response');
    }

    const dataStart = 14;
    const data = [];

    for (let i = dataStart; i < buffer.length; i += 2) {
      if (i + 1 < buffer.length) {
        data.push(buffer.readUInt16BE(i));
      }
    }

    return data;
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = OmronClient;
