import { useState } from 'react';
import { User, Lock, CheckCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);

  const handleProfile = async (e) => {
    e.preventDefault(); setProfileSaving(true); setProfileMsg(null);
    try {
      const { data } = await api.put('/auth/me', profileForm);
      updateUser(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) { setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' }); }
    finally { setProfileSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' }); return;
    }
    setPassSaving(true); setPassMsg(null);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassMsg({ type: 'success', text: 'Password changed successfully.' });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPassMsg({ type: 'error', text: err.response?.data?.message || 'Change failed.' }); }
    finally { setPassSaving(false); }
  };

  const roleColors = { admin: 'bg-red-100 text-red-700', manager: 'bg-blue-100 text-blue-700', staff: 'bg-gray-100 text-gray-600' };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge capitalize ${roleColors[user?.role]}`}>{user?.role}</span>
              {user?.lastLogin && <span className="text-xs text-gray-400">Last login: {formatDateTime(user.lastLogin)}</span>}
            </div>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><User size={16} />Personal Information</h3>
          {profileMsg && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {profileMsg.type === 'success' && <CheckCircle size={14} />}
              {profileMsg.text}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileSaving} className="btn-primary">
              {profileSaving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="card p-6">
        <form onSubmit={handlePassword} className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Lock size={16} />Change Password</h3>
          {passMsg && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${passMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {passMsg.type === 'success' && <CheckCircle size={14} />}
              {passMsg.text}
            </div>
          )}
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={passForm.currentPassword} onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" value={passForm.newPassword} onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })} minLength={6} required />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" value={passForm.confirmPassword} onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passSaving} className="btn-primary">
              {passSaving ? <><Loader2 size={14} className="animate-spin" />Changing...</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
