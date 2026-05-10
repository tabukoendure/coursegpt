import React from 'react';
import { Zap, Sparkles, Loader2, Share2, RefreshCw, Moon, BookOpen, FileUp, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { askGemini } from '../lib/gemini';
import { extractTextFromFile } from '../lib/pdfExtract';
import Markdown from 'react-markdown';

export default function Cheatsheet() {
  const [exams, setExams] = React.useState<any[]>([]);
  const [selectedExam, setSelectedExam] = React.useState<any>(null);
  const [cheatsheet, setCheatsheet] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [genLoading, setGenLoading] = React.useState(false);
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfText, setPdfText] = React.useState('');
  const [pdfLoading, setPdfLoading] = React.useState(false);

  React.useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_exams').select('*').eq('user_id', user.id)
        .order('exam_date', { ascending: true });
      setExams(data || []);
      if (data && data.length > 0) setSelectedExam(data[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfFile(file);
    setPdfLoading(true);
    setPdfText('');
    try {
      const { text } = await extractTextFromFile(file);
      setPdfText(text);
    } catch (err) {
      console.error('PDF read error:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const generateCheatsheet = async () => {
    if (!selectedExam) return;
    setGenLoading(true);
    setCheatsheet('');
    try {
      const hasPdf = pdfText.length > 100;

      const prompt = hasPdf
        ? `You are helping a Nigerian university student at Achievers University who has ONLY 30 MINUTES before their ${selectedExam.course_code} (${selectedExam.course_name}) exam.

Generate a "Last 30 Minutes Cheatsheet" STRICTLY based on the following course material only:

"""
${pdfText.substring(0, 4000)}
"""

Use proper markdown formatting:

## 🔥 Top 5 Must-Know Topics
The 5 most important topics from the material above. Be very specific.

## ⚡ Critical Definitions
Only definitions from the material that WILL appear. Format: **TERM** — definition (max 6)

## 🧠 Key Formulas / Rules
Only essential formulas or rules from the material. Skip if not in the material.

## 📌 Examiner Favourite Questions
3 questions likely from this material with one-line answers.

## ✅ Last-Minute Tips
3 specific exam tips based on this course material.

Keep it SHORT and SCANNABLE. Use **bold** for key terms.`
        : `You are helping a Nigerian university student at Achievers University who has ONLY 30 MINUTES before their ${selectedExam.course_code} (${selectedExam.course_name}) exam.

Generate a "Last 30 Minutes Cheatsheet" using proper markdown formatting:

## 🔥 Top 5 Must-Know Topics
List the 5 topics most likely to appear. Be very specific.

## ⚡ Critical Definitions
Only definitions that WILL appear. Format: **TERM** — definition (max 6)

## 🧠 Key Formulas / Rules
Only essential formulas or rules. Skip section if not relevant.

## 📌 Examiner Favourite Questions
The 3 questions that appear almost every year with a one-line answer each.

## ✅ Last-Minute Tips
3 specific exam tips for this course.

Keep it SHORT and SCANNABLE. Use **bold** for key terms. Nigerian university context.`;

      const response = await askGemini(prompt, selectedExam.course_code);
      setCheatsheet(response);
    } catch (err) {
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!cheatsheet) return;
    const text = `🌙 *${selectedExam?.course_code} Last 30 Mins Cheatsheet*\n\n${cheatsheet}\n\n_CourseGPT 🎓_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr); examDate.setHours(0, 0, 0, 0);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-64 bg-border rounded-lg" />
      <div className="h-96 bg-border rounded-[2rem]" />
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
          <Moon className="h-7 w-7 text-primary" /> Exam Night Cheatsheet
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-medium">Upload your PDF and get a last 30-minute survival guide.</p>
      </header>

      {exams.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-border p-16 text-center shadow-sm">
          <div className="h-20 w-20 bg-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-border">
            <BookOpen className="h-10 w-10 text-text-secondary opacity-20" />
          </div>
          <h3 className="text-xl font-black text-text-primary mb-2">No exams added yet</h3>
          <p className="text-sm text-text-secondary mb-6">Go to the Study Planner and add your exams first.</p>
          <a href="/dashboard/planner" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all">Go to Planner</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-[2rem] border border-border p-6 shadow-sm space-y-5">

              {/* PDF Upload */}
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Upload Course PDF (Optional)</label>
                <label className={`flex items-center gap-3 w-full px-4 py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${pdfFile ? pdfLoading ? 'border-primary/40 bg-primary/5' : 'border-success bg-success/5' : 'border-border bg-bg hover:border-primary'}`}>
                  <input type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f && f.type === 'application/pdf') handlePdfUpload(f); }} />
                  {pdfLoading ? (
                    <><Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" /><span className="text-xs font-black text-primary uppercase tracking-widest">Reading PDF...</span></>
                  ) : pdfFile ? (
                    <>
                      <FileText className="h-4 w-4 text-success shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-success uppercase tracking-widest truncate">{pdfFile.name}</p>
                        <p className="text-[10px] text-success/70 mt-0.5">{pdfText.length > 0 ? '✓ Ready' : 'Processing...'}</p>
                      </div>
                      <button type="button" onClick={e => { e.preventDefault(); setPdfFile(null); setPdfText(''); }} className="p-1 hover:text-error transition-colors shrink-0"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <><FileUp className="h-4 w-4 text-text-secondary shrink-0" /><span className="text-xs font-bold text-text-secondary">Click to upload PDF</span></>
                  )}
                </label>
              </div>

              {/* Exam selector */}
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Select Exam</label>
                <div className="space-y-2">
                  {exams.map(exam => {
                    const days = getDaysUntil(exam.exam_date);
                    return (
                      <button
                        key={exam.id}
                        onClick={() => { setSelectedExam(exam); setCheatsheet(''); }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedExam?.id === exam.id ? 'bg-primary text-white border-primary' : 'bg-bg border-border hover:border-primary/40'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-black text-sm uppercase tracking-tight ${selectedExam?.id === exam.id ? 'text-white' : 'text-text-primary'}`}>{exam.course_code}</div>
                            <div className={`text-[10px] font-medium mt-0.5 truncate max-w-[140px] ${selectedExam?.id === exam.id ? 'text-white/70' : 'text-text-secondary'}`}>{exam.course_name || 'Achievers Course'}</div>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${days <= 1 ? 'bg-error text-white' : days <= 3 ? 'bg-orange-100 text-orange-600' : selectedExam?.id === exam.id ? 'bg-white/20 text-white' : 'bg-bg text-text-secondary border border-border'}`}>
                            {days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `${days}d`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${pdfText ? 'bg-primary/5 border-primary/20' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${pdfText ? 'text-primary' : 'text-orange-600'}`}>
                  {pdfText ? '📄 Cheatsheet will be generated from your PDF' : '⚠️ Upload a PDF for a more accurate cheatsheet'}
                </p>
              </div>

              <button
                onClick={generateCheatsheet}
                disabled={genLoading || !selectedExam || pdfLoading}
                className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10 disabled:opacity-50"
              >
                {genLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> {cheatsheet ? 'Regenerate' : 'Generate Cheatsheet'}</>}
              </button>
            </div>

            {selectedExam && getDaysUntil(selectedExam.exam_date) <= 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-error/10 border border-error/20 rounded-2xl p-4 text-center">
                <div className="text-error font-black text-sm mb-1">
                  {getDaysUntil(selectedExam.exam_date) === 0 ? '⚠️ Exam is TODAY!' : getDaysUntil(selectedExam.exam_date) === 1 ? '🌙 Exam is TOMORROW!' : `⏰ Only ${getDaysUntil(selectedExam.exam_date)} days left!`}
                </div>
                <p className="text-[10px] text-error/80 font-bold">Generate your cheatsheet now!</p>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-2">
            {cheatsheet ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex items-center justify-between">
                  <div>
                    <div className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Moon className="h-3 w-3" /> Last 30 Mins Cheatsheet
                    </div>
                    <h2 className="text-white font-black text-xl tracking-tight">{selectedExam?.course_code}</h2>
                    <p className="text-white/60 text-xs font-medium mt-0.5">{selectedExam?.course_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white/50 text-[10px] font-black uppercase tracking-widest">Exam Date</div>
                    <div className="text-white font-black text-sm mt-0.5">
                      {new Date(selectedExam?.exam_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:text-text-primary prose-headings:tracking-tight prose-p:text-text-secondary prose-p:font-medium prose-strong:text-text-primary prose-li:text-text-secondary prose-li:font-medium prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3">
                    <Markdown>{cheatsheet}</Markdown>
                  </div>
                </div>
                <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-3">
                  <button onClick={shareToWhatsApp} className="flex-1 py-4 bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                    <Share2 className="h-4 w-4" /> Share to WhatsApp
                  </button>
                  <button onClick={generateCheatsheet} disabled={genLoading} className="flex-1 py-4 bg-bg border border-border text-text-primary font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    <RefreshCw className="h-4 w-4" /> Regenerate
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="min-h-[500px] bg-white rounded-[2rem] border border-border flex flex-col items-center justify-center text-center p-12 shadow-sm">
                <AnimatePresence>
                  {genLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 flex flex-col items-center">
                      <div className="h-20 w-20 bg-gray-900 rounded-[2rem] flex items-center justify-center animate-pulse">
                        <Moon className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tighter">Building your cheatsheet...</h3>
                        <p className="text-text-secondary text-sm font-medium">Extracting only the most critical exam content.</p>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="h-24 w-24 bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto">
                        <Moon className="h-12 w-12 text-white opacity-80" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tighter">Exam Night Ready?</h3>
                        <p className="text-text-secondary text-sm font-medium max-w-xs mx-auto">Select your exam, optionally upload your PDF, and generate your survival guide.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}