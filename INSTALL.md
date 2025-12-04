# 安装指南

## 快速安装

### 后端安装

```bash
cd backend
npm install
```

## 可选依赖说明

系统中某些协议需要额外的原生模块，这些模块被设置为**可选依赖**，安装失败不会影响其他功能。

### 1. node-snap7 (西门子 S7 协议)

**用途**: 连接西门子 PLC

**安装要求**:
- Linux/Mac: 需要编译工具
- Windows: 需要 Visual Studio 或 windows-build-tools

**如果安装失败**:
- ✅ Modbus TCP/RTU/ASCII 协议仍然可用
- ✅ 欧姆龙 FINS TCP 协议仍然可用
- ❌ 西门子 S7 协议不可用

**手动安装**:
```bash
# Windows (需要管理员权限)
npm install --global windows-build-tools

# 然后重新安装
npm install node-snap7
```

### 2. serialport (串口通讯)

**用途**: 串口通讯 (RS232/RS485)

**安装要求**:
- 需要编译工具
- Windows 上可能需要额外配置

**如果安装失败**:
- ✅ 所有 TCP 协议仍然可用 (Modbus TCP, S7, FINS TCP)
- ❌ 串口通讯不可用 (Modbus RTU/ASCII, FINS Serial)

**手动安装**:
```bash
npm install serialport
```

## 完整安装（包含所有可选依赖）

### Windows

1. 安装 Visual Studio Build Tools 或完整的 Visual Studio
2. 或者安装 windows-build-tools:
```bash
npm install --global windows-build-tools
```

3. 安装项目依赖:
```bash
cd backend
npm install
```

### Linux (Ubuntu/Debian)

```bash
# 安装编译工具
sudo apt-get update
sudo apt-get install build-essential

# 安装串口权限
sudo usermod -a -G dialout $USER

# 安装项目依赖
cd backend
npm install
```

### macOS

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装项目依赖
cd backend
npm install
```

## 验证安装

启动后端服务器，查看日志：

```bash
cd backend
npm run dev
```

**成功的日志**:
```
[info] Database initialized
[info] Data collector started
[info] HTTP server listening on port 3000
[info] WebSocket server started on port 3001
```

**如果有可选依赖未安装**:
```
[warn] node-snap7 not available. Siemens S7 protocol will not work.
[warn] serialport not available. Serial communication will not work.
```

这些警告不影响其他协议的使用。

## 故障排除

### node-snap7 安装失败

**错误**: `npm error code 1` 或 `node-gyp rebuild failed`

**解决方案**:
1. 确保安装了编译工具 (上面的说明)
2. 如果只使用 Modbus 和 FINS，可以忽略此错误
3. 如果需要 S7 协议，参考 [node-snap7 文档](https://github.com/mathiask88/node-snap7)

### serialport 安装失败

**错误**: `prebuild-install failed`

**解决方案**:
1. Windows: 安装 windows-build-tools
2. Linux: 安装 build-essential
3. macOS: 安装 Xcode Command Line Tools
4. 如果只使用 TCP 协议，可以忽略此错误

### SQLite3 安装失败

**错误**: SQLite3 编译失败

**解决方案**:
```bash
npm install sqlite3 --build-from-source
```

## 最小化安装（仅 Modbus TCP）

如果只需要 Modbus TCP 功能，可以跳过可选依赖：

```bash
cd backend
npm install --no-optional
```

这样只会安装核心依赖，不会尝试安装 node-snap7 和 serialport。

## 生产环境部署

### Docker 部署（推荐）

使用 Docker 可以避免依赖安装问题：

```bash
docker-compose up -d
```

Docker 镜像中已经包含了所有必需的编译工具和依赖。

### 手动部署

```bash
# 设置环境变量
cp backend/.env.example backend/.env

# 编辑配置
nano backend/.env

# 安装依赖
cd backend
npm install --production

# 启动服务
npm start
```

## 前端安装

前端没有原生依赖，安装简单：

```bash
cd frontend
npm install
npm run dev    # 开发模式
npm run build  # 生产构建
```

## 常见问题

**Q: 为什么某些依赖安装失败但程序仍能运行？**
A: node-snap7 和 serialport 被设置为可选依赖。如果不使用相应协议，安装失败不影响其他功能。

**Q: 如何知道哪些协议可用？**
A: 启动服务器时查看日志，有警告的协议不可用。

**Q: 可以只安装 Modbus 吗？**
A: 可以，使用 `npm install --no-optional` 跳过可选依赖。

**Q: 生产环境推荐什么部署方式？**
A: 推荐使用 Docker，避免依赖问题。

## 技术支持

如果遇到安装问题，请检查：
1. Node.js 版本 >= 14.0.0
2. npm 版本 >= 6.0.0
3. 操作系统编译工具是否安装
4. 查看完整错误日志

更多问题请查看项目 README.md 或提交 Issue。
