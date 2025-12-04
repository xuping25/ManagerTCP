# 国际化迁移指南

本系统已实现中文、英文、繁体中文三语言国际化支持。

## 已完成的工作

### 1. 安装依赖
- ✅ vue-i18n@^9.8.0

### 2. 创建语言包
- ✅ `/frontend/src/locales/zh-CN.js` - 简体中文
- ✅ `/frontend/src/locales/en-US.js` - 英文
- ✅ `/frontend/src/locales/zh-TW.js` - 繁体中文

### 3. 配置i18n
- ✅ `/frontend/src/i18n/index.js` - i18n配置
- ✅ `/frontend/src/main.js` - 集成到Vue应用
- ✅ Element Plus语言包自动切换

### 4. 实现语言切换
- ✅ Layout.vue - 添加语言切换下拉菜单
- ✅ 自动保存到localStorage
- ✅ 根据浏览器语言自动选择

## 页面国际化模式

### 在组件中使用国际化

```vue
<template>
  <div>
    <!-- 使用t()函数翻译文本 -->
    <h1>{{ t('layout.title') }}</h1>

    <!-- 在属性中使用 -->
    <el-button :label="t('common.add')" />

    <!-- 表格列标题 -->
    <el-table-column :label="t('device.name')" />

    <!-- 消息提示 -->
    <span>{{ t('common.total') }} {{ count }} {{ t('common.items') }}</span>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 在JavaScript中使用
const showMessage = () => {
  ElMessage.success(t('device.createSuccess'))
}
</script>
```

### 页面迁移步骤

#### 步骤1: 导入useI18n

```javascript
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
```

#### 步骤2: 替换硬编码文本

**替换前:**
```vue
<el-button type="primary">添加设备</el-button>
```

**替换后:**
```vue
<el-button type="primary">{{ t('device.addDevice') }}</el-button>
```

#### 步骤3: 替换消息提示

**替换前:**
```javascript
ElMessage.success('设备创建成功')
```

**替换后:**
```javascript
ElMessage.success(t('device.createSuccess'))
```

#### 步骤4: 替换确认对话框

**替换前:**
```javascript
ElMessageBox.confirm('确定要删除该设备吗?', '提示', {
  confirmButtonText: '确定',
  cancelButtonText: '取消',
  type: 'warning'
})
```

**替换后:**
```javascript
ElMessageBox.confirm(t('device.deleteConfirm'), t('common.confirm'), {
  confirmButtonText: t('common.confirm'),
  cancelButtonText: t('common.cancel'),
  type: 'warning'
})
```

## 需要迁移的页面列表

### 已迁移
- ✅ Layout.vue - 主布局和导航
- ✅ Monitor/Index-i18n.vue - 监控页面示例

### 待迁移
以下页面需要参考Monitor/Index-i18n.vue的模式进行迁移：

1. **设备管理 (Device/Index.vue)**
   - 导入: `const { t } = useI18n()`
   - 替换所有中文文本为 `t('device.*')`
   - 替换消息提示

2. **报警报表 (Alarm/Index.vue)**
   - 导入: `const { t } = useI18n()`
   - 替换所有中文文本为 `t('alarm.*')`
   - 替换图表标题

3. **历史数据 (History/Index.vue)**
   - 导入: `const { t } = useI18n()`
   - 替换所有中文文本为 `t('history.*')`
   - 替换图表标题

4. **自定义仪表板 (Dashboard/Index.vue)**
   - 导入: `const { t } = useI18n()`
   - 替换所有中文文本为 `t('dashboard.*')`

## 快速迁移模板

### 设备管理页面关键替换

```javascript
// 文本替换对照表
'设备列表' → t('device.list')
'添加设备' → t('device.addDevice')
'编辑设备' → t('device.editDevice')
'设备名称' → t('device.name')
'协议类型' → t('device.protocol')
'通讯方式' → t('device.connectionType')
'IP地址' → t('device.ipAddress')
'端口' → t('device.port')
'测试连接' → t('device.testConnection')
'数据点' → t('device.dataPoints')
'确定' → t('common.confirm')
'取消' → t('common.cancel')
'操作' → t('common.operations')

// 消息提示
'设备创建成功' → t('device.createSuccess')
'设备更新成功' → t('device.updateSuccess')
'删除成功' → t('device.deleteSuccess')
'连接测试成功' → t('device.testSuccess')
'连接测试失败' → t('device.testFailed')
'操作失败' → t('device.operationFailed')
'加载失败' → t('device.loadFailed')
```

## 添加新的翻译

如果需要添加新的翻译，请在三个语言包文件中同时添加：

### zh-CN.js
```javascript
device: {
  newField: '新字段'
}
```

### en-US.js
```javascript
device: {
  newField: 'New Field'
}
```

### zh-TW.js
```javascript
device: {
  newField: '新字段'
}
```

## 测试国际化

1. 启动开发服务器
```bash
cd frontend
npm run dev
```

2. 在浏览器中访问 `http://localhost:8080`

3. 点击页面右上角的语言切换按钮

4. 验证三种语言的切换效果：
   - 简体中文
   - English
   - 繁體中文

5. 刷新页面，确认语言设置已保存到localStorage

## 注意事项

1. **保持一致性**: 所有页面都应使用相同的翻译键
2. **避免硬编码**: 不要在代码中直接写中英文文本
3. **消息提示**: ElMessage和ElMessageBox的所有文本都应国际化
4. **动态文本**: 如果需要在翻译中插入变量，使用插值：
   ```javascript
   // 语言包
   message: '共有 {count} 个设备'

   // 使用
   t('message', { count: 10 })
   ```

5. **日期格式**: 可以根据语言调整moment.js的locale：
   ```javascript
   import moment from 'moment'
   import 'moment/locale/zh-cn'
   import 'moment/locale/zh-tw'

   // 根据当前语言设置
   moment.locale(locale.value === 'zh-CN' ? 'zh-cn' :
                 locale.value === 'zh-TW' ? 'zh-tw' : 'en')
   ```

## 批量迁移脚本示例

```javascript
// 简单的文本替换脚本参考
const replacements = {
  '添加': "{{ t('common.add') }}",
  '编辑': "{{ t('common.edit') }}",
  '删除': "{{ t('common.delete') }}",
  // ... 更多替换规则
}

// 使用VSCode的查找替换功能，或编写自动化脚本
```

## 后续优化建议

1. **数字和货币格式化**: 使用vue-i18n的numberFormat
2. **日期时间格式化**: 使用vue-i18n的datetimeFormat
3. **复数处理**: 使用vue-i18n的复数规则
4. **懒加载语言包**: 大型应用可以按需加载语言包
5. **翻译管理平台**: 使用第三方平台管理翻译内容

## 参考资料

- [Vue I18n官方文档](https://vue-i18n.intlify.dev/)
- [Element Plus国际化](https://element-plus.org/zh-CN/guide/i18n.html)
- 示例文件: `frontend/src/views/monitor/Index-i18n.vue`
