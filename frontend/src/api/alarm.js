import request from './request'

export const alarmApi = {
  // 获取报警列表
  getAlarms(params) {
    return request.get('/alarms', { params })
  },

  // 确认报警
  acknowledgeAlarm(id, user) {
    return request.post(`/alarms/${id}/acknowledge`, { user })
  },

  // 获取报警统计
  getAlarmStatistics(params) {
    return request.get('/alarms/statistics', { params })
  }
}
