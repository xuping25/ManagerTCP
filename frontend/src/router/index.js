import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/monitor'
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    children: [
      {
        path: 'monitor',
        name: 'Monitor',
        component: () => import('@/views/monitor/Index.vue'),
        meta: { title: '实时监控' }
      },
      {
        path: 'device',
        name: 'Device',
        component: () => import('@/views/device/Index.vue'),
        meta: { title: '设备管理' }
      },
      {
        path: 'alarm',
        name: 'Alarm',
        component: () => import('@/views/alarm/Index.vue'),
        meta: { title: '报警报表' }
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('@/views/history/Index.vue'),
        meta: { title: '历史数据' }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: { title: '自定义仪表板' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
