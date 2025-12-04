<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <h1>{{ t('layout.title') }}</h1>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleLanguageChange" class="language-selector">
          <el-button>
            <el-icon><Globe /></el-icon>
            {{ currentLanguageName }}
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zh-CN">简体中文</el-dropdown-item>
              <el-dropdown-item command="en-US">English</el-dropdown-item>
              <el-dropdown-item command="zh-TW">繁體中文</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-badge :value="store.activeAlarmCount" :hidden="store.activeAlarmCount === 0" class="alarm-badge">
          <el-button :icon="Bell" circle />
        </el-badge>
        <el-tag :type="store.wsConnected ? 'success' : 'danger'" size="small">
          {{ store.wsConnected ? t('common.connected') : t('common.disconnected') }}
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
            <span>{{ t('nav.monitor') }}</span>
          </el-menu-item>
          <el-menu-item index="/device">
            <el-icon><Setting /></el-icon>
            <span>{{ t('nav.device') }}</span>
          </el-menu-item>
          <el-menu-item index="/alarm">
            <el-icon><Bell /></el-icon>
            <span>{{ t('nav.alarm') }}</span>
          </el-menu-item>
          <el-menu-item index="/history">
            <el-icon><DataLine /></el-icon>
            <span>{{ t('nav.history') }}</span>
          </el-menu-item>
          <el-menu-item index="/dashboard">
            <el-icon><Grid /></el-icon>
            <span>{{ t('nav.dashboard') }}</span>
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
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store'
import { Monitor, Setting, Bell, DataLine, Grid, Globe } from '@element-plus/icons-vue'
import websocket from '@/utils/websocket'

const route = useRoute()
const store = useAppStore()
const { t, locale } = useI18n()

const activeMenu = computed(() => route.path)

const currentLanguageName = computed(() => {
  const names = {
    'zh-CN': '简体中文',
    'en-US': 'English',
    'zh-TW': '繁體中文'
  }
  return names[locale.value] || '简体中文'
})

const handleLanguageChange = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

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

.language-selector {
  margin-right: 10px;
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
