<template>
  <div class="history-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ t('history.query') }}</span>
          <el-button type="primary" :icon="Download" @click="handleExport">{{ t('history.exportData') }}</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm">
        <el-form-item :label="t('history.device')">
          <el-select v-model="queryForm.deviceId" :placeholder="t('history.selectDevice')" @change="handleDeviceChange">
            <el-option
              v-for="device in devices"
              :key="device.id"
              :label="device.name"
              :value="device.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('history.dataPoint')">
          <el-select v-model="queryForm.dataPointId" :placeholder="t('history.selectDataPoint')">
            <el-option
              v-for="point in dataPoints"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('history.timeRange')">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="datetimerange"
            :range-separator="t('alarm.to')"
            :start-placeholder="t('history.startTime')"
            :end-placeholder="t('history.endTime')"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">{{ t('history.queryBtn') }}</el-button>
          <el-button :icon="Refresh" @click="handleReset">{{ t('history.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="20">
        <el-col :span="24">
          <div ref="chartContainer" style="height: 400px;"></div>
        </el-col>
      </el-row>

      <el-table :data="historyData" border stripe style="margin-top: 20px;">
        <el-table-column prop="timestamp" :label="t('history.time')" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" :label="t('history.value')" width="120">
          <template #default="{ row }">
            {{ row.value !== null ? row.value.toFixed(3) : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('monitor.quality')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.quality === 1 ? 'success' : 'danger'" size="small">
              {{ row.quality === 1 ? t('monitor.good') : t('monitor.bad') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'
import { historyApi } from '@/api/history'
import moment from 'moment'
import * as echarts from 'echarts'

const { t } = useI18n()

const devices = ref([])
const dataPoints = ref([])
const historyData = ref([])
const chartContainer = ref(null)
let chartInstance = null

const queryForm = ref({
  deviceId: null,
  dataPointId: null,
  dateRange: [
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    new Date()
  ]
})

const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

const loadDevices = async () => {
  try {
    const res = await deviceApi.getAllDevices()
    devices.value = res.data
  } catch (error) {
    ElMessage.error(t('history.loadDevicesFailed'))
  }
}

const handleDeviceChange = async (deviceId) => {
  try {
    const res = await deviceApi.getDataPoints(deviceId)
    dataPoints.value = res.data
    queryForm.value.dataPointId = null
  } catch (error) {
    ElMessage.error(t('history.loadDataPointsFailed'))
  }
}

const handleQuery = async () => {
  if (!queryForm.value.dataPointId) {
    ElMessage.warning(t('history.selectDataPoint'))
    return
  }

  try {
    const params = {
      limit: pageSize.value
    }

    if (queryForm.value.dateRange && queryForm.value.dateRange.length === 2) {
      params.startTime = queryForm.value.dateRange[0].toISOString()
      params.endTime = queryForm.value.dateRange[1].toISOString()
    }

    const res = await historyApi.getHistoryData(queryForm.value.dataPointId, params)
    historyData.value = res.data
    total.value = res.data.length

    renderChart(res.data)
  } catch (error) {
    ElMessage.error(t('history.queryFailed'))
  }
}

const renderChart = (data) => {
  if (chartContainer.value && !chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }

  if (chartInstance) {
    const option = {
      title: {
        text: t('history.trend')
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const param = params[0]
          return `${param.name}<br/>${param.seriesName}: ${param.value.toFixed(3)}`
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(d => moment(d.timestamp).format('MM-DD HH:mm')),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: t('history.value')
      },
      dataZoom: [{
        type: 'inside',
        start: 0,
        end: 100
      }, {
        start: 0,
        end: 100
      }],
      series: [{
        name: t('history.value'),
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(64, 158, 255, 0.5)'
            }, {
              offset: 1,
              color: 'rgba(64, 158, 255, 0.1)'
            }]
          }
        }
      }]
    }

    chartInstance.setOption(option)
  }
}

const handleReset = () => {
  queryForm.value = {
    deviceId: null,
    dataPointId: null,
    dateRange: [
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date()
    ]
  }
  dataPoints.value = []
  historyData.value = []
  chartInstance?.clear()
}

const handleExport = async () => {
  if (!queryForm.value.dataPointId) {
    ElMessage.warning(t('history.queryFirst'))
    return
  }

  try {
    const data = {
      dataPointIds: [queryForm.value.dataPointId],
      startTime: queryForm.value.dateRange[0].toISOString(),
      endTime: queryForm.value.dateRange[1].toISOString()
    }

    const res = await historyApi.exportHistoryData(data)

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `history_data_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success(t('history.exportSuccess'))
  } catch (error) {
    ElMessage.error(t('history.exportFailed'))
  }
}

const formatTime = (time) => {
  return moment(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadDevices()

  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

onUnmounted(() => {
  chartInstance?.dispose()
})
</script>

<style scoped>
.history-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
