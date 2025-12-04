<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <h1>Manager UA - 工业设备管理系统</h1>
      </div>
      <div class="header-right">
        <el-badge :value="store.activeAlarmCount" :hidden="store.activeAlarmCount === 0" class="alarm-badge">
          <el-button :icon="Bell" circle />
        </el-badge>
        <el-tag :type="store.wsConnected ? 'success' : 'danger'" size="small">
          {{ store.wsConnected ? '已连接' : '未连接' }}
        </el-tag>
      </div>
    </el-header>

    <el-container>
      <el-aside width="200px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/monitor">
            <el-icon><Monitor /></el-icon>
            <span>实时监控</span>
          </el-menu-item>
          <el-menu-item index="/device">
            <el-icon><Setting /></el-icon>
            <span>设备管理</span>
          </el-menu-item>
          <el-menu-item index="/alarm">
            <el-icon><Bell /></el-icon>
            <span>报警报表</span>
          </el-menu-item>
          <el-menu-item index="/history">
            <el-icon><DataLine /></el-icon>
            <span>历史数据</span>
          </el-menu-item>
          <el-menu-item index="/dashboard">
            <el-icon><Grid /></el-icon>
            <span>自定义仪表板</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store'
import { Monitor, Setting, Bell, DataLine, Grid } from '@element-plus/icons-vue'
import websocket from '@/utils/websocket'

const route = useRoute()
const store = useAppStore()

const activeMenu = computed(() => route.path)

onMounted(() => {
  websocket.connect()
})

onUnmounted(() => {
  websocket.disconnect()
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.header {
  background-color: #242f42;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.alarm-badge {
  margin-right: 10px;
}

.sidebar {
  background-color: #304156;
  height: calc(100vh - 60px);
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
