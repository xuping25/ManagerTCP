import request from './request'

export const historyApi = {
  // 获取历史数据
  getHistoryData(dataPointId, params) {
    return request.get(`/history/${dataPointId}`, { params })
  },

  // 获取聚合数据
  getAggregatedData(dataPointId, params) {
    return request.get(`/history/${dataPointId}/aggregated`, { params })
  },

  // 导出历史数据
  exportHistoryData(data) {
    return request.post('/history/export', data, {
      responseType: 'blob'
    })
  }
}
