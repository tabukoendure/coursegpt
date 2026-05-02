import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, BookOpen, MessageSquare, Calendar, Upload, User, Settings, LogOut, GraduationCap, Bell, Award, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          const today = new Date().toISOString().split('T')[0];
          const lastActive = data.last_active;
          let newStreak = data.study_streak || 1;

          if (lastActive) {
            const last = new Date(lastActive);
            const now = new Date(today);
            const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) {
              newStreak = data.study_streak || 1;
            } else if (diffDays === 1) {
              newStreak = (data.study_streak || 1) + 1;
            } else {
              newStreak = 1;
            }
          }

          if (lastActive !== today) {
            await supabase.from('profiles').update({ last_active: today, study_streak: newStreak }).eq('id', user.id);
          }

          setProfile({ ...data, study_streak: newStreak });
        } else {
          setProfile({ full_name: 'Student', level: 'Unknown', department: 'Unknown' });
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        setProfile({ full_name: 'Guest', level: 'N/A', department: 'N/A' });
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Layout },
    { name: 'Questions', path: '/dashboard/questions', icon: BookOpen },
    { name: 'AI Tutor', path: '/dashboard/ai', icon: MessageSquare },
    { name: 'Planner', path: '/dashboard/planner', icon: Calendar },
    { name: 'Recap', path: '/dashboard/recap', icon: Award },
  ];

  const sidebarItems = [
    ...navItems,
    { name: 'Upload & Earn', path: '/dashboard/upload', icon: Upload },
  ];

  const accountItems = [
    { name: 'Profile', path: '/dashboard/profile', icon: User },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
    { name: 'Upgrade to Pro', path: '/pro', icon: Zap },
  ];

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row">

      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-border px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black text-text-primary tracking-tighter uppercase">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-text-secondary">
            <Bell className="h-5 w-5" />
          </button>
          <Link
            to="/dashboard/profile"
            className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs"
          >
            {profile.full_name?.[0]}
          </Link>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-white hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-text-primary tracking-tight uppercase">
              COURSE<span className="text-primary">GPT</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-10">
          <div>
            <p className="px-4 text-[10px] uppercase font-black text-text-secondary tracking-widest mb-4 opacity-40">
              Main Navigation
            </p>
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === item.path ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-secondary hover:bg-bg'}`}
                >
                  <item.icon className={`h-5 w-5 ${location.pathname === item.path ? 'text-white' : 'text-text-secondary'}`} />
                  <span className="text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] uppercase font-black text-text-secondary tracking-widest mb-4 opacity-40">
              Your Account
            </p>
            <div className="space-y-1">
              {accountItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === item.path ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg'}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-bold text-error hover:bg-error/5 transition-all outline-none"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Desktop Profile Info */}
        <div className="p-6 border-t border-border bg-bg/5">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard/profile" className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </Link>
            <div className="overflow-hidden">
              <div className="text-xs font-black text-text-primary truncate">{profile.full_name}</div>
              <div className="text-[10px] text-text-secondary truncate font-bold">{profile.level} • {profile.department}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-10">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-border px-4 flex items-center justify-around z-50 pb-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center space-y-1 transition-all ${location.pathname === item.path ? 'text-primary' : 'text-text-secondary opacity-60'}`}
          >
            <item.icon className={`h-5 w-5 ${location.pathname === item.path ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className={`text-[10px] font-black uppercase tracking-tighter ${location.pathname === item.path ? 'opacity-100' : 'opacity-80'}`}>
              {item.name}
            </span>
            {location.pathname === item.path && (
              <motion.div layoutId="bottomNavDot" className="h-1 w-1 bg-primary rounded-full absolute -bottom-1" />
            )}
          </Link>
        ))}
      </nav>

    </div>
  );
}