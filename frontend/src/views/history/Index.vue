<template>
  <div class="history-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>历史数据查询</span>
          <el-button type="primary" :icon="Download" @click="handleExport">导出数据</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm">
        <el-form-item label="设备">
          <el-select v-model="queryForm.deviceId" placeholder="请选择设备" @change="handleDeviceChange">
            <el-option
              v-for="device in devices"
              :key="device.id"
              :label="device.name"
              :value="device.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="数据点">
          <el-select v-model="queryForm.dataPointId" placeholder="请选择数据点">
            <el-option
              v-for="point in dataPoints"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="20">
        <el-col :span="24">
          <div ref="chartContainer" style="height: 400px;"></div>
        </el-col>
      </el-row>

      <el-table :data="historyData" border stripe style="margin-top: 20px;">
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="数值" width="120">
          <template #default="{ row }">
            {{ row.value !== null ? row.value.toFixed(3) : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column label="质量" width="100">
          <template #default="{ row }">
            <el-tag :type="row.quality === 1 ? 'success' : 'danger'" size="small">
              {{ row.quality === 1 ? '良好' : '错误' }}
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
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'
import { historyApi } from '@/api/history'
import moment from 'moment'
import * as echarts from 'echarts'

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
    ElMessage.error('加载设备列表失败')
  }
}

const handleDeviceChange = async (deviceId) => {
  try {
    const res = await deviceApi.getDataPoints(deviceId)
    dataPoints.value = res.data
    queryForm.value.dataPointId = null
  } catch (error) {
    ElMessage.error('加载数据点失败')
  }
}

const handleQuery = async () => {
  if (!queryForm.value.dataPointId) {
    ElMessage.warning('请选择数据点')
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
    ElMessage.error('查询失败')
  }
}

const renderChart = (data) => {
  if (chartContainer.value && !chartInstance) {
    chartInstance = echarts.init(chartContainer.value)
  }

  if (chartInstance) {
    const option = {
      title: {
        text: '历史数据趋势'
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
        name: '数值'
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
        name: '数值',
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
    ElMessage.warning('请先查询数据')
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

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
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
