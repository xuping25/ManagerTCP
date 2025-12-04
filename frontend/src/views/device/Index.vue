<template>
  <div class="device-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加设备</el-button>
        </div>
      </template>

      <el-table :data="devices" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="设备名称" width="150" />
        <el-table-column prop="protocol" label="协议" width="120" />
        <el-table-column prop="connection_type" label="通讯方式" width="100" />
        <el-table-column label="连接地址" min-width="200">
          <template #default="{ row }">
            <span v-if="row.connection_type === 'tcp'">{{ row.host }}:{{ row.port }}</span>
            <span v-else>{{ row.serial_port }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.connected ? 'success' : 'danger'">
              {{ row.connected ? '已连接' : '未连接' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="Setting" @click="handleDataPoints(row)">数据点</el-button>
            <el-button size="small" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 设备编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="协议类型">
          <el-select v-model="form.protocol" @change="handleProtocolChange">
            <el-option label="Modbus TCP" value="modbus_tcp" />
            <el-option label="Modbus RTU" value="modbus_rtu" />
            <el-option label="Modbus ASCII" value="modbus_ascii" />
            <el-option label="西门子S7" value="siemens" />
            <el-option label="欧姆龙FINS" value="omron" />
          </el-select>
        </el-form-item>
        <el-form-item label="通讯方式">
          <el-radio-group v-model="form.connection_type">
            <el-radio label="tcp">TCP</el-radio>
            <el-radio label="serial">串口</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.connection_type === 'tcp'">
          <el-form-item label="IP地址">
            <el-input v-model="form.host" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number v-model="form.port" :min="1" :max="65535" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="串口">
            <el-input v-model="form.serial_port" placeholder="/dev/ttyUSB0" />
          </el-form-item>
          <el-form-item label="波特率">
            <el-select v-model="form.baud_rate">
              <el-option :value="9600" label="9600" />
              <el-option :value="19200" label="19200" />
              <el-option :value="38400" label="38400" />
              <el-option :value="57600" label="57600" />
              <el-option :value="115200" label="115200" />
            </el-select>
          </el-form-item>
          <el-form-item label="数据位">
            <el-select v-model="form.data_bits">
              <el-option :value="7" label="7" />
              <el-option :value="8" label="8" />
            </el-select>
          </el-form-item>
          <el-form-item label="停止位">
            <el-select v-model="form.stop_bits">
              <el-option :value="1" label="1" />
              <el-option :value="2" label="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="校验位">
            <el-select v-model="form.parity">
              <el-option value="none" label="无" />
              <el-option value="even" label="偶校验" />
              <el-option value="odd" label="奇校验" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item v-if="form.protocol.startsWith('modbus')" label="从站ID">
          <el-input-number v-model="form.slave_id" :min="1" :max="247" />
        </el-form-item>

        <el-form-item v-if="form.protocol === 'siemens'" label="机架号">
          <el-input-number v-model="form.rack" :min="0" :max="7" />
        </el-form-item>

        <el-form-item v-if="form.protocol === 'siemens'" label="插槽号">
          <el-input-number v-model="form.slot" :min="0" :max="31" />
        </el-form-item>

        <el-form-item label="超时时间(ms)">
          <el-input-number v-model="form.timeout" :min="1000" :max="30000" />
        </el-form-item>

        <el-form-item label="启用">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTest">测试连接</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 数据点管理对话框 -->
    <el-dialog v-model="dataPointDialog" title="数据点管理" width="90%">
      <el-button type="primary" :icon="Plus" @click="handleAddDataPoint" style="margin-bottom: 10px;">
        添加数据点
      </el-button>

      <el-table :data="dataPoints" border>
        <el-table-column prop="name" label="名称" width="120" />
        <el-table-column prop="address" label="地址" width="100" />
        <el-table-column prop="data_type" label="数据类型" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="scale" label="缩放" width="80" />
        <el-table-column prop="offset" label="偏移" width="80" />
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column label="报警" width="100">
          <template #default="{ row }">
            <el-tag :type="row.alarm_enabled ? 'warning' : 'info'" size="small">
              {{ row.alarm_enabled ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="View" @click="handleReadPoint(row)">读取</el-button>
            <el-button size="small" :icon="Edit" @click="handleEditDataPoint(row)">编辑</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteDataPoint(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Setting, View } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'

const devices = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dataPointDialog = ref(false)
const dataPoints = ref([])
const currentDevice = ref(null)

const form = ref({
  name: '',
  protocol: 'modbus_tcp',
  connection_type: 'tcp',
  host: '',
  port: 502,
  serial_port: '',
  baud_rate: 9600,
  data_bits: 8,
  stop_bits: 1,
  parity: 'none',
  slave_id: 1,
  rack: 0,
  slot: 1,
  timeout: 3000,
  enabled: 1
})

const loadDevices = async () => {
  try {
    const res = await deviceApi.getAllDevices()
    devices.value = res.data
  } catch (error) {
    ElMessage.error('加载设备列表失败')
  }
}

const handleAdd = () => {
  dialogTitle.value = '添加设备'
  form.value = {
    name: '',
    protocol: 'modbus_tcp',
    connection_type: 'tcp',
    host: '',
    port: 502,
    serial_port: '',
    baud_rate: 9600,
    data_bits: 8,
    stop_bits: 1,
    parity: 'none',
    slave_id: 1,
    rack: 0,
    slot: 1,
    timeout: 3000,
    enabled: 1
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑设备'
  form.value = { ...row }
  dialogVisible.value = true
}

const handleProtocolChange = (val) => {
  if (val === 'modbus_tcp') {
    form.value.connection_type = 'tcp'
    form.value.port = 502
  } else if (val === 'siemens') {
    form.value.connection_type = 'tcp'
    form.value.port = 102
  } else if (val === 'omron') {
    form.value.connection_type = 'tcp'
    form.value.port = 9600
  }
}

const handleTest = async () => {
  try {
    await deviceApi.testConnection(form.value)
    ElMessage.success('连接测试成功')
  } catch (error) {
    ElMessage.error('连接测试失败')
  }
}

const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await deviceApi.updateDevice(form.value.id, form.value)
      ElMessage.success('设备更新成功')
    } else {
      await deviceApi.createDevice(form.value)
      ElMessage.success('设备创建成功')
    }
    dialogVisible.value = false
    loadDevices()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该设备吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deviceApi.deleteDevice(row.id)
      ElMessage.success('删除成功')
      loadDevices()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleDataPoints = async (row) => {
  currentDevice.value = row
  try {
    const res = await deviceApi.getDataPoints(row.id)
    dataPoints.value = res.data
    dataPointDialog.value = true
  } catch (error) {
    ElMessage.error('加载数据点失败')
  }
}

const handleAddDataPoint = () => {
  // 这里简化处理，实际应该打开新的对话框
  ElMessage.info('请实现数据点添加对话框')
}

const handleEditDataPoint = (row) => {
  ElMessage.info('请实现数据点编辑对话框')
}

const handleDeleteDataPoint = (row) => {
  ElMessageBox.confirm('确定要删除该数据点吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deviceApi.deleteDataPoint(row.id)
      ElMessage.success('删除成功')
      handleDataPoints(currentDevice.value)
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleReadPoint = async (row) => {
  try {
    const res = await deviceApi.readDataPoint(row.id)
    ElMessage.success(`读取成功: ${res.data.value}`)
  } catch (error) {
    ElMessage.error('读取失败')
  }
}

onMounted(() => {
  loadDevices()
})
</script>

<style scoped>
.device-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
