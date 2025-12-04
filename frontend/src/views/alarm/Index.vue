<template>
  <div class="alarm-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报警记录</span>
          <div>
            <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 120px; margin-right: 10px;" @change="loadAlarms">
              <el-option label="全部" value="" />
              <el-option label="活跃" value="active" />
              <el-option label="已确认" value="acknowledged" />
              <el-option label="已清除" value="cleared" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              @change="loadAlarms"
            />
          </div>
        </div>
      </template>

      <el-table :data="alarms" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="device_name" label="设备" width="150" />
        <el-table-column prop="data_point_name" label="数据点" width="150" />
        <el-table-column label="报警类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.alarm_type === 'HIGH' ? 'danger' : 'warning'" size="small">
              {{ row.alarm_type === 'HIGH' ? '高限' : '低限' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="报警值" width="100">
          <template #default="{ row }">
            {{ row.value.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="阈值" width="100">
          <template #default="{ row }">
            {{ row.threshold ? row.threshold.toFixed(2) : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="message" label="报警信息" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="报警时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'active'"
              size="small"
              type="primary"
              @click="handleAcknowledge(row)"
            >
              确认
            </el-button>
            <el-tag v-else-if="row.ack_user" size="small" type="info">
              {{ row.ack_user }}
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
          @size-change="loadAlarms"
          @current-change="loadAlarms"
        />
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>报警趋势</span>
          </template>
          <div ref="trendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>报警统计</span>
          </template>
          <div ref="statsChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alarmApi } from '@/api/alarm'
import moment from 'moment'
import * as echarts from 'echarts'

const alarms = ref([])
const filterStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const trendChart = ref(null)
const statsChart = ref(null)
let trendChartInstance = null
let statsChartInstance = null

const loadAlarms = async () => {
  try {
    const params = {
      status: filterStatus.value,
      limit: pageSize.value
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0].toISOString()
      params.endTime = dateRange.value[1].toISOString()
    }

    const res = await alarmApi.getAlarms(params)
    alarms.value = res.data
    total.value = res.data.length
  } catch (error) {
    ElMessage.error('加载报警列表失败')
  }
}

const loadStatistics = async () => {
  try {
    const res = await alarmApi.getAlarmStatistics({})
    renderCharts(res.data)
  } catch (error) {
    console.error('Load statistics error:', error)
  }
}

const renderCharts = (stats) => {
  // 报警趋势图
  if (trendChart.value && !trendChartInstance) {
    trendChartInstance = echarts.init(trendChart.value)
  }

  if (trendChartInstance) {
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [12, 8, 15, 10, 18, 6, 9],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    }
    trendChartInstance.setOption(option)
  }

  // 报警统计图
  if (statsChart.value && !statsChartInstance) {
    statsChartInstance = echarts.init(statsChart.value)
  }

  if (statsChartInstance) {
    const option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: '5%',
        left: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        data: stats.map(s => ({
          value: s.count,
          name: `${getStatusText(s.status)}-${s.alarm_level}`
        }))
      }]
    }
    statsChartInstance.setOption(option)
  }
}

const handleAcknowledge = (row) => {
  ElMessageBox.prompt('请输入确认人', '确认报警', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入确认人'
  }).then(async ({ value }) => {
    try {
      await alarmApi.acknowledgeAlarm(row.id, value)
      ElMessage.success('报警已确认')
      loadAlarms()
    } catch (error) {
      ElMessage.error('确认失败')
    }
  })
}

const getStatusType = (status) => {
  const types = {
    active: 'danger',
    acknowledged: 'warning',
    cleared: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    active: '活跃',
    acknowledged: '已确认',
    cleared: '已清除'
  }
  return texts[status] || status
}

const formatTime = (time) => {
  return moment(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadAlarms()
  loadStatistics()

  window.addEventListener('resize', () => {
    trendChartInstance?.resize()
    statsChartInstance?.resize()
  })
})

onUnmounted(() => {
  trendChartInstance?.dispose()
  statsChartInstance?.dispose()
})
</script>

<style scoped>
.alarm-container {
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
