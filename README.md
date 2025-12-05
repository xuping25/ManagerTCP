# Manager UA - 工业设备管理系统

一个基于 Node.js + Vue.js 的工业设备管理系统，支持多种工业协议和通讯方式。

## 功能特性

### 支持的协议
- **Modbus TCP** - 基于TCP/IP的Modbus协议
- **Modbus RTU** - 基于串口的Modbus RTU协议
- **Modbus ASCII** - 基于串口的Modbus ASCII协议
- **西门子 S7** - 西门子PLC通讯协议
- **欧姆龙 FINS** - 欧姆龙PLC通讯协议

### 通讯方式
- **TCP/IP** - 以太网通讯
- **串口** - RS232/RS485串口通讯

### 核心功能
1. **设备管理** - 设备配置、连接管理、数据点配置
2. **实时监控** - 实时数据展示、设备状态监控
3. **报警管理** - 报警配置、报警记录、报警统计
4. **历史数据** - 数据查询、趋势分析、数据导出
5. **自定义仪表板** - 拖拽式布局、组件化展示
6. **多语言支持** - 简体中文、English、繁體中文三语言切换

## 技术架构

### 后端
- **框架**: Express.js
- **数据库**: SQLite
- **协议库**:
  - modbus-serial - Modbus协议支持
  - node-snap7 - 西门子S7协议支持
  - serialport - 串口通讯支持
- **实时通讯**: WebSocket

### 前端
- **框架**: Vue 3 + Vite
- **UI组件**: Element Plus
- **图表**: ECharts
- **状态管理**: Pinia
- **拖拽布局**: vue-grid-layout
- **国际化**: Vue I18n (简体中文/English/繁體中文)

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 配置

复制后端配置文件并修改：
```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，配置相关参数：
```env
PORT=3000
WS_PORT=3001
DB_PATH=./data/manager_ua.db
LOG_LEVEL=info
DATA_COLLECTION_INTERVAL=5000
HISTORY_RETENTION_DAYS=90
```

### 运行

#### 开发模式

**启动后端**:
```bash
cd backend
npm run dev
```

**启动前端**:
```bash
cd frontend
npm run dev
```

访问 `http://localhost:8080` 即可使用系统。

#### 生产模式

**构建前端**:
```bash
cd frontend
npm run build
```

**启动后端**:
```bash
cd backend
npm start
```

## 项目结构

```
ManagerTCP/
├── backend/                    # 后端目录
│   ├── src/
│   │   ├── protocols/         # 协议驱动层
│   │   │   ├── modbus/       # Modbus协议
│   │   │   ├── siemens/      # 西门子协议
│   │   │   └── omron/        # 欧姆龙协议
│   │   ├── services/         # 业务服务层
│   │   ├── controllers/      # 控制器层
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # 路由配置
│   │   ├── websocket/        # WebSocket服务
│   │   ├── utils/            # 工具类
│   │   ├── config/           # 配置文件
│   │   └── app.js            # 应用入口
│   └── package.json
│
├── frontend/                   # 前端目录
│   ├── src/
│   │   ├── views/            # 页面视图
│   │   │   ├── device/       # 设备管理
│   │   │   ├── monitor/      # 实时监控
│   │   │   ├── alarm/        # 报警报表
│   │   │   ├── history/      # 历史数据
│   │   │   └── dashboard/    # 自定义仪表板
│   │   ├── components/       # 组件
│   │   ├── api/              # API接口
│   │   ├── store/            # 状态管理
│   │   ├── router/           # 路由配置
│   │   ├── utils/            # 工具类
│   │   └── main.js           # 应用入口
│   ├── index.html
│   └── package.json
│
└── README.md
```

## 国际化支持

系统支持简体中文、English、繁體中文三种语言。

### 切换语言

1. 点击页面右上角的语言切换按钮（地球图标）
2. 选择所需语言：
   - 简体中文
   - English
   - 繁體中文
3. 系统会立即切换界面语言，并保存设置到浏览器

### 自动语言检测

首次访问时，系统会根据浏览器语言自动选择：
- `zh-CN`, `zh` → 简体中文
- `zh-TW`, `zh-HK` → 繁體中文
- `en-*` → English
- 其他 → 默认简体中文

### 开发者指南

如需完成其他页面的国际化，请参考：
- **迁移指南**: `/I18N_MIGRATION_GUIDE.md`
- **示例页面**: `/frontend/src/views/monitor/Index-i18n.vue`
- **语言包**: `/frontend/src/locales/`

已完成国际化的组件：
- ✅ 主布局和导航菜单
- ✅ 实时监控页面（示例）
- ⚠️ 其他页面需要参考迁移指南完成

