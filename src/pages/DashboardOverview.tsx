import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Sparkles, BookOpen, Clock, TrendingUp, Calendar, ChevronRight, MessageSquare, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<any>(null);
  const [popularPQs, setPopularPQs] = React.useState<any[]>([]);
  const [exams, setExams] = React.useState<any[]>([]);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        let p = null;
for (let i = 0; i < 3; i++) {
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (data) { p = data; break; }
  await new Promise(res => setTimeout(res, 1000));
}
if (!p) {
  navigate('/onboarding');
  return;
}
setProfile(p);
        const { data: pqs } = await supabase.from('past_questions').select('*').order('download_count', { ascending: false }).limit(5);
        setPopularPQs(pqs || []);

        const { data: examsData } = await supabase
          .from('user_exams')
          .select('*')
          .eq('user_id', user.id)
          .order('exam_date', { ascending: true });
        
        setExams(examsData || []);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!profile) return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-64 bg-border rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 h-64 bg-border rounded-[2.5rem]" />
        <div className="h-64 bg-border rounded-[2.5rem]" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Welcome, {profile.full_name?.split(' ')[0]}!</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Ready to ace your Achievers exams today?</p>
        </div>
        <div className="flex items-center bg-white px-4 py-2 border border-border rounded-xl shadow-sm w-fit">
          <div className="flex space-x-1 mr-3">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${i <= (profile.study_streak || 1) ? 'bg-primary' : 'bg-bg'}`} />
            ))}
          </div>
          <div className="text-[10px] font-black text-primary uppercase tracking-widest">{profile.study_streak || 1} Day Streak 🔥</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hero Section */}
          <section className="bg-primary p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <Sparkles className="absolute -top-10 -right-10 h-64 w-64 opacity-10 animate-pulse" />
            <div className="relative z-10 max-w-lg">
              <h2 className="text-2xl md:text-4xl font-black mb-4 leading-tight">Find any past question in seconds.</h2>
              <p className="text-white/80 text-sm md:text-base font-medium mb-8">Access thousands of Achievers University past questions, solved by AI.</p>
              
              <form 
                onSubmit={(e) => { e.preventDefault(); navigate(`/dashboard/questions?search=${query}`); }} 
                className="relative group"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:scale-110 transition-all" />
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Type course code (e.g. BCH201)..."
                  className="w-full pl-14 pr-6 py-4 md:py-5 bg-white rounded-2xl md:rounded-[1.5rem] text-text-primary outline-none focus:ring-8 focus:ring-white/20 transition-all font-bold text-sm md:text-base placeholder:text-text-secondary/50"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2.5 md:p-3 rounded-xl hover:scale-105 active:scale-95 transition-all">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </form>
            </div>
          </section>

          {/* Upcoming Exams Grid */}
          <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-text-primary flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-3 text-primary" /> Upcoming Exams
              </h3>
              <Link to="/dashboard/planner" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Full Schedule</Link>
            </div>

            {exams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.slice(0, 4).map(e => {
                  const days = getDaysUntil(e.exam_date);
                  return (
                    <motion.div 
                      whileHover={{ y: -2 }}
                      key={e.id} 
                      className={`p-5 rounded-2xl border transition-all ${days < 7 ? 'bg-error/5 border-error/10' : 'bg-bg border-transparent'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-lg font-black text-text-primary">{e.course_code}</div>
                        <div className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter ${days < 7 ? 'bg-error text-white' : 'bg-success/10 text-success'}`}>
                          {days < 0 ? 'Exams Ongoing' : days === 0 ? 'Today' : `${days} days left`}
                        </div>
                      </div>
                      <div className="text-xs text-text-secondary font-medium truncate mb-4">{e.course_name}</div>
                      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${days < 7 ? 'bg-error' : 'bg-success'}`} 
                          style={{ width: `${Math.max(0, 100 - (days * 5))}%` }} 
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-bg rounded-3xl border-2 border-dashed border-border/50">
                <Calendar className="h-12 w-12 mx-auto text-text-secondary opacity-20 mb-4" />
                <p className="text-sm font-bold text-text-primary mb-1">No exam schedule yet</p>
                <p className="text-xs text-text-secondary mb-6">Add your exam dates to get a personalized countdown.</p>
                <button 
                  onClick={() => navigate('/dashboard/planner')} 
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  Setup my planner
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Quick Stats Grid - Mobile only */}
          <div className="grid grid-cols-2 gap-4 lg:hidden">
             <div className="bg-white p-5 rounded-3xl border border-border">
                <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Uploads</div>
                <div className="text-2xl font-black text-text-primary">0</div>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-border">
                <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Downloads</div>
                <div className="text-2xl font-black text-text-primary">0</div>
             </div>
          </div>

          {/* Popular Right Now */}
          <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-border shadow-sm">
            <h3 className="font-black text-text-primary flex items-center mb-6 uppercase tracking-widest text-[10px]">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" /> Popular Questions
            </h3>
            <div className="space-y-5">
              {popularPQs.length > 0 ? popularPQs.map(pq => (
                <div 
                  key={pq.id} 
                  className="flex items-center justify-between group cursor-pointer" 
                  onClick={() => navigate(`/dashboard/questions?search=${pq.course_code}`)}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2 bg-primary-light rounded-xl text-primary font-black text-xs min-w-[70px] text-center">{pq.course_code}</div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-text-primary truncate">{pq.course_name || 'No Title'}</div>
                      <div className="text-[10px] text-text-secondary font-medium">{pq.download_count || 0} downloads</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              )) : (
                <div className="text-center py-6 opacity-30 italic text-[10px]">Loading popular content...</div>
              )}
            </div>
            <Link 
              to="/dashboard/questions" 
              className="mt-8 pt-6 border-t border-border flex items-center justify-center text-[10px] font-black text-primary uppercase tracking-widest hover:gap-3 transition-all"
            >
              Browse Library <ChevronRight className="h-3 w-3 ml-2" />
            </Link>
          </section>

          {/* AI Banner */}
          <section onClick={() => navigate('/dashboard/ai')} className="bg-bg border border-primary/20 p-8 rounded-[2rem] relative overflow-hidden group cursor-pointer hover:border-primary transition-all">
            <MessageSquare className="h-16 w-16 text-primary opacity-5 absolute -bottom-4 -right-4 group-hover:scale-110 transition-all" />
            <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4">
               <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-black text-text-primary text-lg mb-2">Stuck on a topic?</h4>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed font-medium">Ask CourseGPT AI to explain any difficult Achievers concept.</p>
            <div className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center border-b-2 border-primary/20 w-fit group-hover:border-primary transition-all">
              Launch AI Tutor <ChevronRight className="h-3 w-3 ml-1" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
