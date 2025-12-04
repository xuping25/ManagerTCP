import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 设备列表
  const devices = ref([])

  // 实时数据
  const realtimeData = ref(new Map())

  // 报警列表
  const alarms = ref([])

  // WebSocket连接状态
  const wsConnected = ref(false)

  // 设置设备列表
  const setDevices = (data) => {
    devices.value = data
  }

  // 更新实时数据
  const updateRealtimeData = (data) => {
    const key = `${data.deviceId}_${data.dataPointId}`
    realtimeData.value.set(key, data)
  }

  // 添加报警
  const addAlarm = (alarm) => {
    alarms.value.unshift(alarm)
    if (alarms.value.length > 100) {
      alarms.value = alarms.value.slice(0, 100)
    }
  }

  // 设置WebSocket连接状态
  const setWsConnected = (status) => {
    wsConnected.value = status
  }

  // 获取设备的实时数据
  const getDeviceRealtimeData = (deviceId) => {
    const data = []
    for (const [key, value] of realtimeData.value.entries()) {
      if (value.deviceId === deviceId) {
        data.push(value)
      }
    }
    return data
  }

  // 活跃报警数量
  const activeAlarmCount = computed(() => {
    return alarms.value.filter(a => a.status === 'active').length
  })

  return {
    devices,
    realtimeData,
    alarms,
    wsConnected,
    setDevices,
    updateRealtimeData,
    addAlarm,
    setWsConnected,
    getDeviceRealtimeData,
    activeAlarmCount
  }
})