## 使用指南

### 1. 添加设备

1. 进入"设备管理"页面
2. 点击"添加设备"按钮
3. 填写设备信息：
   - 设备名称
   - 协议类型（Modbus TCP/RTU/ASCII、西门子、欧姆龙）
   - 通讯方式（TCP或串口）
   - 连接参数（IP地址、端口或串口参数）
4. 点击"测试连接"验证配置
5. 保存设备配置

### 2. 配置数据点

1. 在设备列表中点击"数据点"按钮
2. 添加数据点，配置：
   - 数据点名称
   - 地址（根据协议类型不同）
   - 数据类型
   - 单位、缩放、偏移
   - 报警阈值（可选）
3. 保存配置

### 3. 实时监控

- 系统自动采集已配置的数据点
- 在"实时监控"页面查看实时数据
- WebSocket推送实时更新

### 4. 报警管理

- 配置数据点的报警阈值
- 系统自动检测并生成报警
- 在"报警报表"页面查看和确认报警

### 5. 历史数据

- 选择设备和数据点
- 指定时间范围查询
- 查看趋势图表
- 导出CSV格式数据

### 6. 自定义仪表板

- 创建仪表板
- 添加组件（数值、图表、仪表等）
- 拖拽调整布局
- 保存配置

## API文档

### 设备管理
- `GET /api/devices` - 获取所有设备
- `GET /api/devices/:id` - 获取单个设备
- `POST /api/devices` - 创建设备
- `PUT /api/devices/:id` - 更新设备
- `DELETE /api/devices/:id` - 删除设备
- `POST /api/devices/test` - 测试连接

### 数据点管理
- `GET /api/devices/:deviceId/datapoints` - 获取设备数据点
- `POST /api/devices/:deviceId/datapoints` - 创建数据点
- `PUT /api/datapoints/:id` - 更新数据点
- `DELETE /api/datapoints/:id` - 删除数据点
- `GET /api/datapoints/:id/read` - 读取数据点
- `POST /api/datapoints/:id/write` - 写入数据点

### 历史数据
- `GET /api/history/:dataPointId` - 获取历史数据
- `GET /api/history/:dataPointId/aggregated` - 获取聚合数据
- `POST /api/history/export` - 导出历史数据

### 报警管理
- `GET /api/alarms` - 获取报警列表
- `POST /api/alarms/:id/acknowledge` - 确认报警
- `GET /api/alarms/statistics` - 获取报警统计

### 仪表板管理
- `GET /api/dashboards` - 获取所有仪表板
- `GET /api/dashboards/:id` - 获取单个仪表板
- `POST /api/dashboards` - 创建仪表板
- `PUT /api/dashboards/:id` - 更新仪表板
- `DELETE /api/dashboards/:id` - 删除仪表板

## WebSocket事件

### 客户端 -> 服务端
- `ping` - 心跳检测
- `subscribe` - 订阅数据

### 服务端 -> 客户端
- `connected` - 连接成功
- `pong` - 心跳响应
- `realtime_data` - 实时数据推送
- `alarm` - 报警推送

## 配置说明

### Modbus配置示例
```json
{
  "name": "Modbus设备1",
  "protocol": "modbus_tcp",
  "connection_type": "tcp",
  "host": "192.168.1.100",
  "port": 502,
  "slave_id": 1,
  "timeout": 3000
}
```

### 西门子S7配置示例
```json
{
  "name": "西门子PLC",
  "protocol": "siemens",
  "connection_type": "tcp",
  "host": "192.168.1.101",
  "port": 102,
  "rack": 0,
  "slot": 1,
  "timeout": 3000
}
```

### 数据点地址格式

**Modbus**:
- 保持寄存器: `40001` (地址0)
- 输入寄存器: `30001` (地址0)
- 线圈: `00001` (地址0)
- 离散输入: `10001` (地址0)

**西门子**:
- DB块: `DB1.0` (DB1, 偏移0)
- 输入: `I0.0`
- 输出: `Q0.0`
- 标记: `M0.0`

**欧姆龙**:
- CIO区: `CIO100`
- DM区: `DM100`
- HR区: `HR100`

## 注意事项

1. **串口通讯**: Linux系统需要串口权限，将用户添加到dialout组：
   ```bash
   sudo usermod -a -G dialout $USER
   ```

2. **西门子S7**: 需要PLC开启以太网通讯功能

3. **数据保留**: 默认保留90天历史数据，可在配置中修改

4. **性能**: 数据采集间隔建议不小于1秒

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request

## 联系方式

如有问题请提交 Issue
