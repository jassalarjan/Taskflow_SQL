import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

/**
 * Workspace Context Middleware
 * 
 * Attaches workspace context to req.context for all authenticated requests
 * Must be used AFTER authentication middleware (auth.js)
 */
const workspaceContext = async (req, res, next) => {
  try {
    // Skip middleware for unauthenticated requests
    if (!req.user || !req.user.id) {
      return next();
    }

    const user = req.user;
    const workspaceId = user.workspaceId;

    // If user doesn't have a workspace, allow but set empty context
    if (!workspaceId) {
      req.context = {
        workspaceId: null,
        workspaceType: null,
        workspaceName: null,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
        },
      };
      return next();
    }

    // Fetch workspace if workspaceId exists
    const workspace = await Workspace.findByPk(workspaceId);

    req.context = {
      workspaceId: workspaceId,
      workspaceType: workspace?.type || null,
      workspaceName: workspace?.name || null,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    };

    next();
  } catch (error) {
    console.error('Workspace context error:', error);
    res.status(500).json({ message: 'Workspace context error', error: error.message });
  }
};

export default workspaceContext;
      return workspace.usage?.userCount < workspace.limits.maxUsers;
    };
    req.canAddTask = () => {
      if (workspace.type === 'CORE' || !workspace.limits?.maxTasks) return true;
      return workspace.usage?.taskCount < workspace.limits.maxTasks;
    };
    req.canAddTeam = () => {
      if (workspace.type === 'CORE' || !workspace.limits?.maxTeams) return true;
      return workspace.usage?.teamCount < workspace.limits.maxTeams;
    };

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to resolve workspace context',
      error: error.message 
    });
  }
};

export default workspaceContext;
