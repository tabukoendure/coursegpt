import React from 'react';
import { Layers, Sparkles, Loader2, RefreshCw, ChevronLeft, ChevronRight, Share2, RotateCcw, BookOpen, AlertCircle, FileUp, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { askGemini } from '../lib/gemini';
import { extractTextFromFile } from '../lib/pdfExtract';

interface Flashcard {
  front: string;
  back: string;
}

export default function Flashcards() {
  const [exams, setExams] = React.useState<any[]>([]);
  const [selectedExam, setSelectedExam] = React.useState<any>(null);
  const [cards, setCards] = React.useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [genLoading, setGenLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState('');
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

  const parseCards = (text: string): Flashcard[] | null => {
    try {
      const clean = text.replace(/```json|```/gi, '').trim();
      const start = clean.indexOf('[');
      const end = clean.lastIndexOf(']');
      if (start === -1 || end === -1) return null;
      const parsed = JSON.parse(clean.substring(start, end + 1));
      if (!Array.isArray(parsed) || parsed.length === 0) return null;
      if (!parsed[0].front || !parsed[0].back) return null;
      return parsed;
    } catch {
      try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].front) return parsed;
        }
      } catch { /* ignore */ }
      return null;
    }
  };

  const generateCards = async (retryCount = 0) => {
    if (!selectedExam) return;
    setGenLoading(true);
    setCards([]);
    setCurrentIdx(0);
    setFlipped(false);
    setSaved(false);
    setError('');

    try {
      const hasPdf = pdfText.length > 100;

      const pdfInstruction = hasPdf
        ? `Generate flashcards STRICTLY and ONLY from the following course material. Every term and definition must come directly from this text:\n\n"""\n${pdfText.substring(0, 4000)}\n"""\n\n`
        : `Generate flashcards based on common Nigerian university exam content for ${selectedExam.course_code} (${selectedExam.course_name}).\n\n`;

      const prompt = `${pdfInstruction}Generate exactly 20 flashcards for ${selectedExam.course_code} exam on ${selectedExam.exam_date}.

Each flashcard:
- front: A key term, concept, or exam question from the material
- back: The definition, explanation, or answer (2-4 sentences)

Return ONLY a valid JSON array, nothing else:
[{"front":"term here","back":"definition here"},{"front":"term here","back":"definition here"}]`;

      const response = await askGemini(prompt, selectedExam.course_code);
      const parsed = parseCards(response);

      if (parsed && parsed.length > 0) {
        setCards(parsed);
      } else if (retryCount < 2) {
        setGenLoading(false);
        setTimeout(() => generateCards(retryCount + 1), 2000);
        return;
      } else {
        setError('Could not generate flashcards. Please try again.');
      }
    } catch (err: any) {
      if (retryCount < 2) {
        setGenLoading(false);
        setTimeout(() => generateCards(retryCount + 1), 2000);
        return;
      }
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const saveCards = async () => {
    if (!cards.length || !selectedExam) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('flashcard_sets').upsert([{
        user_id: user.id,
        exam_id: selectedExam.id,
        course_code: selectedExam.course_code,
        cards: JSON.stringify(cards),
        updated_at: new Date().toISOString(),
      }]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
  };

  const shareToWhatsApp = () => {
    if (!cards.length) return;
    const text = `🃏 *${selectedExam?.course_code} Flashcards*\n\n` +
      cards.slice(0, 10).map((c, i) => `*${i + 1}. ${c.front}*\n${c.back}`).join('\n\n') +
      `\n\n_Generated by CourseGPT 🎓_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const next = () => { setFlipped(false); setTimeout(() => setCurrentIdx(i => Math.min(i + 1, cards.length - 1)), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setCurrentIdx(i => Math.max(i - 1, 0)), 150); };
  const restart = () => { setCurrentIdx(0); setFlipped(false); };

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-64 bg-border rounded-lg" />
      <div className="h-96 bg-border rounded-[2rem]" />
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Flashcards</h1>
        <p className="text-sm text-text-secondary mt-1 font-medium">Upload your course PDF and generate flashcards from it.</p>
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
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Upload Course PDF</label>
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
                  {exams.map(exam => (
                    <button key={exam.id} onClick={() => { setSelectedExam(exam); setCards([]); setCurrentIdx(0); setFlipped(false); setError(''); }} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedExam?.id === exam.id ? 'bg-primary text-white border-primary' : 'bg-bg border-border hover:border-primary/40'}`}>
                      <div className={`font-black text-sm uppercase tracking-tight ${selectedExam?.id === exam.id ? 'text-white' : 'text-text-primary'}`}>{exam.course_code}</div>
                      <div className={`text-[10px] font-medium mt-0.5 truncate ${selectedExam?.id === exam.id ? 'text-white/70' : 'text-text-secondary'}`}>{exam.course_name || 'Course'}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${pdfText ? 'bg-primary/5 border-primary/20' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${pdfText ? 'text-primary' : 'text-orange-600'}`}>
                  {pdfText ? '📄 Flashcards will be generated from your PDF' : '⚠️ Upload a PDF for accurate flashcards'}
                </p>
              </div>

              <button onClick={() => generateCards(0)} disabled={genLoading || !selectedExam || pdfLoading} className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10 disabled:opacity-50">
                {genLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> {cards.length ? 'Regenerate' : 'Generate Flashcards'}</>}
              </button>

              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-error uppercase tracking-widest mb-1">Failed</p>
                    <p className="text-[10px] text-error/80 font-medium">{error}</p>
                    <button onClick={() => generateCards(0)} className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 hover:underline">Try Again →</button>
                  </div>
                </div>
              )}
            </div>

            {cards.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-border p-6 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-text-secondary uppercase tracking-widest">Progress</span>
                  <span className="text-xs font-black text-primary">{currentIdx + 1} / {cards.length}</span>
                </div>
                <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }} className="h-full bg-primary rounded-full" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveCards} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${saved ? 'bg-success/10 text-success border-success/20' : 'bg-bg border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
                    {saved ? '✓ Saved!' : 'Save Cards'}
                  </button>
                  <button onClick={shareToWhatsApp} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-green-50 text-green-600 border border-green-100 hover:bg-green-500 hover:text-white transition-all">Share</button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {cards.length > 0 ? (
              <div className="space-y-6">
                <div className="relative h-72 md:h-80 cursor-pointer" onClick={() => setFlipped(f => !f)} style={{ perspective: '1000px' }}>
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative w-full h-full"
                  >
                    <div className="absolute inset-0 bg-white rounded-[2rem] border border-border shadow-sm flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden' }}>
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 opacity-60">Tap to reveal answer</div>
                      <h3 className="text-xl md:text-2xl font-black text-text-primary tracking-tight leading-tight">{cards[currentIdx]?.front}</h3>
                      <div className="absolute bottom-6 right-6 text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">{currentIdx + 1} / {cards.length}</div>
                    </div>
                    <div className="absolute inset-0 bg-primary rounded-[2rem] shadow-xl shadow-primary/20 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">Answer</div>
                      <p className="text-base md:text-lg font-bold text-white leading-relaxed">{cards[currentIdx]?.back}</p>
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button onClick={prev} disabled={currentIdx === 0} className="flex items-center gap-2 px-6 py-4 bg-white border border-border rounded-2xl font-black text-xs uppercase tracking-widest text-text-secondary hover:border-primary hover:text-primary transition-all disabled:opacity-30">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button onClick={restart} className="flex items-center gap-2 px-4 py-4 bg-bg border border-border rounded-2xl font-black text-xs uppercase tracking-widest text-text-secondary hover:bg-white transition-all">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  {currentIdx === cards.length - 1 ? (
                    <button onClick={restart} className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all">
                      <RefreshCw className="h-4 w-4" /> Restart
                    </button>
                  ) : (
                    <button onClick={next} className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all">
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">All Cards ({cards.length})</h3>
                  </div>
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {cards.map((card, i) => (
                      <button key={i} onClick={() => { setCurrentIdx(i); setFlipped(false); }} className={`w-full text-left p-4 hover:bg-bg transition-all ${currentIdx === i ? 'bg-primary/5 border-l-4 border-primary' : ''}`}>
                        <div className="font-black text-xs text-text-primary truncate">{card.front}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5 truncate">{card.back}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-white rounded-[2rem] border border-border flex flex-col items-center justify-center text-center p-12 shadow-sm">
                <AnimatePresence>
                  {genLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 flex flex-col items-center">
                      <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-pulse">
                        <Layers className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tighter">Creating your flashcards...</h3>
                        <p className="text-text-secondary text-sm font-medium">Extracting key terms from your course material.</p>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="h-24 w-24 bg-bg rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-border">
                        <Layers className="h-12 w-12 text-text-secondary opacity-20" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tighter">Ready to create cards</h3>
                        <p className="text-text-secondary text-sm font-medium max-w-xs mx-auto">Upload your PDF, select an exam and click Generate Flashcards.</p>
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