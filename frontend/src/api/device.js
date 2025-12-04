import request from './request'

export const deviceApi = {
  // 获取所有设备
  getAllDevices() {
    return request.get('/devices')
  },

  // 获取单个设备
  getDevice(id) {
    return request.get(`/devices/${id}`)
  },

  // 创建设备
  createDevice(data) {
    return request.post('/devices', data)
  },

  // 更新设备
  updateDevice(id, data) {
    return request.put(`/devices/${id}`, data)
  },

  // 删除设备
  deleteDevice(id) {
    return request.delete(`/devices/${id}`)
  },

  // 测试连接
  testConnection(data) {
    return request.post('/devices/test', data)
  },

  // 获取设备的数据点
  getDataPoints(deviceId) {
    return request.get(`/devices/${deviceId}/datapoints`)
  },

  // 创建数据点
  createDataPoint(deviceId, data) {
    return request.post(`/devices/${deviceId}/datapoints`, data)
  },

  // 更新数据点
  updateDataPoint(id, data) {
    return request.put(`/datapoints/${id}`, data)
  },

  // 删除数据点
  deleteDataPoint(id) {
    return request.delete(`/datapoints/${id}`)
  },

  // 读取数据点
  readDataPoint(id) {
    return request.get(`/datapoints/${id}/read`)
  },

  // 写入数据点
  writeDataPoint(id, value) {
    return request.post(`/datapoints/${id}/write`, { value })
  }
}
