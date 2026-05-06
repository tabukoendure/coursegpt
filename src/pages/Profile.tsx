import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Mail, BookOpen, GraduationCap, Edit3, Check, X, Settings, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [form, setForm] = React.useState({
    full_name: '',
    level: '',
    department: '',
  });

  const levels = [
    '100 Level', '200 Level', '300 Level',
    '400 Level', '500 Level'
  ];

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          setProfile(data);
          setForm({
            full_name: data.full_name || '',
            level: data.level || '',
            department: data.department || '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('profiles')
        .update(form)
        .eq('id', user.id);
      setProfile({ ...profile, ...form });
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 bg-border rounded-lg" />
      <div className="h-64 bg-border rounded-[2rem]" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">
          My Profile
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your personal information
        </p>
      </div>

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/20 text-success rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          Profile updated successfully
        </motion.div>
      )}

      {/* Avatar and name card */}
      <div className="bg-white border border-border rounded-[2rem] p-8 flex items-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-black shrink-0">
          {profile?.full_name?.[0] || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-black text-text-primary">
            {profile?.full_name}
          </h2>
          <p className="text-sm text-text-secondary font-medium mt-1">
            {profile?.level} • {profile?.department}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Achievers University, Owo
          </p>
        </div>
      </div>

      {/* Profile details card */}
      <div className="bg-white border border-border rounded-[2rem] p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-text-primary">
            Personal Information
          </h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:underline"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-xs font-black text-text-secondary uppercase tracking-widest hover:underline"
              >
                <X className="h-3 w-3" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 text-xs font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-50"
              >
                <Check className="h-3 w-3" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5">

          {/* Full name */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
              <User className="h-3 w-3" /> Full Name
            </label>
            {editing ? (
              <input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <p className="text-sm font-bold text-text-primary bg-bg rounded-xl px-4 py-3">
                {profile?.full_name}
              </p>
            )}
          </div>

          {/* Email — not editable */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
              <Mail className="h-3 w-3" /> Email Address
            </label>
            <p className="text-sm font-bold text-text-secondary bg-bg rounded-xl px-4 py-3">
              {profile?.email}
            </p>
          </div>

          {/* Level */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
              <GraduationCap className="h-3 w-3" /> Level
            </label>
            {editing ? (
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {levels.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-bold text-text-primary bg-bg rounded-xl px-4 py-3">
                {profile?.level}
              </p>
            )}
          </div>

          {/* Department — now free text input */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
              <BookOpen className="h-3 w-3" /> Department
            </label>
            {editing ? (
              <input
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Nursing Science"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <p className="text-sm font-bold text-text-primary bg-bg rounded-xl px-4 py-3">
                {profile?.department}
              </p>
            )}
          </div>

          {/* University — not editable */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
              <GraduationCap className="h-3 w-3" /> University
            </label>
            <p className="text-sm font-bold text-text-secondary bg-bg rounded-xl px-4 py-3">
              Achievers University, Owo
            </p>
          </div>

        </div>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5 text-center">
          <div className="text-2xl font-black text-primary">
            {profile?.study_streak || 1}
          </div>
          <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">Day Streak</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 text-center">
          <div className="text-2xl font-black text-primary">0</div>
          <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">Uploads</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 text-center">
          <div className="text-2xl font-black text-primary">0</div>
          <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">Downloads</div>
        </div>
      </div>

      {/* Mobile-only: Settings & Upgrade Pro */}
      <div className="md:hidden space-y-3">
        <Link
          to="/dashboard/settings"
          className="flex items-center justify-between bg-white border border-border rounded-2xl px-5 py-4 group hover:bg-bg transition-all"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-bold text-text-primary">Settings</span>
          </div>
          <ChevronRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-all" />
        </Link>

        <Link
          to="/pro"
          className="flex items-center justify-between bg-primary rounded-2xl px-5 py-4 group hover:bg-primary/90 transition-all"
        >
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-white" />
            <span className="text-sm font-black text-white uppercase tracking-widest">Upgrade to Pro</span>
          </div>
          <ChevronRight className="h-4 w-4 text-white opacity-60 group-hover:opacity-100 transition-all" />
        </Link>
      </div>

    </div>
  );
}