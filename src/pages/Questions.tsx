import React from 'react';
import { Search, Download, Share2, Filter, Sparkles, BookOpen, AlertCircle, ChevronRight, FileText, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const currentYear = new Date().getFullYear();
const years = ['All Years', ...Array.from({ length: 8 }, (_, i) => String(currentYear - i))];
const depts = ['All Departments', 'Nursing Science', 'Engineering', 'Law', 'Pharmacy', 'MBBS', 'Other'];

export default function Questions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(searchParams.get('search') || '');
  const [yearFilter, setYearFilter] = React.useState('All Years');
  const [deptFilter, setDeptFilter] = React.useState('All Departments');
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewingPdf, setViewingPdf] = React.useState<{ url: string; title: string } | null>(null);

  React.useEffect(() => {
    fetchQuestions();
  }, [searchParams, yearFilter, deptFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      let q = supabase.from('past_questions').select('*');

      const s = searchParams.get('search');
      if (s) {
        q = q.or(`course_code.ilike.%${s}%,course_name.ilike.%${s}%`);
      }
      if (yearFilter !== 'All Years') q = q.eq('year', yearFilter);
      if (deptFilter !== 'All Departments') q = q.eq('department', deptFilter);

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

  const handleView = (fileUrl: string, courseCode: string) => {
    setViewingPdf({ url: fileUrl, title: courseCode });
  };

  const handleDownload = async (fileUrl: string, id: string) => {
    try {
      const current = questions.find(q => q.id === id);
      await supabase
        .from('past_questions')
        .update({ download_count: (current?.download_count || 0) + 1 })
        .eq('id', id);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, download_count: (q.download_count || 0) + 1 } : q));
    } catch (e) {
      console.error(e);
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${questions.find(q => q.id === id)?.course_code || 'past-question'}.pdf`;
    link.target = '_blank';
    link.click();
  };

  const shareToWhatsapp = (courseCode: string) => {
    const text = `Check out this ${courseCode} past question on CourseGPT — Study smarter at Achievers! https://coursegpt-eight.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Questions Library</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Search by course code or course name — e.g. BCH201 or Biochemistry</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-primary-light px-4 py-2 rounded-xl text-primary text-xs font-bold border border-primary/10">
          <BookOpen className="h-4 w-4" />
          <span>{questions.length} documents available</span>
        </div>
      </header>

      {/* Search tip */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 text-sm text-primary font-medium flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0" />
        Tip: Search by course code (BCH201) or course name (Biochemistry) — both work!
      </div>

      {/* Filters */}
      <section className="bg-white p-4 md:p-6 rounded-[2rem] border border-border shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code or name — BCH201, Biochemistry, Physiology..."
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
            <button
              type="submit"
              className="flex-1 lg:flex-none px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-border h-48 animate-pulse" />
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
                  className="bg-white p-6 rounded-3xl border border-border hover:border-primary/30 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-black text-primary mb-1 tracking-tighter uppercase">{q.course_code}</div>
                      <div className="text-sm font-bold text-text-primary line-clamp-1">{q.course_name || 'Achievers Course'}</div>
                    </div>
                    <div className="px-3 py-1 bg-bg text-text-secondary text-[9px] font-black rounded-full uppercase tracking-widest border border-border">{q.year}</div>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-text-secondary mb-6">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">{q.department}</span>
                    <span className="flex items-center"><Download className="h-3 w-3 mr-1 opacity-50" />{q.download_count || 0} downloads</span>
                  </div>

                  <div className="flex gap-2">
                    {/* View button — no download, no earnings count */}
                    <button
                      onClick={() => handleView(q.file_url, q.course_code)}
                      className="flex-1 py-3 border border-primary text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                    {/* Download button — counts toward uploader earnings */}
                    <button
                      onClick={() => handleDownload(q.file_url, q.id)}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Download
                    </button>
                    {/* WhatsApp share — shares app link not file URL */}
                    <button
                      onClick={() => shareToWhatsapp(q.course_code)}
                      className="p-3 bg-[#25D366] text-white rounded-xl hover:opacity-90 transition-all flex items-center justify-center"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 md:p-20 rounded-[2.5rem] border border-border text-center shadow-sm">
              <div className="p-6 bg-primary-light rounded-[2rem] w-20 h-20 flex items-center justify-center mx-auto mb-8 text-primary">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-text-primary mb-3">No documents found</h3>
              <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto font-medium">
                We don't have "{query}" yet. Be the first to upload it and earn airtime!
              </p>
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
              <Sparkles className="h-4 w-4 mr-2 text-primary" /> Popular Courses
            </h3>
            <div className="space-y-2">
              {['BCH201', 'ANA204', 'PIO214', 'PHY202', 'CHM201', 'Biochemistry', 'Anatomy', 'Physiology'].map(code => (
                <button
                  key={code}
                  onClick={() => { setQuery(code); setSearchParams({ search: code }); }}
                  className="w-full text-left p-3 rounded-2xl hover:bg-bg border border-transparent hover:border-border transition-all flex justify-between items-center group"
                >
                  <span className="text-sm font-bold text-text-primary">{code}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </section>

          <section className="bg-success p-8 rounded-[2rem] text-white relative overflow-hidden shadow-lg shadow-success/20">
            <AlertCircle className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
            <h4 className="font-black text-lg mb-2">Reward Program 🎁</h4>
            <p className="text-xs text-white/80 leading-relaxed mb-6 font-medium">
              Upload past questions and earn airtime rewards when classmates download them.
            </p>
            <button
              onClick={() => navigate('/dashboard/upload')}
              className="px-6 py-3 bg-white text-success rounded-xl text-[10px] font-black uppercase tracking-widest w-full"
            >
              Start Uploading
            </button>
          </section>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewingPdf && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col">
            {/* Viewer top bar */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-black text-text-primary uppercase tracking-tight">
                  {viewingPdf.title} — Past Question
                </span>
              </div>
              <button
                onClick={() => setViewingPdf(null)}
                className="p-2 hover:bg-bg rounded-xl text-text-secondary hover:text-error transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PDF iframe viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${viewingPdf.url}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={`${viewingPdf.title} Past Question`}
              />
            </div>

            {/* Bottom bar */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shrink-0 border-t border-border">
              <p className="text-xs text-text-secondary font-medium">
                Viewing only — use Download to save to your device
              </p>
              <button
                onClick={() => {
                  const q = questions.find(q => q.course_code === viewingPdf.title);
                  if (q) handleDownload(q.file_url, q.id);
                }}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-black"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}