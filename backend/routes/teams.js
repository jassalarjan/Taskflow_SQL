import express from 'express';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { Team, User, Workspace } from '../models/index.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';
import { emitWorkspaceEvent } from '../utils/socketEvents.js';

const router = express.Router();

router.post('/', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { name, hr_id, lead_id, member_ids } = req.body;

    const isAdminTeam = name && name.toLowerCase() === 'admin';
    
    if (isAdminTeam) {
      return res.status(400).json({ 
        message: 'Admin team is reserved for super users only. Please use a different team name or create teams without HR designation for admin users.',
        hint: 'Admin users do not need to be part of a team structure'
      });
    }

    let hr = null;
    let lead = null;
    
    if (hr_id) {
      hr = await User.findByPk(hr_id);
      if (!hr) {
        return res.status(400).json({ message: 'HR user not found' });
      }
      if (hr.role !== 'hr' && hr.role !== 'admin') {
        return res.status(400).json({ message: 'Selected HR user must have HR or Admin role' });
      }
    }
    
    if (lead_id) {
      lead = await User.findByPk(lead_id);
      if (!lead) {
        return res.status(400).json({ message: 'Team Lead not found' });
      }
      if (!['team_lead', 'admin'].includes(lead.role)) {
        return res.status(400).json({ message: 'Selected team lead must have Team Lead or Admin role' });
      }
    }

    const finalHrId = hr_id || req.user.id;
    const finalLeadId = lead_id || req.user.id;

    const team = await Team.create({
      name,
      hr_id: finalHrId,
      lead_id: finalLeadId
    });

    if (finalLeadId) {
      await User.update(
        { team_id: team.id },
        { where: { id: finalLeadId } }
      );
    }

    if (member_ids && member_ids.length > 0) {
      await User.update(
        { team_id: team.id },
        { where: { id: { [Op.in]: member_ids } } }
      );
    }

    const populatedTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    emitWorkspaceEvent(req, 'team:created', populatedTeam);

    res.status(201).json({ message: 'Team created', team: populatedTeam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all teams (HR & Admin)
router.get('/', authenticate, checkRole(['admin', 'hr', 'team_lead', 'community_admin']), async (req, res) => {
  try {
    const where = {};
    
    if (req.user.role === 'team_lead') {
      where.lead_id = req.user.id;
    }

    const teams = await Team.findAll({
      where,
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ],
      order: [['pinned', 'DESC'], ['priority', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({ teams, count: teams.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single team
router.get('/:id', authenticate, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({ team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update team (HR, Admin & Community Admin)
router.patch('/:id', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { name, lead_id } = req.body;
    const updates = {};

    if (name && name.toLowerCase() === 'admin') {
      return res.status(400).json({ 
        message: 'Admin team name is reserved for super users only',
        hint: 'Please choose a different team name'
      });
    }

    if (name) updates.name = name;
    if (lead_id) {
      const lead = await User.findOne({ 
        where: { id: lead_id, workspaceId: req.context.workspaceId }
      });
      if (!lead) {
        return res.status(400).json({ message: 'Team lead not found' });
      }
      
      const isCommunityWorkspace = req.context.workspaceType === 'COMMUNITY';
      if (!isCommunityWorkspace && !['team_lead', 'admin'].includes(lead.role)) {
        return res.status(400).json({ message: 'Selected user must have Team Lead or Admin role' });
      }
      
      updates.lead_id = lead_id;
    }

    const [updated] = await Team.update(updates, {
      where: { id: req.params.id, workspaceId: req.context.workspaceId }
    });

    if (!updated) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = await Team.findByPk(req.params.id, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    emitWorkspaceEvent(req, 'team:updated', team);

    res.json({ message: 'Team updated', team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle team pin status (Admin, HR & Community Admin)
router.patch('/:id/pin', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findOne({ where: { id, workspaceId: req.context.workspaceId } });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const newPinned = !team.pinned;
    let newPriority = team.priority;
    
    if (newPinned) {
      const maxPriorityTeam = await Team.findOne({
        where: { workspaceId: req.context.workspaceId },
        order: [['priority', 'DESC']],
        attributes: ['priority']
      });
      newPriority = maxPriorityTeam ? maxPriorityTeam.priority + 1 : 1;
    }

    await team.update({ pinned: newPinned, priority: newPriority });

    const updatedTeam = await Team.findByPk(id, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    res.json({ 
      message: newPinned ? 'Team pinned' : 'Team unpinned', 
      team: updatedTeam 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update team priority (Admin, HR & Community Admin)
router.patch('/:id/priority', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (typeof priority !== 'number') {
      return res.status(400).json({ message: 'Priority must be a number' });
    }

    const [updated] = await Team.update(
      { priority },
      { where: { id, workspaceId: req.context.workspaceId } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const team = await Team.findByPk(id, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    res.json({ message: 'Team priority updated', team });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reorder teams (Admin, HR & Community Admin)
router.post('/reorder', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { teamOrder } = req.body;

    if (!Array.isArray(teamOrder) || teamOrder.length === 0 || teamOrder.length > 200) {
      return res.status(400).json({ message: 'teamOrder must be an array' });
    }

    for (const item of teamOrder) {
      const teamId = parseInt(item?.id, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: 'Invalid team ID' });
      }
      await Team.update(
        { priority: teamOrder.length - teamOrder.indexOf(item) },
        { where: { id: teamId, workspaceId: req.context.workspaceId } }
      );
    }

    res.json({ message: 'Teams reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add member to team (Admin, HR & Community Admin)
router.post('/:id/members', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { userId } = req.body;
    const teamId = parseInt(req.params.id, 10);

    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const user = await User.findOne({ 
      where: { id: userId, workspaceId: req.context.workspaceId }
    });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const team = await Team.findOne({ 
      where: { id: teamId, workspaceId: req.context.workspaceId }
    });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (user.team_id === teamId) {
      return res.status(400).json({ message: 'User already in team' });
    }

    await User.update(
      { team_id: teamId },
      { where: { id: userId } }
    );

    const updatedTeam = await Team.findByPk(teamId, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    res.json({ message: 'Member added to team', team: updatedTeam });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add multiple members to team (Admin, HR & Community Admin)
router.post('/:id/members/bulk', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const userIds = req.body.userIds;
    
    if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 500) {
      return res.status(400).json({ message: 'userIds must be an array with 1-500 items' });
    }

    const teamId = parseInt(req.params.id, 10);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findOne({ 
      where: { id: teamId, workspaceId: req.context.workspaceId }
    });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const results = { added: [], skipped: [], failed: [] };

    for (const userId of userIds) {
      try {
        const user = await User.findOne({ 
          where: { id: userId, workspaceId: req.context.workspaceId }
        });
        if (!user) {
          results.failed.push({ userId, reason: 'User not found' });
          continue;
        }

        if (user.team_id === teamId) {
          results.skipped.push({ userId, name: user.full_name, reason: 'Already a member' });
          continue;
        }

        await User.update(
          { team_id: teamId },
          { where: { id: userId } }
        );

        results.added.push({ userId, name: user.full_name });
      } catch (error) {
        results.failed.push({ userId, reason: error.message });
      }
    }

    const updatedTeam = await Team.findByPk(teamId, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    res.json({ 
      message: `Added ${results.added.length} member(s) to team`,
      results,
      team: updatedTeam 
    });
} catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove member from team (Admin, HR & Community Admin)
// This route MUST come before DELETE /:id to avoid route conflict
router.delete('/:id/members/:userId', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(teamId) || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid team ID or user ID format' });
    }

    // Verify team exists in workspace
    const team = await Team.findOne({ 
      where: { id: teamId, workspaceId: req.context.workspaceId } 
    });
    if (!team) {
      return res.status(404).json({ message: 'Team not found in your workspace' });
    }

    // Check if user is a member
    const member = await User.findOne({ 
      where: { id: userId, team_id: teamId, workspaceId: req.context.workspaceId } 
    });
    
    if (!member) {
      return res.status(400).json({ 
        message: 'User is not a member of this team'
      });
    }

    // Prevent removing HR or Team Lead from their own team
    if (team.hr_id === userId || team.lead_id === userId) {
      const role = team.hr_id === userId && team.lead_id === userId ? 'HR and Team Lead' : 
                   team.hr_id === userId ? 'HR' : 'Team Lead';
      return res.status(400).json({ 
        message: `Cannot remove the ${role} from their own team. Please reassign the ${role} role first.` 
      });
    }

    // Get user details for logging before removal
    const removedUserName = member.full_name;
    const removedUserEmail = member.email;

    // Remove from team by clearing team_id
    await User.update(
      { team_id: null },
      { where: { id: userId } }
    );

    // Fetch updated team with members
    const updatedTeam = await Team.findByPk(teamId, {
      include: [
        { model: User, as: 'hr', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'lead', attributes: ['id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'full_name', 'email', 'role'] }
      ]
    });

    emitWorkspaceEvent(req, 'team:updated', updatedTeam);

    // Log team member removal
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'team_member_removed',
      user: req.user,
      user_ip,
      target_type: 'team',
      target_id: String(teamId),
      target_name: team.name,
      action: 'Removed team member',
      description: `${req.user.full_name} removed ${removedUserName} from team "${team.name}"`,
      metadata: {
        removedMemberName: removedUserName,
        removedMemberEmail: removedUserEmail,
        teamName: team.name,
        workspaceId: req.context.workspaceId
      },
      workspaceId: req.context.workspaceId
    });

    res.json({ 
      message: 'Member removed from team successfully', 
      team: updatedTeam 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error while removing member', 
      error: error.message 
    });
  }
});

// Delete team (Admin, HR & Community Admin)
// This route MUST come after DELETE /:id/members/:userId to avoid route conflict
router.delete('/:id', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const teamId = parseInt(req.params.id, 10);

    if (isNaN(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID format' });
    }

    // Verify team exists in workspace
    const team = await Team.findOne({ 
      where: { id: teamId, workspaceId: req.context.workspaceId } 
    });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const teamName = team.name;

    // Get count of team members before deletion
    const memberCount = await User.count({ 
      where: { team_id: teamId } 
    });

    // Remove all members from this team by clearing team_id
    await User.update(
      { team_id: null },
      { where: { team_id: teamId, workspaceId: req.context.workspaceId } }
    );

    // Delete the team
    await Team.destroy({ 
      where: { id: teamId, workspaceId: req.context.workspaceId } 
    });

    // Update workspace usage
    const workspace = await Workspace.findByPk(req.context.workspaceId);
    if (workspace && workspace.usage) {
      const usage = workspace.usage;
      usage.teamCount = Math.max(0, (usage.teamCount || 1) - 1);
      await workspace.update({ usage });
    }

    emitWorkspaceEvent(req, 'team:deleted', { id: teamId, name: teamName });

    // Log team deletion
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'team_deleted',
      user: req.user,
      user_ip,
      target_type: 'team',
      target_id: String(teamId),
      target_name: teamName,
      action: 'Deleted team',
      description: `${req.user.full_name} deleted team "${teamName}"`,
      metadata: {
        memberCount: memberCount,
        workspaceId: req.context.workspaceId
      },
      workspaceId: req.context.workspaceId
    });

    res.json({ 
      message: 'Team deleted successfully',
      team: { 
        id: teamId, 
        name: teamName,
        usersAffected: memberCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk delete all teams (Admin, HR & Community Admin)
router.delete('/bulk/all', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    // Get all teams in current workspace
    const teams = await Team.findAll({ 
      where: { workspaceId: req.context.workspaceId }
    });
    
    if (teams.length === 0) {
      return res.status(404).json({ message: 'No teams found to delete' });
    }

    const teamIds = teams.map(t => t.id);
    const teamNames = teams.map(t => t.name);
    const teamCount = teams.length;

    // Remove all team assignments from users
    await User.update(
      { team_id: null },
      { where: { team_id: { [Op.in]: teamIds }, workspaceId: req.context.workspaceId } }
    );

    // Delete all teams in this workspace
    await Team.destroy({ 
      where: { workspaceId: req.context.workspaceId } 
    });

    // Update workspace usage
    const workspace = await Workspace.findByPk(req.context.workspaceId);
    if (workspace && workspace.usage) {
      const usage = workspace.usage;
      usage.teamCount = 0;
      await workspace.update({ usage });
    }

    emitWorkspaceEvent(req, 'team:bulk-deleted', {
      count: teamCount,
      workspaceId: req.context.workspaceId
    });

    // Log bulk team deletion
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'team_bulk_deleted',
      user: req.user,
      user_ip,
      target_type: 'team',
      target_id: teamIds.map(id => String(id)),
      target_name: `Bulk delete: ${teamCount} teams`,
      action: 'Bulk deleted teams',
      description: `${req.user.full_name} deleted ${teamCount} team(s) in bulk`,
      metadata: {
        deletedTeamIds: teamIds.map(id => String(id)),
        deletedTeamCount: teamCount,
        teamNames: teamNames,
        workspaceId: req.context.workspaceId
      },
      workspaceId: req.context.workspaceId
    });

    res.json({
      message: `Successfully deleted ${teamCount} team(s)`,
      count: teamCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

