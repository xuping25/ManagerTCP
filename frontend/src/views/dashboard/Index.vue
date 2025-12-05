<template>
  <div class="dashboard-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <el-select v-model="currentDashboardId" :placeholder="t('dashboard.selectDashboard')" @change="loadDashboard">
              <el-option
                v-for="dashboard in dashboards"
                :key="dashboard.id"
                :label="dashboard.name"
                :value="dashboard.id"
              />
            </el-select>
            <el-button :icon="Edit" @click="editMode = !editMode" style="margin-left: 10px;">
              {{ editMode ? t('dashboard.exitEdit') : t('dashboard.editMode') }}
            </el-button>
          </div>
          <div>
            <el-button type="primary" :icon="Plus" @click="handleCreate">{{ t('dashboard.createDashboard') }}</el-button>
            <el-button v-if="editMode" type="success" :icon="Check" @click="handleSave">{{ t('dashboard.saveLayout') }}</el-button>
          </div>
        </div>
      </template>

      <div v-if="currentDashboard">
        <grid-layout
          v-model:layout="layout"
          :col-num="12"
          :row-height="30"
          :is-draggable="editMode"
          :is-resizable="editMode"
          :vertical-compact="true"
          :use-css-transforms="true"
        >
          <grid-item
            v-for="item in layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
          >
            <el-card class="widget-card">
              <template #header>
                <div class="widget-header">
                  <span>{{ item.title }}</span>
                  <el-button
                    v-if="editMode"
                    :icon="Delete"
                    circle
                    size="small"
                    type="danger"
                    @click="handleRemoveWidget(item.i)"
                  />
                </div>
              </template>
              <component
                :is="getWidgetComponent(item.type)"
                :config="item.config"
                :data="getWidgetData(item)"
              />
            </el-card>
          </grid-item>
        </grid-layout>

        <el-button
          v-if="editMode"
          type="primary"
          :icon="Plus"
          class="add-widget-btn"
          @click="showWidgetDialog = true"
        >
          {{ t('dashboard.addWidget') }}
        </el-button>
      </div>

      <el-empty v-else :description="t('dashboard.selectOrCreate')" />
    </el-card>

    <!-- 创建仪表板对话框 -->
    <el-dialog v-model="dashboardDialog" :title="t('dashboard.createDashboard')" width="500px">
      <el-form :model="dashboardForm" label-width="100px">
        <el-form-item :label="t('dashboard.name')">
          <el-input v-model="dashboardForm.name" />
        </el-form-item>
        <el-form-item :label="t('dashboard.description')">
          <el-input v-model="dashboardForm.description" type="textarea" />
        </el-form-item>
        <el-form-item :label="t('dashboard.setDefault')">
          <el-switch v-model="dashboardForm.is_default" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dashboardDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateDashboard">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加组件对话框 -->
    <el-dialog v-model="showWidgetDialog" :title="t('dashboard.addWidget')" width="500px">
      <el-form :model="widgetForm" label-width="100px">
        <el-form-item :label="t('dashboard.widgetType')">
          <el-select v-model="widgetForm.type">
            <el-option :label="t('dashboard.valueDisplay')" value="value" />
            <el-option :label="t('dashboard.lineChart')" value="line-chart" />
            <el-option :label="t('dashboard.gauge')" value="gauge" />
            <el-option :label="t('dashboard.statusIndicator')" value="status" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('dashboard.title')">
          <el-input v-model="widgetForm.title" />
        </el-form-item>
        <el-form-item :label="t('dashboard.device')">
          <el-select v-model="widgetForm.deviceId" @change="handleWidgetDeviceChange">
            <el-option
              v-for="device in devices"
              :key="device.id"
              :label="device.name"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('dashboard.dataPoint')">
          <el-select v-model="widgetForm.dataPointId">
            <el-option
              v-for="point in widgetDataPoints"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWidgetDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleAddWidget">{{ t('dashboard.add') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Check } from '@element-plus/icons-vue'
