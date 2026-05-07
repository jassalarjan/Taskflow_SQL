import { Op } from 'sequelize';
import ChangeLog from '../models/ChangeLog.js';
import User from '../models/User.js';

/**
 * Create a change log entry
 * WORKSPACE SUPPORT: Now accepts workspaceId parameter
 */
export const logChange = async (params) => {
  try {
    let logData = {};

    if (params.event_type) {
      logData = {
        event_type: params.event_type,
        user_id: params.user?.id || params.user?.userId || null,
        user_email: params.user?.email,
        user_name: params.user?.full_name,
        user_role: params.user?.role,
        user_ip: params.user_ip,
        target_type: params.target_type,
        target_id: params.target_id,
        target_name: params.target_name,
        action: params.action,
        description: params.description,
        metadata: params.metadata || {},
        changes: params.changes || {},
        workspaceId: params.workspaceId
      };
    } else {
      const { userId, workspaceId, action, entity, entityId, details, ipAddress } = params;

      const eventTypeMap = {
        attendance: 'user_action',
        leave_request: 'leave_action',
        leave_type: 'leave_type_action',
        holiday: 'holiday_action',
        email_template: 'email_action',
        user: 'user_action',
        task: 'task_action',
        team: 'team_action',
        workspace: 'workspace_action'
      };

      logData = {
        event_type: eventTypeMap[entity] || 'system_event',
        user_id: userId,
        user_ip: ipAddress,
        target_type: entity,
        target_id: entityId,
        action: action,
        description: `${action} ${entity}: ${JSON.stringify(details || {})}`,
        metadata: details || {},
        workspaceId: workspaceId
      };
    }

    return await ChangeLog.create(logData);
  } catch (error) {
    return null;
  }
};

/**
 * Get change logs with filters and pagination
 * WORKSPACE SUPPORT: Now requires workspaceId parameter (or includeAllWorkspaces for system admins)
 */
export const getChangeLogs = async ({
  page = 1,
  limit = 50,
  event_type,
  user_id,
  target_type,
  start_date,
  end_date,
  search,
  workspaceId,
  includeAllWorkspaces = false  // For system admins to view all logs
}) => {
  try {
    const where = {};
    
    if (!includeAllWorkspaces) {
      where.workspaceId = workspaceId;
    }

    if (event_type) {
      where.event_type = event_type;
    }

    if (user_id) {
      where.user_id = user_id;
    }

    if (target_type) {
      where.target_type = target_type;
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.created_at[Op.lte] = new Date(end_date);
      }
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { action: { [Op.like]: `%${search}%` } },
        { user_email: { [Op.like]: `%${search}%` } },
        { user_name: { [Op.like]: `%${search}%` } },
        { target_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const [logs, total] = await Promise.all([
      ChangeLog.findAll({
        where,
        order: [['created_at', 'DESC']],
        offset: (page - 1) * limit,
        limit,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email', 'role']
        }]
      }),
      ChangeLog.count({ where })
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get change log statistics
 */
export const getChangeLogStats = async ({ start_date, end_date }) => {
  try {
    const where = {};
    
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.created_at[Op.lte] = new Date(end_date);
      }
    }

    const allLogs = await ChangeLog.findAll({ where, raw: true });

    const statsMap = new Map();
    const userMap = new Map();

    for (const log of allLogs) {
      statsMap.set(log.event_type, (statsMap.get(log.event_type) || 0) + 1);

      const userKey = log.user_id || `${log.user_email || ''}-${log.user_name || ''}`;
      const existing = userMap.get(userKey) || {
        _id: log.user_id,
        user_name: log.user_name,
        user_email: log.user_email,
        count: 0
      };
      existing.count += 1;
      userMap.set(userKey, existing);
    }

    const stats = Array.from(statsMap.entries())
      .map(([event_type, count]) => ({ _id: event_type, count }))
      .sort((a, b) => b.count - a.count);

    const userActivity = Array.from(userMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: allLogs.length,
      by_event_type: stats,
      top_users: userActivity
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export change logs to CSV format
 */
export const exportChangeLogs = async (query) => {
  try {
    const logs = await ChangeLog.findAll({
      where: query,
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'email', 'role']
      }]
    });

    return logs;
  } catch (error) {
    throw error;
  }
};
