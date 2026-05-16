import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { getChangeLogs, getChangeLogStats, exportChangeLogs, logChange } from '../utils/changeLogService.js';
import ChangeLog from '../models/ChangeLog.js';
import User from '../models/User.js';
import getClientIP from '../utils/getClientIP.js';

const router = express.Router();

router.get('/', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      event_type,
      user_id,
      target_type,
      start_date,
      end_date,
      search
    } = req.query;

    const result = await getChangeLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      event_type,
      user_id,
      target_type,
      start_date,
      end_date,
      search
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching change logs', error: error.message });
  }
});

router.get('/stats', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const stats = await getChangeLogStats({ start_date, end_date });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

router.get('/export', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { event_type, user_id, target_type, start_date, end_date, search } = req.query;
    
    const result = await getChangeLogs({
      page: 1,
      limit: 10000,
      event_type,
      user_id,
      target_type,
      start_date,
      end_date,
      search
    });

    const csvHeader = 'Timestamp,Event Type,User,Email,Role,IP Address,Action,Target Type,Target Name,Description\n';
    const csvRows = result.logs.map(log => {
      return [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.user_name || 'System',
        log.user_email || 'N/A',
        log.user_role || 'N/A',
        log.user_ip || 'N/A',
        log.action,
        log.target_type || 'N/A',
        log.target_name || 'N/A',
        `"${(log.description || '').replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=changelog-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting change logs', error: error.message });
  }
});

router.get('/event-types', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const eventTypes = [
      'user_login', 'user_logout', 'user_created', 'user_updated', 'user_deleted',
      'task_created', 'task_updated', 'task_deleted', 'task_status_changed', 'task_assigned', 'task_unassigned',
      'team_created', 'team_updated', 'team_deleted', 'team_member_added', 'team_member_removed',
      'report_generated', 'automation_triggered', 'notification_sent',
      'comment_added', 'comment_updated', 'comment_deleted',
      'bulk_import', 'system_event'
    ];
    res.json(eventTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event types', error: error.message });
  }
});

router.delete('/clear', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const deleted = await ChangeLog.destroy({
      where: {
        created_at: { [require('sequelize').Op.lt]: cutoffDate }
      }
    });

    await logChange({
      event_type: 'changelog_cleared',
      user: { id: req.user.id, email: req.user.email, full_name: req.user.full_name, role: req.user.role },
      user_ip: getClientIP(req),
      target_type: 'changelog',
      action: 'Cleared changelog logs',
      description: `${req.user.full_name} cleared ${deleted} changelog record(s) older than ${days} days`,
      metadata: { deletedCount: deleted, daysThreshold: parseInt(days) }
    });

    res.json({ message: `Successfully deleted logs older than ${days} days`, deleted_count: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing change logs', error: error.message });
  }
});

router.get('/export/excel', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const xlsx = await import('xlsx');
    
    const result = await getChangeLogs({ page: 1, limit: 10000 });
    
    const logData = result.logs.map(log => ({
      'Timestamp': log.created_at ? new Date(log.created_at).toLocaleString() : '',
      'Event Type': log.event_type,
      'Action': log.action,
      'User': log.user_name || '',
      'User Email': log.user_email || '',
      'Target Type': log.target_type || '',
      'Target Name': log.target_name || '',
      'Description': log.description || '',
      'IP Address': log.user_ip || ''
    }));

    const worksheet = xlsx.default.utils.json_to_sheet(logData);
    const workbook = xlsx.default.utils.book_new();
    xlsx.default.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
    const buffer = xlsx.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-export-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/export/json', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const result = await getChangeLogs({ page: 1, limit: 10000 });
    
    const exportData = result.logs.map(log => ({
      event_type: log.event_type,
      action: log.action,
      user_id: log.user_id,
      user_name: log.user_name,
      user_email: log.user_email,
      target_type: log.target_type,
      target_id: log.target_id,
      target_name: log.target_name,
      description: log.description,
      user_ip: log.user_ip,
      metadata: log.metadata,
      changes: log.changes,
      created_at: log.created_at
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-export-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;