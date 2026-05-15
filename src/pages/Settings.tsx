import React from 'react';
import { supabase } from '../lib/supabase';
import { 
  Lock, Bell, Shield, LogOut, 
  Check, Eye, EyeOff, Trash2,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [notifications, setNotifications] = React.useState({
    newQuestions: true,
    examReminders: true,
    aiTips: false,
  });
  const [passwordForm, setPasswordForm] = React.useState({
    newPassword: '',
    confirmPassword: '',
  });

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess('');
    setTimeout(() => setError(''), 4000);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || 
        !passwordForm.confirmPassword) {
      showError('Please fill in all fields');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== 
        passwordForm.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      if (error) throw error;
      showSuccess('Password updated successfully');
      setPasswordForm({ 
        newPassword: '', 
        confirmPassword: '' 
      });
    } catch (err: any) {
      showError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      'Are you sure you want to delete your account? ' +
      'This cannot be undone.'
    );
    if (!confirm) return;
    showError(
      'To delete your account please contact ' +
      'support@coursegpt.com'
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-text-primary 
          tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Success / Error messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/20 
            text-success rounded-2xl px-4 py-3 text-sm 
            font-bold flex items-center gap-2"
        >
          <Check className="h-4 w-4" /> {success}
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error/10 border border-error/20 
            text-error rounded-2xl px-4 py-3 text-sm 
            font-bold"
        >
          {error}
        </motion.div>
      )}

      {/* Change Password */}
      <div className="bg-white border border-border 
        rounded-[2rem] p-8">
        <h3 className="font-black text-text-primary 
          flex items-center gap-2 mb-6">
          <Lock className="h-4 w-4 text-primary" />
          Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black 
              text-text-secondary uppercase tracking-widest 
              mb-2 block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ 
                  ...passwordForm, 
                  newPassword: e.target.value 
                })}
                placeholder="Min. 6 characters"
                className="w-full border border-border 
                  rounded-xl px-4 py-3 text-sm font-bold 
                  text-text-primary outline-none 
                  focus:ring-2 focus:ring-primary/20 pr-12"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 
                  -translate-y-1/2 text-text-secondary"
              >
                {showNewPassword 
                  ? <EyeOff className="h-4 w-4" /> 
                  : <Eye className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black 
              text-text-secondary uppercase tracking-widest 
              mb-2 block">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ 
                  ...passwordForm, 
                  confirmPassword: e.target.value 
                })}
                placeholder="Repeat new password"
                className="w-full border border-border 
                  rounded-xl px-4 py-3 text-sm font-bold 
                  text-text-primary outline-none 
                  focus:ring-2 focus:ring-primary/20 pr-12"
              />
              <button
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-1/2 
                  -translate-y-1/2 text-text-secondary"
              >
                {showOldPassword 
                  ? <EyeOff className="h-4 w-4" /> 
                  : <Eye className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full bg-primary text-white 
              rounded-xl py-3 text-sm font-black 
              uppercase tracking-widest 
              hover:bg-primary/90 disabled:opacity-50 
              transition-all"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-border 
        rounded-[2rem] p-8">
        <h3 className="font-black text-text-primary 
          flex items-center gap-2 mb-6">
          <Bell className="h-4 w-4 text-primary" />
          Notifications
        </h3>
        <div className="space-y-4">
          {[
            { 
              key: 'newQuestions', 
              label: 'New past questions added',
              desc: 'Get notified when new questions are uploaded'
            },
            { 
              key: 'examReminders', 
              label: 'Exam reminders',
              desc: 'Reminders 3 days before your exam dates'
            },
            { 
              key: 'aiTips', 
              label: 'AI study tips',
              desc: 'Weekly AI-generated study recommendations'
            },
          ].map(item => (
            <div key={item.key} 
              className="flex items-center justify-between 
                py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-bold 
                  text-text-primary">{item.label}</p>
                <p className="text-xs text-text-secondary 
                  mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ 
                  ...prev, 
                  [item.key]: !prev[item.key as keyof typeof prev] 
                }))}
                className={`w-12 h-6 rounded-full transition-all 
                  relative ${
                  notifications[item.key as keyof typeof notifications] 
                    ? 'bg-primary' 
                    : 'bg-border'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 
                  bg-white rounded-full shadow transition-all ${
                  notifications[item.key as keyof typeof notifications] 
                    ? 'left-7' 
                    : 'left-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white border border-border 
        rounded-[2rem] p-8">
        <h3 className="font-black text-text-primary 
          flex items-center gap-2 mb-6">
          <Shield className="h-4 w-4 text-primary" />
          Account
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between 
              px-4 py-4 rounded-2xl border border-border 
              hover:bg-bg transition-all group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-bold 
                text-text-primary">Sign out</span>
            </div>
            <ChevronRight className="h-4 w-4 
              text-text-secondary opacity-0 
              group-hover:opacity-100 transition-all" />
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-between 
              px-4 py-4 rounded-2xl border border-error/20 
              hover:bg-error/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-4 w-4 text-error" />
              <span className="text-sm font-bold 
                text-error">Delete account</span>
            </div>
            <ChevronRight className="h-4 w-4 text-error 
              opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        </div>
      </div>

      {/* App info */}
      <div className="text-center py-4">
        <p className="text-[10px] font-black text-text-secondary 
          uppercase tracking-widest opacity-40">
          CourseGPT v1.0 — Built for Nigerian Universities
        </p>
      </div>
    </div>
  );
}