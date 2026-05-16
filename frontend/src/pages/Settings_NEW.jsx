import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import NotificationSettings from '../components/NotificationSettings';
import SessionSettings from '../components/SessionSettings';
import api from '../api/axios';
import { User, Settings as SettingsIcon, Palette, Monitor, Lock, Eye, EyeOff, Bell, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await api.post('/users/me/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordMessage({ type: 'success', text: response.data.message });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111418]">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#111418]">
        {/* Header */}
        <header className="border-b border-[#282f39] bg-[#111418] shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-white text-xl font-bold leading-tight">Settings</h2>
              <p className="text-[#9da8b9] text-xs mt-1">Customize your TaskFlow experience</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Section */}
            <div className="bg-[#1c2027] rounded border border-[#282f39] p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="text-[#136dec]" size={24} />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#9da8b9] uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={user?.full_name || ''}
                    readOnly
                    className="w-full px-3 py-2 bg-[#111418] border border-[#282f39] rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9da8b9] uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-3 py-2 bg-[#111418] border border-[#282f39] rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9da8b9] uppercase tracking-wider mb-2">Role</label>
                  <input
                    type="text"
                    value={user?.role?.replace('_', ' ') || ''}
                    readOnly
                    className="w-full px-3 py-2 bg-[#111418] border border-[#282f39] rounded text-white capitalize"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#9da8b9] uppercase tracking-wider mb-2">Member Since</label>
                  <input
                    type="text"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                    readOnly
                    className="w-full px-3 py-2 bg-[#111418] border border-[#282f39] rounded text-white"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-[#1c2027] rounded border border-[#282f39] p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="text-[#136dec]" size={24} />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Security</h3>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#9da8b9] uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9da8b9] hover:text-white"
                    >
                      {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9da8b9] uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9da8b9] hover:text-white"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#9da8b9] uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-[#111418] border border-[#282f39] rounded text-white focus:ring-2 focus:ring-[#136dec] focus:border-transparent"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9da8b9] hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {passwordMessage.text && (
                  <div className={`p-3 rounded border ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-[#136dec] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Appearance Section */}
            <div className="bg-[#1c2027] rounded border border-[#282f39] p-6">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="text-[#136dec]" size={24} />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Appearance</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-4">Theme & Color Scheme</h4>
                  <p className="text-sm text-[#9da8b9] mb-4">
                    Customize how TaskFlow looks and feels. Changes are saved automatically.
                  </p>
                  <ThemeToggle />
                </div>

                <div className="border-t border-[#282f39] pt-6">
                  <div className="flex items-center gap-3">
                    <Monitor className="text-[#9da8b9]" size={20} />
                    <div>
                      <h4 className="font-medium text-white text-sm">System Integration</h4>
                      <p className="text-xs text-[#9da8b9] mt-1">
                        Your theme preferences are automatically synced across devices and saved locally.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-[#1c2027] rounded border border-[#282f39] p-6">
              <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="text-[#136dec]" size={24} />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Preferences</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white text-sm">Email Notifications</h4>
                    <p className="text-xs text-[#9da8b9] mt-1">Receive email updates about your tasks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[#282f39] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border border-[#3e454f] peer-checked:bg-[#136dec]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white text-sm">Task Reminders</h4>
                    <p className="text-xs text-[#9da8b9] mt-1">Get reminded about upcoming due dates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[#282f39] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border border-[#3e454f] peer-checked:bg-[#136dec]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-[#1c2027] rounded border border-[#282f39] p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="text-[#136dec]" size={24} />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Notifications</h3>
              </div>
              <NotificationSettings />
            </div>

            {/* Session Timeout Settings */}
            <div className="bg-[#1c2027] rounded border border-[#282f39] p-6">
              <SessionSettings />
            </div>

            {/* Debug Info - Admin Only */}
            {user?.role === 'admin' && (
              <div className="bg-[#1c2027] rounded border border-[#282f39] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-yellow-500" size={24} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notification Debug (Admin Only)</h3>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-[#9da8b9]">Browser Support:</span>
                    <span className="text-white">
                      {'Notification' in window ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                    
                    <span className="text-[#9da8b9]">Permission:</span>
                    <span className="text-white">
                      {typeof Notification !== 'undefined' ? Notification.permission : 'N/A'}
                    </span>
                    
                    <span className="text-[#9da8b9]">Service Worker:</span>
                    <span className="text-white">
                      {'serviceWorker' in navigator ? '✅ Available' : '❌ Not Available'}
                    </span>
                    
                    <span className="text-[#9da8b9]">SW Registered:</span>
                    <span className="text-white">
                      {navigator.serviceWorker?.controller ? '✅ Yes' : '⚠️ No'}
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-yellow-400 text-xs">
                      <strong className="font-bold">Tip:</strong> If notifications aren't working, try:
                      <br />1. Check browser console for errors
                      <br />2. Verify HTTPS connection (required)
                      <br />3. Clear browser cache and reload
                      <br />4. Check browser notification settings
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
