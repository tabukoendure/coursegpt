import React from 'react';
import { Calendar, Plus, Trash2, Sparkles, CheckCircle2, Loader2, Target, BookOpen, MessageSquare, Share2, X, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askGemini } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import Markdown from 'react-markdown';

interface Exam {
  id: string;
  course_code: string;
  course_name: string;
  exam_date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export default function Planner() {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [newExam, setNewExam] = React.useState({ code: '', name: '', date: '', difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard' });
  const [plan, setPlan] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [addLoading, setAddLoading] = React.useState(false);
  const [genLoading, setGenLoading] = React.useState(false);
  const [completedTasks, setCompletedTasks] = React.useState<number[]>([]);
  const [aiModal, setAiModal] = React.useState<{ open: boolean; topic: string; response: string; loading: boolean }>({ open: false, topic: '', response: '', loading: false });
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);

  React.useEffect(() => { fetchUserData(); }, []);

  React.useEffect(() => {
    const handleClick = () => setMenuOpen(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: examsData } = await supabase
        .from('user_exams').select('*').eq('user_id', user.id)
        .order('exam_date', { ascending: true });
      setExams(examsData || []);

      const { data: planData } = await supabase
        .from('study_plans').select('*').eq('user_id', user.id)
        .order('generated_at', { ascending: false }).limit(1).maybeSingle();

      if (planData) {
        try {
          const days = JSON.parse(planData.plan_content);
          setPlan({ ...planData, days: Array.isArray(days) ? days : [] });
        } catch {
          const days = planData.plan_content
            .split('\n')
            .filter((line: string) => line.includes('DAY') && line.includes(':'));
          setPlan({ ...planData, days });
        }
      }

      const { data: progressData } = await supabase
        .from('plan_progress').select('day_index').eq('user_id', user.id).eq('completed', true);
      if (progressData) setCompletedTasks(progressData.map(p => p.day_index));
    } catch (err) {
      console.error('Fetch user data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addExam = async () => {
    if (!newExam.code || !newExam.date) return;
    setAddLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAddLoading(false); return; }

      const { data, error } = await supabase
        .from('user_exams')
        .insert([{
          user_id: user.id,
          course_code: newExam.code.toUpperCase(),
          course_name: newExam.name,
          exam_date: newExam.date,
          difficulty: newExam.difficulty,
        }])
        .select().single();

      if (!error && data) {
        setExams(prev => [...prev, data]);
        setNewExam({ code: '', name: '', date: '', difficulty: 'Medium' });
      }
    } catch (err) {
      console.error('Add exam error:', err);
    } finally {
      setAddLoading(false);
    }
  };

  const removeExam = async (id: string) => {
    const { error } = await supabase.from('user_exams').delete().eq('id', id);
    if (!error) setExams(exams.filter(e => e.id !== id));
    setMenuOpen(null);
  };

  const generatePlan = async () => {
    if (exams.length === 0) return;
    setGenLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const examList = exams.map(e =>
      `${e.course_code} (${e.course_name}) on ${e.exam_date} (Difficulty: ${e.difficulty})`
    ).join(', ');

    const prompt = `Create a daily study schedule for a Nigerian university student at their university with these upcoming exams: ${examList}.

Rules:
1) Start from today ${today}
2) Harder subjects get more study days
3) Leave 2 days before each exam for revision
4) Max 2 hours per subject per day
5) Format EACH day on its own line EXACTLY like this: "DAY [N] - [DATE]: [COURSE CODE] ([X] hrs)"
6) For revision days use: "DAY [N] - [DATE]: REVISION - [COURSE CODE] ([X] hrs)"
7) Return ONLY the day lines, nothing else, no explanation`;
    try {
      const response = await askGemini(prompt, 'Study Planning');
      const parsedDays = response
        .split('\n')
        .filter(line => line.includes('DAY') && line.includes(':'));

      const { data, error } = await supabase
        .from('study_plans')
        .insert([{ user_id: user.id, plan_content: response }])
        .select().single();

      if (!error && data) {
        setPlan({ ...data, days: parsedDays });
        await supabase.from('plan_progress').delete().eq('user_id', user.id);
        setCompletedTasks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const deletePlan = async () => {
    if (!window.confirm('Delete your current study plan? This cannot be undone.')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('study_plans').delete().eq('user_id', user.id);
    await supabase.from('plan_progress').delete().eq('user_id', user.id);
    setPlan(null);
    setCompletedTasks([]);
  };

  const toggleTask = async (idx: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isDone = completedTasks.includes(idx);
    if (isDone) {
      const { error } = await supabase.from('plan_progress').delete().eq('user_id', user.id).eq('day_index', idx);
      if (!error) setCompletedTasks(prev => prev.filter(i => i !== idx));
    } else {
      const { error } = await supabase.from('plan_progress').upsert([{ user_id: user.id, day_index: idx, completed: true }]);
      if (!error) setCompletedTasks(prev => [...prev, idx]);
    }
  };

  const askAiAboutDay = async (dayLine: string) => {
    setAiModal({ open: true, topic: dayLine, response: '', loading: true });
    const topic = dayLine.split(':').slice(1).join(':').trim();
    const prompt = `A Nigerian university student at their university has this study task today: "${topic}".
Please:
1. Explain the key concepts for this topic in simple, clear language
2. Give 5 likely exam questions on this topic with answers
3. Provide a quick revision summary they can read in 5 minutes
Be specific, practical and encouraging.`;
    try {
      const response = await askGemini(prompt, 'Study Planning');
      setAiModal(prev => ({ ...prev, response, loading: false }));
    } catch {
      setAiModal(prev => ({ ...prev, response: 'Failed to get AI response. Please try again.', loading: false }));
    }
  };

  const shareToWhatsApp = (dayLine: string) => {
    const text = `📚 *CourseGPT Study Plan*\n\n${dayLine}\n\nStudying smart with CourseGPT 🎓`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareFullPlan = () => {
    if (!plan?.days) return;
    const text = `📚 *My CourseGPT Study Plan*\n\n${plan.days.join('\n')}\n\nGenerated by CourseGPT 🎓`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const progress = plan?.days?.length ? Math.round((completedTasks.length / plan.days.length) * 100) : 0;

  const getDaysUntil = (dateStr: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr); examDate.setHours(0, 0, 0, 0);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-64 bg-border rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 h-[500px] bg-bg rounded-[2rem]" />
        <div className="md:col-span-2 h-[500px] bg-bg rounded-[2rem]" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* AI Modal */}
      <AnimatePresence>
        {aiModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setAiModal(prev => ({ ...prev, open: false }))}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-black text-text-primary text-sm uppercase tracking-widest">AI Tutor</span>
                </div>
                <button onClick={() => setAiModal(prev => ({ ...prev, open: false }))} className="p-2 hover:bg-bg rounded-xl transition-all">
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 opacity-60">{aiModal.topic}</p>
              {aiModal.loading ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-bold text-text-secondary">AI is explaining this topic...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:text-text-primary prose-headings:tracking-tight prose-p:text-text-secondary prose-p:font-medium prose-strong:text-text-primary prose-li:text-text-secondary prose-li:font-medium">
                  <Markdown>{aiModal.response}</Markdown>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Study Planner</h1>
<p className="text-sm text-text-secondary mt-1 font-medium">Add your exams and generate a clean daily study schedule.</p>        </div>
        <div className="flex items-center gap-3">
          {plan && (
            <>
              <div className="hidden md:flex items-center space-x-2 bg-success/10 px-4 py-2 rounded-xl text-success text-xs font-black border border-success/10 uppercase tracking-widest">
                <Target className="h-4 w-4" />
                <span>{progress}% Mastery</span>
              </div>
              <button onClick={shareFullPlan} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-600 transition-all">
                <Share2 className="h-4 w-4" /> Share Plan
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-border shadow-sm">
            <h2 className="text-sm font-black text-text-primary mb-6 uppercase tracking-widest flex items-center">
              <Plus className="h-4 w-4 mr-2 text-primary" /> Add Exam
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Course Code (e.g. BCH201)"
                value={newExam.code}
                onChange={e => setNewExam({...newExam, code: e.target.value.toUpperCase()})}
                className="w-full px-5 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary transition-all text-sm font-bold placeholder:opacity-50"
              />
              <input
                type="text"
                placeholder="Course Name"
                value={newExam.name}
                onChange={e => setNewExam({...newExam, name: e.target.value})}
                className="w-full px-5 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary transition-all text-sm font-medium"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={newExam.date}
                  onChange={e => setNewExam({...newExam, date: e.target.value})}
                  className="px-4 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary transition-all text-xs font-bold"
                />
                <select
                  value={newExam.difficulty}
                  onChange={e => setNewExam({...newExam, difficulty: e.target.value as any})}
                  className="px-4 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary transition-all text-xs font-black uppercase tracking-tighter"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <button
                onClick={addExam}
                disabled={!newExam.code || !newExam.date || addLoading}
                className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center shadow-xl shadow-primary/10 disabled:opacity-50"
              >
                {addLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Adding...</> : 'Add to Calendar'}
              </button>
            </div>
          </div>

          {/* Exam list */}
          <div className="space-y-3">
            {exams.length > 0 && (
              <div className="flex items-center text-[10px] font-black text-text-secondary uppercase tracking-widest px-4 mb-2">
                <Calendar className="h-3 w-3 mr-2" /> Exam Schedule
              </div>
            )}
            {exams.map(exam => {
              const days = getDaysUntil(exam.exam_date);
              return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={exam.id}
                  className="bg-white p-5 rounded-2xl border border-border flex justify-between items-center shadow-sm"
                >
                  <div className="flex-1 truncate mr-3">
  <div className="flex items-center space-x-2 mb-0.5">
    <span className="font-black text-primary tracking-tighter uppercase">{exam.course_code}</span>
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${days < 7 ? 'bg-error text-white' : 'bg-bg text-text-secondary'}`}>
      {days === 0 ? 'Today' : days < 0 ? 'Ended' : `${days}d`}
    </span>
  </div>
  <div className="text-[10px] text-text-secondary font-medium truncate">{exam.course_name || 'Course'}</div>
  <button
    onClick={() => {
      const text = `⏰ *${days === 0 ? 'TODAY' : `${days} days`} to ${exam.course_code} exam!*\n\n📚 ${exam.course_name || exam.course_code}\n📅 ${new Date(exam.exam_date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}\n\nI'm studying with CourseGPT 🎓\nhttps://mycoursegpt.com`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }}
    className="mt-1.5 flex items-center gap-1 text-[9px] font-black text-green-600 uppercase tracking-widest hover:underline"
  >
    <Share2 className="h-2.5 w-2.5" /> Share Countdown
  </button>
</div>

                  <div className="relative">
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === exam.id ? null : exam.id); }}
                      className="p-2 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-bg"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === exam.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 top-10 bg-white border border-border rounded-2xl shadow-xl z-20 overflow-hidden w-36"
                      >
                        <button onClick={() => removeExam(exam.id)} className="w-full flex items-center gap-2 px-4 py-3 text-error text-xs font-black uppercase tracking-widest hover:bg-error/5 transition-all">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Generate button — works for any exam */}
          {exams.length > 0 && (
            <button
              onClick={generatePlan}
              disabled={genLoading}
              className="w-full py-5 bg-white border-2 border-primary text-primary font-black text-xs uppercase tracking-widest rounded-[1.5rem] hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5 flex items-center justify-center disabled:opacity-50"
            >
              {genLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-3" />}
              {plan ? 'Regenerate Study Plan' : 'Generate Smart Plan'}
            </button>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
          {plan ? (
            <div className="space-y-6">
              <section className="bg-white p-6 md:p-8 rounded-[2rem] border border-border shadow-sm relative overflow-hidden">
                <Target className="absolute -bottom-6 -right-6 h-32 w-32 text-primary opacity-5" />
                <div className="flex-1 relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-text-primary text-lg tracking-tight uppercase">Study Progress</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-primary">{progress}%</span>
                      <button onClick={deletePlan} className="flex items-center gap-1 px-3 py-1.5 bg-error/10 text-error text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-error hover:text-white transition-all">
                        <Trash2 className="h-3 w-3" /> Delete Plan
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-bg rounded-full overflow-hidden border border-border/50">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary relative" />
                  </div>
                  <p className="text-[10px] text-text-secondary mt-3 font-bold uppercase tracking-widest">
                    {completedTasks.length} OF {plan.days.length} TASKS COMPLETED
                  </p>
                </div>
              </section>

              <div className="space-y-3">
                {plan.days.map((dayLine: string, idx: number) => {
                  const isDone = completedTasks.includes(idx);
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`p-5 rounded-[2rem] border transition-all ${isDone ? 'bg-bg/50 border-transparent opacity-60' : 'bg-white border-border shadow-sm hover:border-primary/30'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleTask(idx)}
                          className={`h-10 w-10 rounded-2xl border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? 'bg-success border-success text-white' : 'border-border text-transparent bg-bg shadow-inner'}`}
                        >
                          <CheckCircle2 className="h-6 w-6" />
                        </button>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 opacity-60">
                            {dayLine.split(':')[0]}
                          </div>
                          <div className={`font-bold text-sm leading-tight ${isDone ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                            {dayLine.split(':').slice(1).join(':').trim()}
                          </div>
                        </div>
                      </div>

                      {!isDone && (
                        <div className="flex items-center gap-2 mt-4 ml-14">
                          <button onClick={() => askAiAboutDay(dayLine)} className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all">
                            <MessageSquare className="h-3 w-3" /> Ask AI Tutor
                          </button>
                          <button onClick={() => shareToWhatsApp(dayLine)} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-500 hover:text-white transition-all">
                            <Share2 className="h-3 w-3" /> Share
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <section className="h-full min-h-[500px] bg-white rounded-[3rem] border border-border flex flex-col items-center justify-center px-12 text-center shadow-sm relative overflow-hidden group">
              <AnimatePresence>
                {genLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 flex flex-col items-center">
                    <div className="h-24 w-24 bg-primary-light rounded-[2.5rem] flex items-center justify-center animate-bounce shadow-xl shadow-primary/10">
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <div className="max-w-xs">
                      <h3 className="text-3xl font-black text-text-primary mb-4 tracking-tighter">AI is planning your success...</h3>
                      <p className="text-text-secondary text-sm leading-relaxed font-medium">Building your personalised study plan based on your exam schedule.</p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                    <div className="relative">
                      <div className="h-32 w-32 bg-bg rounded-[3rem] flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-border group-hover:scale-110 transition-transform duration-500">
                        <BookOpen className="h-14 w-14 text-text-secondary opacity-20" />
                      </div>
                      <div className="absolute -top-4 -right-4 h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                        <Target className="h-6 w-6" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-text-primary mb-4 tracking-tighter">Ready for Straight A's?</h3>
                      <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed font-medium">
                        Add your exams above and hit Generate Smart Plan to get your personalised daily study schedule.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}