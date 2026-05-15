import React from 'react';
import { BarChart3, TrendingUp, BookOpen, Target, Calendar, Sparkles, Loader2, ChevronRight, Award, MessageSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { askGemini } from '../lib/gemini';
import Markdown from 'react-markdown';

interface Metric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export default function Recap() {
  const [loading, setLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  const [courseFocus, setCourseFocus] = React.useState<{code: string, count: number}[]>([]);
  const [upcomingExams, setUpcomingExams] = React.useState<any[]>([]);
  const [aiInsight, setAiInsight] = React.useState<string | null>(null);
  const [insightLoading, setInsightLoading] = React.useState(false);

  React.useEffect(() => {
    fetchRecapData();
  }, []);

  const fetchRecapData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString();

      // 1. Fetch AI Sessions
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('course_code')
        .eq('user_id', user.id)
        .gte('updated_at', lastWeekStr);

      // 2. Fetch completed tasks
      const { data: progress } = await supabase
        .from('plan_progress')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', lastWeekStr)
        .eq('completed', true);

      // 3. Fetch upcoming exams
      const nextTwoWeeks = new Date();
      nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
      const { data: exams } = await supabase
        .from('user_exams')
        .select('*')
        .eq('user_id', user.id)
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .lte('exam_date', nextTwoWeeks.toISOString().split('T')[0])
        .order('exam_date', { ascending: true });

      // Process Course Focus
      const focusMap: Record<string, number> = {};
      sessions?.forEach(s => {
        const code = s.course_code || 'General';
        focusMap[code] = (focusMap[code] || 0) + 1;
      });
      const focusData = Object.entries(focusMap)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count);

      setCourseFocus(focusData);
      setUpcomingExams(exams || []);

      setMetrics([
        { 
          label: 'AI Sessions', 
          value: sessions?.length || 0, 
          icon: <MessageSquare className="h-5 w-5" />, 
          color: 'bg-primary-light text-primary' 
        },
        { 
          label: 'Tasks Done', 
          value: progress?.length || 0, 
          icon: <Target className="h-5 w-5" />, 
          color: 'bg-success/10 text-success' 
        },
        { 
          label: 'Focus Load', 
          value: focusData.length, 
          icon: <BarChart3 className="h-5 w-5" />, 
          color: 'bg-purple-100 text-purple-600' 
        },
        { 
          label: 'Deadlines', 
          value: exams?.length || 0, 
          icon: <Calendar className="h-5 w-5" />, 
          color: 'bg-orange-100 text-orange-600' 
        }
      ]);
    } catch (err) {
      console.error('Fetch recap data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async () => {
    setInsightLoading(true);
    const dataSummary = {
      sessionsCount: metrics[0].value,
      topicsCompleted: metrics[1].value,
      topCourse: courseFocus[0]?.code || 'N/A',
      upcomingExams: upcomingExams.map(e => `${e.course_code} on ${e.exam_date}`)
    };

    const prompt = `Act as a supportive and highly analytical study mentor for a Nigerian university student. 
Based on their activity this week:
- They had ${dataSummary.sessionsCount} AI study sessions.
- They completed ${dataSummary.topicsCompleted} planned study topics.
- Their most focused course was ${dataSummary.topCourse}.
- Their upcoming exams are: ${dataSummary.upcomingExams.join(', ')}.

Provide a "Weekly Recap" that includes:
1. A summary of their performance this week (be encouraging but honest).
2. Key strengths observed.
3. Priority areas for next week based on upcoming exams.
4. A motivational "Nigerian student" quote or proverb to keep them going.

Format the response with clean markdown headings and bullet points. Be specific and practical.`;

    try {
      const response = await askGemini(prompt, 'Weekly Recap');
      setAiInsight(response);
    } catch (err) {
      console.error(err);
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-64 bg-bg rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-bg rounded-[2rem]" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 h-96 bg-bg rounded-[2rem]" />
        <div className="md:col-span-2 h-96 bg-bg rounded-[2rem]" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight uppercase tracking-tighter">Weekly Recap</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium italic">Performance analysis for the last 7 days of studying.</p>
        </div>
        <div className="px-5 py-2 bg-white border border-border rounded-2xl flex items-center shadow-sm">
           <Clock className="h-4 w-4 mr-2 text-primary" />
           <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest leading-none">
             {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })} - Today
           </span>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden group"
          >
            <div className={`h-12 w-12 ${m.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all`}>
              {m.icon}
            </div>
            <div className="text-3xl font-black text-text-primary mb-1 tracking-tighter">{m.value}</div>
            <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{m.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Course Focus & Upcoming */}
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm">
            <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-8 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" /> Topic Engagement
            </h3>
            <div className="space-y-6">
              {courseFocus.length > 0 ? courseFocus.slice(0, 5).map((cf, i) => (
                <div key={cf.code}>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter mb-2">
                    <span className="text-text-primary">{cf.code}</span>
                    <span className="text-primary">{cf.count} sessions</span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden border border-border/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (cf.count / (courseFocus[0]?.count || 1)) * 100)}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-20">
                   <Target className="h-12 w-12 mx-auto mb-3" />
                   <p className="text-xs font-bold italic tracking-tight">No activity data found</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-8 rounded-[3rem] border border-border shadow-sm relative overflow-hidden">
            <Award className="absolute -top-10 -right-10 h-32 w-32 text-orange-500 opacity-5" />
            <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-8 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-orange-500" /> Deadline Heatmap
            </h3>
            <div className="space-y-3 relative z-10">
              {upcomingExams.length > 0 ? upcomingExams.map((exam, i) => (
                <div key={exam.id} className="p-4 bg-bg rounded-2xl border border-border/10 flex items-center justify-between hover:bg-orange-50/30 transition-all group">
                  <div className="truncate">
                    <div className="text-xs font-black text-text-primary group-hover:text-orange-600 transition-colors uppercase tracking-widest">{exam.course_code}</div>
                    <div className="text-[10px] text-text-secondary font-bold truncate max-w-[140px] uppercase tracking-tighter opacity-70">{exam.course_name || 'Course'}</div>
                  </div>
                  <div className="text-[10px] font-black text-orange-600 bg-white border border-orange-100 px-3 py-1.5 rounded-xl shrink-0 whitespace-nowrap">
                    {new Date(exam.exam_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-20">
                   <Calendar className="h-12 w-12 mx-auto mb-3" />
                   <p className="text-xs font-bold italic tracking-tight">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-2">
          {!aiInsight ? (
            <section className="h-full min-h-[500px] bg-white rounded-[3.5rem] border border-2 border-dashed border-border flex flex-col items-center justify-center p-8 md:p-16 text-center group transition-all hover:bg-white/[0.02]">
              <div className="h-24 w-24 bg-primary-light rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-primary/5 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-3xl font-black text-text-primary mb-4 tracking-tighter">AI Mentor Insights</h3>
              <p className="text-text-secondary text-sm md:text-base max-w-[280px] mb-10 leading-relaxed font-medium">
                I'll analyze your study patterns and give you tactical advice for next week.
              </p>
              <button 
                onClick={generateInsight}
                disabled={insightLoading}
                className="px-10 py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] hover:bg-primary/90 transition-all flex items-center shadow-2xl shadow-primary/30 disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {insightLoading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <TrendingUp className="h-5 w-5 mr-3" />}
                Generate Performance Analysis
              </button>
            </section>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 md:p-14 rounded-[4rem] border border-border shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <Award className="h-48 w-48 text-primary" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-10 pb-6 border-b border-border/50">
                  <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em] block mb-0.5">Tactical Analysis</span>
                    <span className="text-[9px] font-bold text-text-secondary uppercase">CourseGPT AI Mentor v2.0</span>
                  </div>
                </div>
                <div className="markdown-body prose prose-sm max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-headings:text-text-primary prose-p:font-medium prose-p:text-text-secondary text-base leading-relaxed">
                  <Markdown>{aiInsight}</Markdown>
                </div>
                
                <div className="mt-12 flex gap-4">
                  <button 
                    onClick={() => setAiInsight(null)}
                    className="flex-1 py-4 bg-bg border border-border text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-sm"
                  >
                    Clear Results
                  </button>
                  <button 
                     onClick={() => window.print()}
                     className="flex-1 py-4 bg-white border border-border text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-light transition-all shadow-sm"
                  >
                     Save as PDF 📄
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
