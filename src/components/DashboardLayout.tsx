import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, BookOpen, MessageSquare, Calendar, Upload, User, Settings, LogOut, GraduationCap, Bell, Award, Zap, FileText, Layers, Moon, TrendingUp, Menu, X, ChevronRight, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = React.useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
const [newUploads, setNewUploads] = React.useState(0);
const [showNotif, setShowNotif] = React.useState(false);
const [notifList, setNotifList] = React.useState<any[]>([]);

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

// Fetch new uploads since last visit
const lastVisit = data.last_active
  ? new Date(new Date(data.last_active).getTime() - 24 * 60 * 60 * 1000).toISOString()
  : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const { data: uploads } = await supabase
  .from('past_questions')
  .select('course_code, course_name, created_at')
  .eq('university', data.university)
  .gte('created_at', lastVisit)
  .order('created_at', { ascending: false })
  .limit(10);

if (uploads && uploads.length > 0) {
  setNewUploads(uploads.length);
  setNotifList(uploads);
}
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

  // Close menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const sidebarItems = [
    { name: 'Home', path: '/dashboard', icon: Layout },
    { name: 'Questions', path: '/dashboard/questions', icon: BookOpen },
    { name: 'AI Tutor', path: '/dashboard/ai', icon: MessageSquare },
    { name: 'Planner', path: '/dashboard/planner', icon: Calendar },
    { name: 'Quiz', path: '/dashboard/quiz', icon: BookOpen },
    { name: 'Summary', path: '/dashboard/summary', icon: FileText },
    { name: 'Flashcards', path: '/dashboard/flashcards', icon: Layers },
    { name: 'Cheatsheet', path: '/dashboard/cheatsheet', icon: Moon },
    { name: 'Progress', path: '/dashboard/progress', icon: TrendingUp },
    { name: 'Recap', path: '/dashboard/recap', icon: Award },
    { name: 'Upload & Earn', path: '/dashboard/upload', icon: Upload },
    { name: 'Leaderboard', path: '/dashboard/leaderboard', icon: Trophy },
  ];

  const bottomNavItems = [
    { name: 'Home', path: '/dashboard', icon: Layout },
    { name: 'AI Tutor', path: '/dashboard/ai', icon: MessageSquare },
    { name: 'Planner', path: '/dashboard/planner', icon: Calendar },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
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
        <div className="flex items-center gap-2">
  <div className="relative">
    <button
      onClick={() => setShowNotif(!showNotif)}
      className="p-2 text-text-secondary hover:text-primary transition-colors relative"
    >
      <Bell className="h-5 w-5" />
      {newUploads > 0 && (
        <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full" />
      )}
    </button>
    {showNotif && (
      <div className="absolute right-0 top-12 w-80 bg-white border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-black text-text-primary text-sm">Notifications</span>
          <button onClick={() => { setShowNotif(false); setNewUploads(0); }} className="text-xs text-primary font-bold">Mark all read</button>
        </div>
        {notifList.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-secondary font-medium">No new notifications</div>
        ) : (
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {notifList.map((n, i) => (
              <div key={i} className="p-4 hover:bg-bg transition-all cursor-pointer" onClick={() => { setShowNotif(false); setNewUploads(0); }}>
                <p className="text-sm font-bold text-text-primary">📚 New: {n.course_code}</p>
                <p className="text-xs text-text-secondary mt-0.5">{n.course_name || 'Past question uploaded'}</p>
                <p className="text-[10px] text-text-secondary opacity-60 mt-1">{new Date(n.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
  <button
    onClick={() => setMobileMenuOpen(true)}
    className="p-2 text-text-secondary hover:text-primary transition-colors"
  >
    <Menu className="h-6 w-6" />
  </button>
</div>
      </div>

      {/* Mobile Drawer — Full Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-white z-[70] md:hidden flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg">
                    {profile.full_name?.[0]}
                  </div>
                  <div>
                    <div className="text-sm font-black text-text-primary truncate max-w-[140px]">{profile.full_name}</div>
                    <div className="text-[10px] text-text-secondary font-bold">{profile.level}</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-bg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Nav */}
              <div className="flex-1 overflow-y-auto py-4 px-3">
                <p className="px-3 text-[10px] uppercase font-black text-text-secondary tracking-widest mb-3 opacity-40">
                  Navigation
                </p>
                <div className="space-y-1">
                  {sidebarItems.map(item => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === item.path ? 'bg-primary text-white' : 'text-text-secondary hover:bg-bg'}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${location.pathname === item.path ? 'text-white' : 'text-text-secondary'}`} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      {location.pathname === item.path && <ChevronRight className="h-4 w-4 text-white/60" />}
                    </Link>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <p className="px-3 text-[10px] uppercase font-black text-text-secondary tracking-widest mb-3 opacity-40">
                    Account
                  </p>
                  <div className="space-y-1">
                    {accountItems.map(item => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === item.path ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-bg'}`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-error hover:bg-error/5 transition-all"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Streak badge */}
              <div className="p-4 border-t border-border">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">🔥</span>
                  <div>
                    <div className="text-xs font-black text-primary">{profile.study_streak || 1} Day Streak</div>
                    <div className="text-[10px] text-text-secondary font-medium">Keep it up!</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-white hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-8 flex items-center justify-between">
  <Link to="/" className="flex items-center space-x-2">
    <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
      <GraduationCap className="h-6 w-6 text-white" />
    </div>
    <span className="text-xl font-black text-text-primary tracking-tight uppercase">
      COURSE<span className="text-primary">GPT</span>
    </span>
  </Link>
  <div className="relative">
    <button onClick={() => setShowNotif(!showNotif)} className="p-2 text-text-secondary hover:text-primary transition-colors relative">
      <Bell className="h-5 w-5" />
      {newUploads > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full" />}
    </button>
    {showNotif && (
      <div className="absolute right-0 top-12 w-80 bg-white border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-black text-text-primary text-sm">Notifications</span>
          <button onClick={() => { setShowNotif(false); setNewUploads(0); }} className="text-xs text-primary font-bold">Mark all read</button>
        </div>
        {notifList.length === 0 ? (
          <div className="p-6 text-center text-sm text-text-secondary font-medium">No new notifications</div>
        ) : (
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {notifList.map((n, i) => (
              <div key={i} className="p-4 hover:bg-bg transition-all cursor-pointer" onClick={() => { setShowNotif(false); setNewUploads(0); }}>
                <p className="text-sm font-bold text-text-primary">📚 New: {n.course_code}</p>
                <p className="text-xs text-text-secondary mt-0.5">{n.course_name || 'Past question uploaded'}</p>
                <p className="text-[10px] text-text-secondary opacity-60 mt-1">{new Date(n.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
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

      {/* Mobile Bottom Navigation — Home, AI Tutor, Planner, Profile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-border px-2 flex items-center justify-around z-50 pb-2">
        {bottomNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center space-y-1 px-3 transition-all ${location.pathname === item.path ? 'text-primary' : 'text-text-secondary opacity-60'}`}
          >
            <item.icon className={`h-5 w-5 ${location.pathname === item.path ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className={`text-[10px] font-black uppercase tracking-tighter ${location.pathname === item.path ? 'opacity-100' : 'opacity-80'}`}>
              {item.name}
            </span>
          </Link>
        ))}

        {/* More button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center space-y-1 px-3 text-text-secondary opacity-60"
        >
          <Menu className="h-5 w-5 stroke-2" />
          <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">More</span>
        </button>
      </nav>

    </div>
  );
}