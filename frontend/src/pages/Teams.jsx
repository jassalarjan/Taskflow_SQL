import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import api from '../api/axios';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Plus, X, Users, UserPlus, UserMinus, Trash2, Pin, GripVertical, Search, Filter, Menu, Edit, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

const Teams = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const confirmModal = useConfirmModal();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hr_id: '',
    lead_id: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    lead_id: '',
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]); // For multi-select
  const [isMultiSelect, setIsMultiSelect] = useState(false); // Toggle multi-select mode
  const [draggedTeam, setDraggedTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Search query for filtering users
  const [roleFilter, setRoleFilter] = useState('all'); // Role filter

  useEffect(() => {
    if (user?.id) {
      fetchTeams();
      // Only fetch users for admin, HR and community_admin (team leads don't need all users)
      if (['admin', 'hr', 'community_admin'].includes(user?.role)) {
        fetchUsers();
      }
    }
  }, [user?.id, user?.role]);

  // Real-time synchronization
  useRealtimeSync({
    onTeamCreated: () => {
      if (user?.id) fetchTeams();
    },
    onTeamUpdated: () => {
      if (user?.id) fetchTeams();
    },
    onTeamDeleted: () => {
      if (user?.id) fetchTeams();
    },
    onUserUpdated: () => {
      if (['admin', 'hr', 'community_admin'].includes(user?.role)) fetchUsers();
    },
  });

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      let fetchedTeams = response.data.teams;
      
      // Filter teams for team leads - show only their team(s)
      if (user?.role === 'team_lead') {
        fetchedTeams = fetchedTeams.filter(team => 
          team.lead_id?._id === user?.id || team.lead_id === user?.id
        );
      }
      
      setTeams(fetchedTeams);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      // Error fetching users
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', formData);
      setShowCreateModal(false);
      setFormData({ name: '', hr_id: '', lead_id: '' });
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setEditFormData({
      name: team.name,
      lead_id: team.lead_id?._id || team.lead_id || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/teams/${selectedTeam.id}`, editFormData);
      setShowEditModal(false);
      setEditFormData({ name: '', lead_id: '' });
      setSelectedTeam(null);
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update team');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    try {
      if (isMultiSelect && selectedUserIds.length > 0) {
        // Bulk add members
        const response = await api.post(`/teams/${selectedTeam.id}/members/bulk`, {
          userIds: selectedUserIds,
        });
        
        const { results } = response.data;
        let message = `Added ${results.added.length} member(s)`;
        if (results.skipped.length > 0) {
          message += `, skipped ${results.skipped.length} (already members)`;
        }
        if (results.failed.length > 0) {
          message += `, failed ${results.failed.length}`;
        }
        
        alert(message);
      } else if (selectedUserId) {
        // Single add member
        await api.post(`/teams/${selectedTeam.id}/members`, {
          userId: selectedUserId,
        });
      }
      
      setShowAddMemberModal(false);
      setSelectedUserId('');
      setSelectedUserIds([]);
      setIsMultiSelect(false);
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    const availableUsers = users.filter((u) => !selectedTeam?.members?.some((m) => m._id === u._id));
    
    if (selectedUserIds.length === availableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(availableUsers.map(u => u._id));
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    const confirmed = await confirmModal.show({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the team? They will no longer have access to team resources.',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await api.delete(`/teams/${teamId}/members/${userId}`);
          fetchTeams();
        } catch (error) {
          alert(error.response?.data?.message || 'Failed to remove member');
        }
      },
    });

    if (confirmed) {
      try {
        const response = await api.delete(`/teams/${teamId}/members/${userId}`);
        fetchTeams();
        if (response.data?.message) {
          alert(response.data.message);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to remove member';
        const debugInfo = error.response?.data?.debug ? ` (${error.response.data.debug})` : '';
        alert(errorMsg + debugInfo);
      }
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    const confirmed = await confirmModal.show({
      title: 'Delete Team',
      message: `Are you sure you want to delete team "${teamName}"? All members will be unassigned from this team and this action cannot be undone.`,
      confirmText: 'Delete Team',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await api.delete(`/teams/${teamId}`);
        fetchTeams();
        alert('Team deleted successfully');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete team');
      }
    }
  };

  const handleDeleteAllTeams = async () => {
    if (teams.length === 0) {
      alert('No teams to delete');
      return;
    }

    const confirmed = await confirmModal.show({
      title: 'Delete All Teams',
      message: `WARNING: You are about to delete ALL ${teams.length} team(s). All members will be unassigned. This action CANNOT be undone. Are you absolutely sure?`,
      confirmText: `Delete ${teams.length} Team(s)`,
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        setLoading(true);
        await api.delete('/teams/bulk/all');
        fetchTeams();
        alert(`Successfully deleted all teams`);
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete teams');
        setLoading(false);
      }
    }
  };

  const handleTogglePin = async (teamId) => {
    try {
      await api.patch(`/teams/${teamId}/pin`);
      fetchTeams();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle pin');
    }
  };

  const handleDragStart = (e, team) => {
    setDraggedTeam(team);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetTeam) => {
    e.preventDefault();
    
    if (!draggedTeam || draggedTeam._id === targetTeam._id) {
      setDraggedTeam(null);
      return;
    }

    // Reorder teams array
    const updatedTeams = [...teams];
    const draggedIndex = updatedTeams.findIndex(t => t.id === draggedTeam.id);
    const targetIndex = updatedTeams.findIndex(t => t.id === targetTeam.id);

    updatedTeams.splice(draggedIndex, 1);
    updatedTeams.splice(targetIndex, 0, draggedTeam);

    // Update local state immediately for smooth UX
    setTeams(updatedTeams);

    // Send new order to backend
    try {
      const teamOrder = updatedTeams.map((team, index) => ({
        id: team.id,
        priority: updatedTeams.length - index
      }));
      
      await api.post('/teams/reorder', { teamOrder });
    } catch (error) {
      // Revert on error
      fetchTeams();
    }

    setDraggedTeam(null);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
              <div className="loading-bar-container">
                <div className="loading-bar bg-[#136dec]"></div>
              </div>
              <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Loading teams...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!['admin', 'hr', 'team_lead', 'community_admin'].includes(user?.role)) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className={`text-xl ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>You don't have permission to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`} data-testid="teams-page">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileSidebar}
              className={`lg:hidden ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {user?.role === 'team_lead' ? 'My Team' : 'Teams'}
              </h1>
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mt-2`}>
                {user?.role === 'team_lead' 
                  ? 'Manage your team and members' 
                  : 'Manage your teams and members'}
              </p>
            </div>
          </div>
          {['admin', 'hr', 'community_admin'].includes(user?.role) && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAllTeams}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600 hover:text-white'
                    : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white'
                }`}
                title="Delete all teams"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-[#136dec] text-white rounded-lg font-medium text-sm hover:bg-[#1158c7] transition-colors flex items-center gap-2 shadow-lg shadow-[#136dec]/25"
                data-testid="create-team-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Create Team</span>
              </button>
            </div>
          )}
        </div>

        {teams.length === 0 ? (
          <div className={`rounded-lg shadow-lg p-12 text-center border ${
            theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'
          }`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {user?.role === 'team_lead' ? 'No Team Assigned' : 'No Teams Yet'}
            </h3>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
              {user?.role === 'team_lead' 
                ? 'You are not currently assigned as a team lead. Please contact an administrator.'
                : 'Get started by creating your first team.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
            <div
              key={team.id}
              draggable={['admin', 'hr', 'community_admin'].includes(user?.role)}
              onDragStart={(e) => handleDragStart(e, team)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, team)}
              className={`rounded-xl shadow-lg p-5 relative border-2 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] ${
                theme === 'dark' 
                  ? 'bg-[#1c2027] border-[#282f39] hover:border-[#3e454f]' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${draggedTeam?.id === team.id ? 'opacity-50' : ''} ${['admin', 'hr', 'community_admin'].includes(user?.role) ? 'cursor-move' : ''}`}
              data-testid="team-card"
            >
              {/* Pin Indicator */}
              {team.pinned && (
                <div className="absolute top-3 left-3">
                  <Pin className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
              )}

              {/* Drag Handle for Admin/HR/Community Admin */}
              {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                <div className="absolute top-3 right-3">
                  <GripVertical className={`w-5 h-5 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                </div>
              )}

              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-[#136dec]/20' : 'bg-blue-100'}`}>
                    <Users className="w-5 h-5 text-[#136dec]" />
                  </div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{team.name}</h3>
                </div>
                {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#282f39] text-[#9da8b9] hover:text-blue-400' : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                      title="Edit Team"
                      data-testid="edit-team-btn"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePin(team.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        team.pinned ? 'text-yellow-500' : theme === 'dark' ? 'hover:bg-[#282f39] text-[#9da8b9] hover:text-yellow-400' : 'hover:bg-gray-100 text-gray-400 hover:text-yellow-500'
                      }`}
                      title={team.pinned ? 'Unpin Team' : 'Pin Team'}
                      data-testid="pin-team-btn"
                    >
                      <Pin className={`w-4 h-4 ${team.pinned ? 'fill-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#282f39] text-[#9da8b9] hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'}`}
                      title="Delete Team"
                      data-testid="delete-team-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className={`space-y-3 mb-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>HR</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{team.hr_id?.full_name || 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>Team Lead</span>
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{team.lead_id?.full_name || 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>Members</span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-[#136dec] text-white' : 'bg-blue-100 text-blue-700'}`}>{team.members?.length || 0}</span>
                </div>
              </div>

              <div className={`border-t pt-4 ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
                <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Team Members</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((member, index) => {
                      const isHR = team.hr_id?._id === member._id;
                      const isLead = team.lead_id?._id === member._id;
                      const isHROrLead = isHR || isLead;
                      const roleLabel = isHR && isLead ? ' (HR & Lead)' : isHR ? ' (HR)' : isLead ? ' (Lead)' : '';
                      
                      return (
                        <div
                          key={`${team.id}-${member.id}-${index}`}
                          className={`flex justify-between items-center rounded-lg p-2.5 border transition-colors ${
                            isHROrLead 
                              ? theme === 'dark' ? 'bg-[#136dec]/10 border-[#136dec]/30' : 'bg-blue-50 border-blue-200'
                              : theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-white border-gray-200'
                          }`}
                          data-testid="team-member"
                        >
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {member.full_name}
                            {roleLabel && <span className={`text-xs ml-1.5 ${theme === 'dark' ? 'text-[#136dec]' : 'text-blue-600'}`}>{roleLabel}</span>}
                          </span>
                          {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                            isHROrLead ? (
                              <button
                                disabled
                                className="text-gray-400 cursor-not-allowed opacity-50 p-1"
                                title={`Cannot remove ${isHR && isLead ? 'HR and Team Lead' : isHR ? 'HR' : 'Team Lead'} from their own team`}
                                data-testid="remove-member-btn-disabled"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRemoveMember(team.id, member.id)}
                                className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-red-500/20 text-[#9da8b9] hover:text-red-400' : 'hover:bg-red-100 text-gray-400 hover:text-red-600'}`}
                                data-testid="remove-member-btn"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>No members yet</p>
                  )}
                </div>
              </div>

              {['admin', 'hr', 'community_admin'].includes(user?.role) && (
                <button
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowAddMemberModal(true);
                  }}
                  className={`w-full mt-4 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    theme === 'dark' 
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600 hover:text-white' 
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white'
                  }`}
                  data-testid="add-member-btn"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Member</span>
                </button>
              )}
            </div>
          ))}
        </div>
        )}
        </div>
      </div>

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-testid="edit-team-modal">
          <div className={`relative w-full max-w-md rounded-xl shadow-2xl animate-scale-in ${
            theme === 'dark' ? 'bg-[#1c2027] border border-[#282f39]' : 'bg-white'
          }`}>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditFormData({ name: '', lead_id: '' });
                setSelectedTeam(null);
              }}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#282f39]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Edit Team</h2>

              <form onSubmit={handleUpdateTeam} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#111418] border-[#282f39] text-white placeholder-[#9da8b9] focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]'
                    }`}
                    required
                    data-testid="edit-team-name-input"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                    Team Lead *
                  </label>
                  <select
                    value={editFormData.lead_id}
                    onChange={(e) => setEditFormData({ ...editFormData, lead_id: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#111418] border-[#282f39] text-white focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]'
                    }`}
                    required
                    data-testid="edit-team-lead-select"
                  >
                    <option value="">Select Team Lead</option>
                    {users
                      .filter((u) => u.role === 'team_lead' || u.role === 'admin')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className={`rounded-lg p-3 ${
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                }`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    <strong>Note:</strong> HR assignment cannot be changed. Only team name and team lead can be updated.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditFormData({ name: '', lead_id: '' });
                      setSelectedTeam(null);
                    }}
                    className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#282f39] text-white hover:bg-[#333a47]' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-[#136dec] text-white rounded-lg font-medium text-sm hover:bg-[#1158c7] transition-colors shadow-lg shadow-[#136dec]/25"
                    data-testid="submit-edit-team"
                  >
                    Update Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-testid="create-team-modal">
          <div className={`relative w-full max-w-md rounded-xl shadow-2xl animate-scale-in ${
            theme === 'dark' ? 'bg-[#1c2027] border border-[#282f39]' : 'bg-white'
          }`}>
            <button
              onClick={() => setShowCreateModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#282f39]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Create New Team</h2>

              <form onSubmit={handleCreateTeam} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#111418] border-[#282f39] text-white placeholder-[#9da8b9] focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]'
                    }`}
                    required
                    data-testid="team-name-input"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                    HR *
                  </label>
                  <select
                    value={formData.hr_id}
                    onChange={(e) => setFormData({ ...formData, hr_id: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#111418] border-[#282f39] text-white focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]'
                    }`}
                    required
                    data-testid="team-hr-select"
                  >
                    <option value="">Select HR</option>
                    {users
                      .filter((u) => u.role === 'hr' || u.role === 'admin')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                    Team Lead *
                  </label>
                  <select
                    value={formData.lead_id}
                    onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#111418] border-[#282f39] text-white focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#136dec] focus:ring-1 focus:ring-[#136dec]'
                    }`}
                    required
                    data-testid="team-lead-select"
                  >
                    <option value="">Select Team Lead</option>
                    {users
                      .filter((u) => u.role === 'team_lead' || u.role === 'admin')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#282f39] text-white hover:bg-[#333a47]' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-[#136dec] text-white rounded-lg font-medium text-sm hover:bg-[#1158c7] transition-colors shadow-lg shadow-[#136dec]/25"
                    data-testid="submit-create-team"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

{/* Add Member Modal - Enhanced with Search */}
      {showAddMemberModal && selectedTeam && (() => {
        // Filter available users (not already in team)
        const availableUsers = users.filter((u) => !selectedTeam.members?.some((m) => m._id === u._id));
        
        // Apply search and role filters
        const filteredUsers = availableUsers.filter(u => {
          const matchesSearch = searchQuery === '' || 
            u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesRole = roleFilter === 'all' || u.role === roleFilter;
          return matchesSearch && matchesRole;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-testid="add-member-modal">
            <div className={`relative w-full max-w-2xl rounded-xl shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col ${
              theme === 'dark' ? 'bg-[#1c2027] border border-[#282f39]' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center p-6 border-b border-[#282f39]">
                <div>
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add Members to {selectedTeam.name}</h2>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                    {availableUsers.length} user(s) available | {selectedTeam.members?.length || 0} current member(s)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setIsMultiSelect(false);
                    setSelectedUserIds([]);
                    setSelectedUserId('');
                    setSearchQuery('');
                    setRoleFilter('all');
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#282f39]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="flex-1 overflow-hidden flex flex-col p-6 space-y-5">
                {/* Search and Filter Bar */}
                <div className="space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
                        theme === 'dark' 
                          ? 'bg-[#111418] border-[#282f39] text-white placeholder-[#9da8b9] focus:border-[#136dec]' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#136dec]'
                      }`}
                    />
                  </div>

                  {/* Filter Row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <Filter className={`w-4 h-4 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Filter by role:</span>
                    {['all', 'admin', 'hr', 'team_lead', 'member'].map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          roleFilter === role
                            ? 'bg-[#136dec] text-white'
                            : theme === 'dark' 
                              ? 'bg-[#282f39] text-[#9da8b9] hover:bg-[#3e454f] hover:text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {role === 'all' ? 'All Roles' : role.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-Select Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#136dec]/10 to-transparent border-[#136dec]/20' 
                    : 'bg-gradient-to-r from-blue-50 to-transparent border-blue-100'
                }`}>
                  <div>
                    <span className={`text-sm font-semibold block ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {isMultiSelect ? 'Multi-Select Mode' : 'Single Select Mode'}
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                      {isMultiSelect ? `${selectedUserIds.length} user(s) selected` : 'Select one user at a time'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiSelect(!isMultiSelect);
                      setSelectedUserId('');
                      setSelectedUserIds([]);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isMultiSelect 
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                        : theme === 'dark' 
                          ? 'bg-[#136dec] text-white hover:bg-[#1158c7] shadow-lg' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    }`}
                  >
                    {isMultiSelect ? 'Switch to Single' : 'Switch to Multi'}
                  </button>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-hidden">
                  {isMultiSelect ? (
                    /* Multi-Select UI */
                    <div className="h-full flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                        <label className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                          {filteredUsers.length} user(s) &bull; {selectedUserIds.length} selected
                        </label>
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className={`text-sm font-medium hover:underline ${theme === 'dark' ? 'text-[#136dec] hover:text-[#1158c7]' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className={`border rounded-lg max-h-80 overflow-y-auto ${
                        theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'
                      }`}>
                        {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                          <label
                            key={u.id}
                            className={`flex items-center p-4 cursor-pointer border-b transition-colors ${
                              theme === 'dark' 
                                ? 'border-[#282f39] hover:bg-[#1c2027]' 
                                : 'border-gray-200 hover:bg-white'
                            } last:border-b-0`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={() => toggleUserSelection(u.id)}
                              className="w-5 h-5 text-[#136dec] rounded focus:ring-[#136dec] mr-4 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{u.full_name}</div>
                              <div className={`text-sm truncate ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                                {u.email}
                              </div>
                            </div>
                            <span className={`ml-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                              theme === 'dark' ? 'bg-[#282f39] text-[#9da8b9]' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </label>
                        )) : (
                          <div className="p-8 text-center">
                            <Users className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                            <p className={`font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>No users found</p>
                            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>Try adjusting your search or filters</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Single Select UI */
                    <div className="h-full flex flex-col">
                      <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                        Select User *
                      </label>
                      {filteredUsers.length > 0 ? (
                        <div className={`border rounded-lg max-h-80 overflow-y-auto ${
                          theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'
                        }`}>
                          {filteredUsers.map((u) => (
                            <label
                              key={u._id}
                              className={`flex items-center p-4 cursor-pointer border-b transition-colors ${
                                theme === 'dark' 
                                  ? 'border-[#282f39] hover:bg-[#1c2027]' 
                                  : 'border-gray-200 hover:bg-white'
                              } last:border-b-0`}
                            >
                              <input
                                type="radio"
                                name="selectedUser"
                                value={u._id}
                                checked={selectedUserId === u._id}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-5 h-5 text-[#136dec] focus:ring-[#136dec] mr-4 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{u.full_name}</div>
                                <div className={`text-sm truncate ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                                  {u.email}
                                </div>
                              </div>
                              <span className={`ml-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                theme === 'dark' ? 'bg-[#282f39] text-[#9da8b9]' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {u.role.replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className={`border rounded-lg p-8 text-center ${
                          theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <Users className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                          <p className={`font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>No users found</p>
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>Try adjusting your search or filters</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={`flex gap-3 justify-end pt-4 border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setIsMultiSelect(false);
                      setSelectedUserIds([]);
                      setSelectedUserId('');
                      setSearchQuery('');
                      setRoleFilter('all');
                    }}
                    className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      theme === 'dark' 
                        ? 'bg-[#282f39] text-white hover:bg-[#3e454f]' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-[#136dec] text-white rounded-lg font-medium text-sm hover:bg-[#1158c7] transition-colors shadow-lg shadow-[#136dec]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                    data-testid="submit-add-member"
                    disabled={isMultiSelect ? selectedUserIds.length === 0 : !selectedUserId}
                  >
                    <UserPlus className="w-4 h-4" />
                    {isMultiSelect 
                      ? `Add ${selectedUserIds.length} Member${selectedUserIds.length !== 1 ? 's' : ''}`
                      : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};

export default Teams;
