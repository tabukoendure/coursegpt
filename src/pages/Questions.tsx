import React from 'react';
import { Search, Download, Share2, Filter, Loader2, Sparkles, BookOpen, AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const years = ['All Years', '2024', '2023', '2022', '2021', '2020'];
const depts = ['All Departments', 'Sciences', 'Engineering', 'Law', 'Management', 'Other'];

export default function Questions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(searchParams.get('search') || '');
  const [yearFilter, setYearFilter] = React.useState('All Years');
  const [deptFilter, setDeptFilter] = React.useState('All Departments');
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchQuestions();
  }, [searchParams, yearFilter, deptFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      let q = supabase.from('past_questions').select('*');

      const s = searchParams.get('search');
      if (s) {
        q = q.ilike('course_code', `%${s}%`);
      }
      if (yearFilter !== 'All Years') {
        q = q.eq('year', yearFilter);
      }
      if (deptFilter !== 'All Departments') {
        q = q.eq('department', deptFilter);
      }

      const { data } = await q.order('created_at', { ascending: false });
      setQuestions(data || []);
    } catch (err) {
      console.error('Fetch questions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ search: query });
  };

  const handleDownload = async (fileUrl: string, id: string) => {
    try {
      await supabase.from('past_questions').update({ download_count: questions.find(q => q.id === id).download_count + 1 }).eq('id', id);
    } catch (e) {
      console.error(e);
    }
    window.open(fileUrl, '_blank');
  };

  const shareToWhatsapp = (courseCode: string, fileUrl: string) => {
    const text = `Check out this ${courseCode} past question on CourseGPT: ${fileUrl} — Study smarter at Achievers!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Questions Library</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Browse verified past questions from all Achievers departments.</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-primary-light px-4 py-2 rounded-xl text-primary text-xs font-bold border border-primary/10">
          <BookOpen className="h-4 w-4" />
          <span>{questions.length} documents available</span>
        </div>
      </header>

      {/* Filters */}
      <section className="bg-white p-4 md:p-6 rounded-[2rem] border border-border shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by course code — try BCH201..."
              className="w-full pl-12 pr-4 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary transition-all font-bold text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
              <select 
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="pl-10 pr-8 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary transition-all appearance-none text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="relative">
              <select 
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="pl-6 pr-8 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary transition-all appearance-none text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button type="submit" className="flex-1 lg:flex-none px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
              Filter
            </button>
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-border h-48 animate-pulse shadow-sm">
                   <div className="flex justify-between mb-4">
                     <div className="h-8 w-24 bg-bg rounded-lg" />
                     <div className="h-6 w-16 bg-bg rounded-full" />
                   </div>
                   <div className="h-4 w-3/4 bg-bg rounded mb-2" />
                   <div className="h-4 w-1/2 bg-bg rounded" />
                </div>
              ))}
            </div>
          ) : questions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questions.map((q, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={q.id} 
                  className="bg-white p-6 rounded-3xl border border-border hover:border-primary/30 transition-all group shadow-sm hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-black text-primary mb-1 tracking-tighter uppercase">{q.course_code}</div>
                      <div className="text-sm font-bold text-text-primary line-clamp-1 h-5">{q.course_name || 'Achievers Course'}</div>
                    </div>
                    <div className="px-3 py-1 bg-bg text-text-secondary text-[9px] font-black rounded-full uppercase tracking-widest border border-border">{q.year}</div>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-text-secondary mb-6">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">{q.department}</span>
                    <span className="flex items-center"><Download className="h-3 w-3 mr-1 opacity-50" /> {q.download_count || 0}</span>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDownload(q.file_url, q.id)}
                      className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </button>
                    <button 
                      onClick={() => shareToWhatsapp(q.course_code, q.file_url)}
                      className="p-3.5 bg-[#25D366] text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center shadow-md shadow-[#25D366]/20"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 md:p-20 rounded-[2.5rem] border border-border text-center shadow-sm">
              <div className="p-6 bg-primary-light rounded-[2rem] w-20 h-20 flex items-center justify-center mx-auto mb-8 text-primary shadow-inner">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-text-primary mb-3">No documents found</h3>
              <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto font-medium">We don't have "{query}" yet. Help your classmates by uploading it!</p>
              <button 
                onClick={() => navigate('/dashboard/upload')}
                className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
              >
                Upload & Earn Rewards
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-8 rounded-[2rem] border border-border shadow-sm">
            <h3 className="font-black text-text-primary flex items-center mb-6 uppercase tracking-widest text-[10px]">
              <Sparkles className="h-4 w-4 mr-2 text-primary" /> Recommended
            </h3>
            <div className="space-y-4">
              {['BCH201', 'ANA204', 'PIO214', 'PHY202', 'CHM201'].map(code => (
                <button 
                  key={code}
                  onClick={() => {
                    setQuery(code);
                    setSearchParams({ search: code });
                  }}
                  className="w-full text-left p-4 rounded-2xl hover:bg-bg border border-transparent hover:border-border transition-all flex justify-between items-center group"
                >
                  <span className="text-sm font-bold text-text-primary tracking-tight">{code}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </section>

          <section className="bg-success p-8 rounded-[2rem] text-white relative overflow-hidden group shadow-lg shadow-success/20">
            <AlertCircle className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 group-hover:scale-110 transition-all" />
            <h4 className="font-black text-lg mb-2 leading-tight">Reward Program 🎁</h4>
            <p className="text-xs text-white/80 leading-relaxed mb-6 font-medium">
              Every verified upload earns you points redeemable for mobile airtime.
            </p>
            <button 
              onClick={() => navigate('/dashboard/upload')}
              className="px-6 py-3 bg-white text-success rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all w-full"
            >
              Start Uploading
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
