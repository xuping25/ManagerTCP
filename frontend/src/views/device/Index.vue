<template>
  <div class="device-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ t('device.list') }}</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('device.addDevice') }}</el-button>
        </div>
      </template>

      <el-table :data="devices" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" :label="t('device.name')" width="150" />
        <el-table-column prop="protocol" :label="t('device.protocol')" width="120" />
        <el-table-column prop="connection_type" :label="t('device.connectionType')" width="100" />
        <el-table-column :label="t('device.connectionAddress')" min-width="200">
          <template #default="{ row }">
            <span v-if="row.connection_type === 'tcp'">{{ row.host }}:{{ row.port }}</span>
            <span v-else>{{ row.serial_port }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.connected ? 'success' : 'danger'">
              {{ row.connected ? t('common.connected') : t('common.disconnected') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operations')" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="Setting" @click="handleDataPoints(row)">{{ t('device.dataPoints') }}</el-button>
            <el-button size="small" :icon="Edit" @click="handleEdit(row)">{{ t('common.edit') }}</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 设备编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item :label="t('device.name')">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="t('device.protocol')">
          <el-select v-model="form.protocol" @change="handleProtocolChange">
            <el-option label="Modbus TCP" value="modbus_tcp" />
            <el-option label="Modbus RTU" value="modbus_rtu" />
            <el-option label="Modbus ASCII" value="modbus_ascii" />
            <el-option :label="t('device.siemensS7')" value="siemens" />
            <el-option :label="t('device.omronFINS')" value="omron" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('device.connectionType')">
          <el-radio-group v-model="form.connection_type">
            <el-radio label="tcp">TCP</el-radio>
            <el-radio label="serial">{{ t('device.serialPort') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.connection_type === 'tcp'">
          <el-form-item :label="t('device.ipAddress')">
            <el-input v-model="form.host" />
          </el-form-item>
          <el-form-item :label="t('device.port')">
            <el-input-number v-model="form.port" :min="1" :max="65535" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item :label="t('device.serialPort')">
            <el-input v-model="form.serial_port" placeholder="/dev/ttyUSB0" />
          </el-form-item>
          <el-form-item :label="t('device.baudRate')">
            <el-select v-model="form.baud_rate">
              <el-option :value="9600" label="9600" />
              <el-option :value="19200" label="19200" />
              <el-option :value="38400" label="38400" />
              <el-option :value="57600" label="57600" />
              <el-option :value="115200" label="115200" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('device.dataBits')">
            <el-select v-model="form.data_bits">
              <el-option :value="7" label="7" />
              <el-option :value="8" label="8" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('device.stopBits')">
            <el-select v-model="form.stop_bits">
              <el-option :value="1" label="1" />
              <el-option :value="2" label="2" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('device.parity')">
            <el-select v-model="form.parity">
              <el-option value="none" :label="t('device.none')" />
              <el-option value="even" :label="t('device.even')" />
              <el-option value="odd" :label="t('device.odd')" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item v-if="form.protocol.startsWith('modbus')" :label="t('device.slaveId')">
          <el-input-number v-model="form.slave_id" :min="1" :max="247" />
        </el-form-item>

        <el-form-item v-if="form.protocol === 'siemens'" :label="t('device.rack')">
          <el-input-number v-model="form.rack" :min="0" :max="7" />
        </el-form-item>

        <el-form-item v-if="form.protocol === 'siemens'" :label="t('device.slot')">
          <el-input-number v-model="form.slot" :min="0" :max="31" />
        </el-form-item>

        <el-form-item :label="t('device.timeout')">
          <el-input-number v-model="form.timeout" :min="1000" :max="30000" />
        </el-form-item>

        <el-form-item :label="t('common.enabled')">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleTest">{{ t('device.testConnection') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 数据点管理对话框 -->
    <el-dialog v-model="dataPointDialog" :title="t('device.dataPointManagement')" width="90%">
      <el-button type="primary" :icon="Plus" @click="handleAddDataPoint" style="margin-bottom: 10px;">
        {{ t('device.addDataPoint') }}
      </el-button>

      <el-table :data="dataPoints" border>
        <el-table-column prop="name" :label="t('device.name')" width="120" />
        <el-table-column prop="address" :label="t('device.address')" width="100" />
        <el-table-column prop="data_type" :label="t('device.dataType')" width="100" />
        <el-table-column prop="unit" :label="t('device.unit')" width="80" />
        <el-table-column prop="scale" :label="t('device.scale')" width="80" />
        <el-table-column prop="offset" :label="t('device.offset')" width="80" />
        <el-table-column prop="description" :label="t('device.description')" min-width="150" />
        <el-table-column :label="t('device.alarmEnabled')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.alarm_enabled ? 'warning' : 'info'" size="small">
              {{ row.alarm_enabled ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operations')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :icon="View" @click="handleReadPoint(row)">{{ t('device.read') }}</el-button>
            <el-button size="small" :icon="Edit" @click="handleEditDataPoint(row)">{{ t('common.edit') }}</el-button>
            <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteDataPoint(row)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Setting, View } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'

const { t } = useI18n()
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
    ElMessage.error(t('device.loadFailed'))
  }
}

const handleAdd = () => {
  dialogTitle.value = t('device.addDevice')
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
  dialogTitle.value = t('device.editDevice')
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
    ElMessage.success(t('device.testSuccess'))
  } catch (error) {
    ElMessage.error(t('device.testFailed'))
  }
}

const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await deviceApi.updateDevice(form.value.id, form.value)
      ElMessage.success(t('device.updateSuccess'))
    } else {
      await deviceApi.createDevice(form.value)
      ElMessage.success(t('device.createSuccess'))
    }
    dialogVisible.value = false
    loadDevices()
  } catch (error) {
    ElMessage.error(t('device.operationFailed'))
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(t('device.deleteConfirm'), t('common.confirm'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await deviceApi.deleteDevice(row.id)
      ElMessage.success(t('device.deleteSuccess'))
      loadDevices()
    } catch (error) {
      ElMessage.error(t('device.operationFailed'))
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
    ElMessage.error(t('device.loadFailed'))
  }
}

const handleAddDataPoint = () => {
  // 这里简化处理，实际应该打开新的对话框
  ElMessage.info(t('device.addDataPoint'))
}

const handleEditDataPoint = (row) => {
  ElMessage.info(t('device.editDataPoint'))
}

const handleDeleteDataPoint = (row) => {
  ElMessageBox.confirm(t('device.deleteDataPointConfirm'), t('common.confirm'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    try {
      await deviceApi.deleteDataPoint(row.id)
      ElMessage.success(t('device.deleteSuccess'))
      handleDataPoints(currentDevice.value)
    } catch (error) {
      ElMessage.error(t('device.operationFailed'))
    }
  })
}

const handleReadPoint = async (row) => {
  try {
    const res = await deviceApi.readDataPoint(row.id)
    ElMessage.success(t('device.readSuccess') + `: ${res.data.value}`)
  } catch (error) {
    ElMessage.error(t('device.readFailed'))
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
