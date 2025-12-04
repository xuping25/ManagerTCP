<template>
  <div class="monitor-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon devices">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalDevices }}</div>
              <div class="stat-label">总设备数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon online">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ onlineDevices }}</div>
              <div class="stat-label">在线设备</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon alarms">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ store.activeAlarmCount }}</div>
              <div class="stat-label">活跃报警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon datapoints">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ store.realtimeData.size }}</div>
              <div class="stat-label">实时数据点</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>实时数据监控</span>
          </template>
          <el-table :data="realtimeDataList" height="400" border>
            <el-table-column prop="deviceName" label="设备名称" width="150" />
            <el-table-column prop="dataPointName" label="数据点" width="150" />
            <el-table-column label="当前值" width="120">
              <template #default="{ row }">
                <span :class="{ 'value-good': row.quality === 1, 'value-bad': row.quality === 0 }">
                  {{ row.value !== null ? row.value.toFixed(2) : 'N/A' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="质量" width="80">
              <template #default="{ row }">
                <el-tag :type="row.quality === 1 ? 'success' : 'danger'" size="small">
                  {{ row.quality === 1 ? '良好' : '错误' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="timestamp" label="时间戳" min-width="180">
              <template #default="{ row }">
                {{ formatTime(row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>最近报警</span>
          </template>
          <div class="alarm-list">
            <div v-for="alarm in recentAlarms" :key="alarm.id" class="alarm-item">
              <div class="alarm-header">
                <el-tag :type="getAlarmType(alarm.alarmType)" size="small">
                  {{ alarm.alarmType }}
                </el-tag>
                <span class="alarm-time">{{ formatTime(alarm.timestamp) }}</span>
              </div>
              <div class="alarm-message">{{ alarm.message }}</div>
            </div>
            <el-empty v-if="recentAlarms.length === 0" description="暂无报警" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>设备状态</span>
          </template>
          <el-table :data="devices" border>
            <el-table-column prop="name" label="设备名称" width="150" />
            <el-table-column prop="protocol" label="协议" width="120" />
            <el-table-column label="连接地址" min-width="200">
              <template #default="{ row }">
                <span v-if="row.connection_type === 'tcp'">{{ row.host }}:{{ row.port }}</span>
                <span v-else>{{ row.serial_port }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.connected ? 'success' : 'danger'">
                  {{ row.connected ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据点数量" width="120">
              <template #default="{ row }">
                {{ getDeviceDataPointCount(row.id) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/store'
import { deviceApi } from '@/api/device'
import { Setting, CircleCheck, Bell, DataLine } from '@element-plus/icons-vue'
import moment from 'moment'

const store = useAppStore()
const devices = ref([])

const totalDevices = computed(() => devices.value.length)
const onlineDevices = computed(() => devices.value.filter(d => d.connected).length)

const realtimeDataList = computed(() => {
  const list = []
  for (const [key, value] of store.realtimeData.entries()) {
    list.push(value)
  }
  return list.slice(0, 50)
})

const recentAlarms = computed(() => {
  return store.alarms.slice(0, 10)
})

const loadDevices = async () => {
  try {
    const res = await deviceApi.getAllDevices()
    devices.value = res.data
    store.setDevices(res.data)
  } catch (error) {
    console.error('Load devices error:', error)
  }
}

const getDeviceDataPointCount = (deviceId) => {
  let count = 0
  for (const [key, value] of store.realtimeData.entries()) {
    if (value.deviceId === deviceId) {
      count++
    }
  }
  return count
}

const formatTime = (time) => {
  return moment(time).format('YYYY-MM-DD HH:mm:ss')
}

const getAlarmType = (type) => {
  return type === 'HIGH' ? 'danger' : 'warning'
}

onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
.monitor-container {
  height: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  margin-right: 20px;
}

.stat-icon.devices {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.online {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.alarms {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-icon.datapoints {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.value-good {
  color: #67c23a;
  font-weight: bold;
}

.value-bad {
  color: #f56c6c;
  font-weight: bold;
}

.alarm-list {
  height: 400px;
  overflow-y: auto;
}

.alarm-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.alarm-item:hover {
  background-color: #f5f7fa;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.alarm-time {
  font-size: 12px;
  color: #909399;
}

.alarm-message {
  font-size: 13px;
  color: #606266;
}
</style>
