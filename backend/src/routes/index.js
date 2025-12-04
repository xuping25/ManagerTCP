const express = require('express');
const deviceController = require('../controllers/deviceController');
const dataPointController = require('../controllers/dataPointController');
const historyController = require('../controllers/historyController');
const alarmController = require('../controllers/alarmController');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// 设备管理路由
router.get('/devices', deviceController.getAllDevices);
router.get('/devices/:id', deviceController.getDevice);
router.post('/devices', deviceController.createDevice);
router.put('/devices/:id', deviceController.updateDevice);
router.delete('/devices/:id', deviceController.deleteDevice);
router.post('/devices/test', deviceController.testConnection);

// 数据点路由
router.get('/devices/:deviceId/datapoints', dataPointController.getDataPoints);
router.post('/devices/:deviceId/datapoints', dataPointController.createDataPoint);
router.put('/datapoints/:id', dataPointController.updateDataPoint);
router.delete('/datapoints/:id', dataPointController.deleteDataPoint);
router.get('/datapoints/:id/read', dataPointController.readDataPoint);
router.post('/datapoints/:id/write', dataPointController.writeDataPoint);

// 历史数据路由
router.get('/history/:dataPointId', historyController.getHistoryData);
router.get('/history/:dataPointId/aggregated', historyController.getAggregatedData);
router.post('/history/export', historyController.exportHistoryData);

// 报警路由
router.get('/alarms', alarmController.getAlarms);
router.post('/alarms/:id/acknowledge', alarmController.acknowledgeAlarm);
router.get('/alarms/statistics', alarmController.getAlarmStatistics);

// 仪表板路由
router.get('/dashboards', dashboardController.getDashboards);
router.get('/dashboards/:id', dashboardController.getDashboard);
router.post('/dashboards', dashboardController.createDashboard);
router.put('/dashboards/:id', dashboardController.updateDashboard);
router.delete('/dashboards/:id', dashboardController.deleteDashboard);

module.exports = router;