import { GridLayout, GridItem } from 'vue-grid-layout'
import { dashboardApi } from '@/api/dashboard'
import { deviceApi } from '@/api/device'
import { useAppStore } from '@/store'

const { t } = useI18n()
const store = useAppStore()
const dashboards = ref([])
const currentDashboardId = ref(null)
const currentDashboard = ref(null)
const layout = ref([])
const editMode = ref(false)
const dashboardDialog = ref(false)
const showWidgetDialog = ref(false)
const devices = ref([])
const widgetDataPoints = ref([])

const dashboardForm = ref({
  name: '',
  description: '',
  is_default: false
})

const widgetForm = ref({
  type: 'value',
  title: '',
  deviceId: null,
  dataPointId: null
})

const loadDashboards = async () => {
  try {
    const res = await dashboardApi.getDashboards()
    dashboards.value = res.data
    if (dashboards.value.length > 0 && !currentDashboardId.value) {
      currentDashboardId.value = dashboards.value[0].id
      loadDashboard()
    }
  } catch (error) {
    ElMessage.error(t('dashboard.loadDashboardsFailed'))
  }
}

const loadDashboard = async () => {
  if (!currentDashboardId.value) return

  try {
    const res = await dashboardApi.getDashboard(currentDashboardId.value)
    currentDashboard.value = res.data
    layout.value = res.data.layout || []
  } catch (error) {
    ElMessage.error(t('dashboard.loadDashboardFailed'))
  }
}

const loadDevices = async () => {
  try {
    const res = await deviceApi.getAllDevices()
    devices.value = res.data
  } catch (error) {
    ElMessage.error(t('dashboard.loadDevicesFailed'))
  }
}

const handleCreate = () => {
  dashboardForm.value = {
    name: '',
    description: '',
    is_default: false
  }
  dashboardDialog.value = true
}

const handleCreateDashboard = async () => {
  try {
    await dashboardApi.createDashboard({
      ...dashboardForm.value,
      layout: []
    })
    ElMessage.success(t('dashboard.createSuccess'))
    dashboardDialog.value = false
    loadDashboards()
  } catch (error) {
    ElMessage.error(t('dashboard.createFailed'))
  }
}

const handleSave = async () => {
  try {
    await dashboardApi.updateDashboard(currentDashboardId.value, {
      ...currentDashboard.value,
      layout: layout.value
    })
    ElMessage.success(t('dashboard.saveSuccess'))
    editMode.value = false
  } catch (error) {
    ElMessage.error(t('dashboard.saveFailed'))
  }
}

const handleWidgetDeviceChange = async (deviceId) => {
  try {
    const res = await deviceApi.getDataPoints(deviceId)
    widgetDataPoints.value = res.data
  } catch (error) {
    ElMessage.error(t('dashboard.loadDataPointsFailed'))
  }
}

const handleAddWidget = () => {
  const newItem = {
    i: `widget-${Date.now()}`,
    x: 0,
    y: layout.value.length > 0 ? Math.max(...layout.value.map(item => item.y + item.h)) : 0,
    w: 3,
    h: 6,
    type: widgetForm.value.type,
    title: widgetForm.value.title,
    config: {
      deviceId: widgetForm.value.deviceId,
      dataPointId: widgetForm.value.dataPointId
    }
  }

  layout.value.push(newItem)
  showWidgetDialog.value = false

  widgetForm.value = {
    type: 'value',
    title: '',
    deviceId: null,
    dataPointId: null
  }
}

const handleRemoveWidget = (id) => {
  layout.value = layout.value.filter(item => item.i !== id)
}

const getWidgetComponent = (type) => {
  // 简化实现，返回默认组件
  return 'div'
}

const getWidgetData = (item) => {
  if (!item.config) return null

  const key = `${item.config.deviceId}_${item.config.dataPointId}`
  return store.realtimeData.get(key)
}

onMounted(() => {
  loadDashboards()
  loadDevices()
})
</script>

<style scoped>
.dashboard-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-card {
  height: 100%;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-widget-btn {
  margin-top: 20px;
  width: 100%;
}
</style>
