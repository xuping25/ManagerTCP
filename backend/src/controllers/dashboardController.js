const database = require('../models/database');
const logger = require('../utils/logger');

class DashboardController {
  async getDashboards(req, res) {
    try {
      const dashboards = await database.all(
        'SELECT * FROM dashboards ORDER BY is_default DESC, created_at DESC'
      );

      res.json({
        success: true,
        data: dashboards
      });
    } catch (error) {
      logger.error('Get dashboards error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDashboard(req, res) {
    try {
      const { id } = req.params;

      const dashboard = await database.get(
        'SELECT * FROM dashboards WHERE id = ?',
        [id]
      );

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found'
        });
      }

      // 解析布局JSON
      if (dashboard.layout) {
        dashboard.layout = JSON.parse(dashboard.layout);
      }

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createDashboard(req, res) {
    try {
      const { name, description, layout, is_default } = req.body;

      // 如果设置为默认,先取消其他默认
      if (is_default) {
        await database.run('UPDATE dashboards SET is_default = 0');
      }

      const result = await database.run(
        'INSERT INTO dashboards (name, description, layout, is_default) VALUES (?, ?, ?, ?)',
        [name, description, JSON.stringify(layout), is_default ? 1 : 0]
      );

      res.json({
        success: true,
        data: { id: result.id },
        message: 'Dashboard created successfully'
      });
    } catch (error) {
      logger.error('Create dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateDashboard(req, res) {
    try {
      const { id } = req.params;
      const { name, description, layout, is_default } = req.body;

      // 如果设置为默认,先取消其他默认
      if (is_default) {
        await database.run('UPDATE dashboards SET is_default = 0 WHERE id != ?', [id]);
      }

      await database.run(
        `UPDATE dashboards SET name = ?, description = ?, layout = ?,
         is_default = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, description, JSON.stringify(layout), is_default ? 1 : 0, id]
      );

      res.json({
        success: true,
        message: 'Dashboard updated successfully'
      });
    } catch (error) {
      logger.error('Update dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteDashboard(req, res) {
    try {
      const { id } = req.params;

      await database.run('DELETE FROM dashboards WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Dashboard deleted successfully'
      });
    } catch (error) {
      logger.error('Delete dashboard error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DashboardController();
