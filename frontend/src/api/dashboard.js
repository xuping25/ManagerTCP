import request from './request'

export const dashboardApi = {
  // 获取所有仪表板
  getDashboards() {
    return request.get('/dashboards')
  },

  // 获取单个仪表板
  getDashboard(id) {
    return request.get(`/dashboards/${id}`)
  },

  // 创建仪表板
  createDashboard(data) {
    return request.post('/dashboards', data)
  },

  // 更新仪表板
  updateDashboard(id, data) {
    return request.put(`/dashboards/${id}`, data)
  },

  // 删除仪表板
  deleteDashboard(id) {
    return request.delete(`/dashboards/${id}`)
  }
}
