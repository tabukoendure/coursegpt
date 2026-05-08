import React from 'react';
import { BookOpen, Sparkles, Loader2, RefreshCw, Share2, CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { askGemini } from '../lib/gemini';

interface MCQ {
  type: 'mcq';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Theory {
  type: 'theory';
  question: string;
  modelAnswer: string;
  marks: number;
}

type Question = MCQ | Theory;

export default function Quiz() {
  const [exams, setExams] = React.useState<any[]>([]);
  const [selectedExam, setSelectedExam] = React.useState<any>(null);
  const [quizType, setQuizType] = React.useState<'mcq' | 'theory' | 'both'>('mcq');
  const [questionCount, setQuestionCount] = React.useState<number>(10);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [theoryAnswer, setTheoryAnswer] = React.useState('');
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [showResult, setShowResult] = React.useState(false);
  const [quizDone, setQuizDone] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [genLoading, setGenLoading] = React.useState(false);
  const [genError, setGenError] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [savedQuizzes, setSavedQuizzes] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<'generate' | 'saved'>('generate');

  React.useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: examsData } = await supabase
        .from('user_exams').select('*').eq('user_id', user.id)
        .order('exam_date', { ascending: true });
      setExams(examsData || []);
      if (examsData && examsData.length > 0) setSelectedExam(examsData[0]);
      const { data: quizData } = await supabase
        .from('saved_quizzes').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSavedQuizzes(quizData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPdfText = async (pdfUrl: string): Promise<string> => {
    try {
      const res = await fetch(pdfUrl);
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return '';
    }
  };

  const parseQuestions = (text: string): Question[] | null => {
    try {
      const clean = text.replace(/```json|```/gi, '').trim();
      // Try to find JSON array
      const start = clean.indexOf('[');
      const end = clean.lastIndexOf(']');
      if (start === -1 || end === -1) return null;
      const parsed = JSON.parse(clean.substring(start, end + 1));
      if (!Array.isArray(parsed) || parsed.length === 0) return null;
      return parsed;
    } catch {
      try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
      } catch { /* ignore */ }
      return null;
    }
  };

  const generateQuiz = async (retryCount = 0) => {
    if (!selectedExam) return;
    setGenLoading(true);
    setGenError('');
    if (retryCount === 0) {
      setQuestions([]);
      setCurrentIdx(0);
      setSelectedAnswer(null);
      setTheoryAnswer('');
      setAnswers({});
      setShowResult(false);
      setQuizDone(false);
      setScore(0);
      setSaved(false);
    }

    try {
      const courseContext = `${selectedExam.course_code} (${selectedExam.course_name})`;

      // Always try to read PDF
      let pdfText = '';
      if (selectedExam.pdf_url) {
        pdfText = await fetchPdfText(selectedExam.pdf_url);
      }

      const pdfInstruction = pdfText
        ? `IMPORTANT: You MUST generate ALL questions strictly and ONLY from the following course material. Do NOT add anything outside this material:\n\nPDF Content (base64): ${pdfText.substring(0, 2500)}\n\n`
        : `Generate questions based on common Nigerian university exam patterns for ${courseContext}.\n\n`;

      let prompt = '';

      if (quizType === 'mcq') {
        prompt = `${pdfInstruction}Generate exactly ${questionCount} MCQ questions for ${courseContext}. Exam date: ${selectedExam.exam_date}. Difficulty: ${selectedExam.difficulty}.

Each question MUST:
- Come strictly from the course material above
- Have exactly 4 options
- Have one clearly correct answer

Return ONLY this JSON array, nothing else, no backticks:
[{"type":"mcq","question":"question here","options":["option A","option B","option C","option D"],"correctAnswer":"exact option text","explanation":"why this is correct"}]`;

      } else if (quizType === 'theory') {
        prompt = `${pdfInstruction}Generate exactly ${questionCount} theory/essay questions for ${courseContext}. Exam date: ${selectedExam.exam_date}. Difficulty: ${selectedExam.difficulty}.

Each question MUST:
- Come strictly from the course material above
- Have a detailed model answer
- Be exam-standard

Return ONLY this JSON array, nothing else, no backticks:
[{"type":"theory","question":"question here","modelAnswer":"detailed model answer here","marks":10}]`;

      } else {
        const mcqCount = Math.floor(questionCount * 0.6);
        const theoryCount = questionCount - mcqCount;
        prompt = `${pdfInstruction}Generate exactly ${mcqCount} MCQ questions and ${theoryCount} theory questions for ${courseContext}. Exam date: ${selectedExam.exam_date}. Difficulty: ${selectedExam.difficulty}.

All questions MUST come strictly from the course material above.

Return ONLY this JSON array mixing both types, nothing else, no backticks:
[{"type":"mcq","question":"question here","options":["option A","option B","option C","option D"],"correctAnswer":"exact option text","explanation":"why this is correct"},{"type":"theory","question":"question here","modelAnswer":"detailed model answer","marks":10}]`;
      }

      const response = await askGemini(prompt, selectedExam.course_code);
      const parsed = parseQuestions(response);

      if (parsed && parsed.length > 0) {
        setQuestions(parsed);
      } else if (retryCount < 2) {
        setGenLoading(false);
        setTimeout(() => generateQuiz(retryCount + 1), 2000);
        return;
      } else {
        setGenError('Could not generate quiz. Please try again.');
      }
    } catch (err) {
      if (retryCount < 2) {
        setGenLoading(false);
        setTimeout(() => generateQuiz(retryCount + 1), 2000);
        return;
      }
      setGenError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const handleMCQAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    setAnswers(prev => ({ ...prev, [currentIdx]: option }));
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIdx === questions.length - 1) {
      let correctCount = 0;
      questions.forEach((q, i) => {
        if (q.type === 'mcq' && answers[i] === (q as MCQ).correctAnswer) correctCount++;
      });
      setScore(correctCount);
      setQuizDone(true);
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedAnswer(null);
      setTheoryAnswer('');
      setShowResult(false);
    }
  };

  const handleTheoryNext = () => {
    setAnswers(prev => ({ ...prev, [currentIdx]: theoryAnswer }));
    handleNext();
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setTheoryAnswer('');
    setAnswers({});
    setShowResult(false);
    setQuizDone(false);
    setScore(0);
  };

  const saveQuiz = async () => {
    if (!questions.length || !selectedExam) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('saved_quizzes').insert([{
        user_id: user.id,
        course_code: selectedExam.course_code,
        course_name: selectedExam.course_name,
        quiz_type: quizType,
        questions: JSON.stringify(questions),
        question_count: questions.length,
      }]).select().single();
      if (data) setSavedQuizzes(prev => [data, ...prev]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
  };

  const loadSavedQuiz = (quiz: any) => {
    try {
      const parsed = JSON.parse(quiz.questions);
      setQuestions(parsed);
      setSelectedExam({ course_code: quiz.course_code, course_name: quiz.course_name });
      setCurrentIdx(0);
      setSelectedAnswer(null);
      setTheoryAnswer('');
      setAnswers({});
      setShowResult(false);
      setQuizDone(false);
      setScore(0);
      setActiveTab('generate');
    } catch (err) { console.error(err); }
  };

  const shareToWhatsApp = () => {
    if (!questions.length) return;
    const mcqOnly = questions.filter(q => q.type === 'mcq') as MCQ[];
    const text = `📝 *${selectedExam?.course_code} Quiz*\n\n` +
      mcqOnly.slice(0, 5).map((q, i) =>
        `*Q${i + 1}: ${q.question}*\nA) ${q.options[0]}\nB) ${q.options[1]}\nC) ${q.options[2]}\nD) ${q.options[3]}\n✅ Answer: ${q.correctAnswer}`
      ).join('\n\n') + `\n\n_Generated by CourseGPT 🎓_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const mcqQuestions = questions.filter(q => q.type === 'mcq').length;
  const currentQuestion = questions[currentIdx];

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-64 bg-border rounded-lg" />
      <div className="h-96 bg-border rounded-[2rem]" />
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">Quiz</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">Generate exam-standard quizzes from your uploaded PDF.</p>
        </div>
        <div className="bg-white p-1 border border-border rounded-2xl flex w-fit shadow-sm">
          <button onClick={() => setActiveTab('generate')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'generate' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:bg-bg'}`}>Generate</button>
          <button onClick={() => setActiveTab('saved')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:bg-bg'}`}>Saved ({savedQuizzes.length})</button>
        </div>
      </header>

      {activeTab === 'saved' ? (
        <div className="space-y-4">
          {savedQuizzes.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-border p-16 text-center shadow-sm">
              <div className="h-20 w-20 bg-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-border">
                <BookOpen className="h-10 w-10 text-text-secondary opacity-20" />
              </div>
              <h3 className="text-xl font-black text-text-primary mb-2">No saved quizzes yet</h3>
              <p className="text-sm text-text-secondary">Generate a quiz and save it to access it here anytime.</p>
            </div>
          ) : savedQuizzes.map(quiz => (
            <div key={quiz.id} className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between shadow-sm">
              <div>
                <div className="font-black text-text-primary uppercase tracking-tight">{quiz.course_code}</div>
                <div className="text-[10px] text-text-secondary font-bold mt-0.5 uppercase tracking-widest">
                  {quiz.question_count} questions • {quiz.quiz_type} • {new Date(quiz.created_at).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => loadSavedQuiz(quiz)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all">
                Take Quiz <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-[2rem] border border-border p-6 shadow-sm space-y-5">
              <h2 className="text-xs font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Quiz Settings
              </h2>

              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Select Exam</label>
                <div className="space-y-2">
                  {exams.length === 0 ? (
                    <div className="text-center py-6 bg-bg rounded-2xl border border-border">
                      <p className="text-xs font-bold text-text-secondary mb-2">No exams added yet</p>
                      <a href="/dashboard/planner" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Go to Planner → Add Exam</a>
                    </div>
                  ) : exams.map(exam => (
                    <button
                      key={exam.id}
                      onClick={() => { setSelectedExam(exam); setQuestions([]); setGenError(''); }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${selectedExam?.id === exam.id ? 'bg-primary text-white border-primary' : 'bg-bg border-border hover:border-primary/40'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`font-black text-xs uppercase ${selectedExam?.id === exam.id ? 'text-white' : 'text-text-primary'}`}>{exam.course_code}</div>
                        {exam.pdf_url
                          ? <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${selectedExam?.id === exam.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>PDF ✓</span>
                          : <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${selectedExam?.id === exam.id ? 'bg-white/20 text-white' : 'bg-error/10 text-error'}`}>No PDF</span>
                        }
                      </div>
                      <div className={`text-[10px] truncate mt-0.5 ${selectedExam?.id === exam.id ? 'text-white/70' : 'text-text-secondary'}`}>{exam.course_name}</div>
                      <div className={`text-[8px] font-black mt-1 uppercase ${selectedExam?.id === exam.id ? 'text-white/50' : 'text-text-secondary opacity-60'}`}>
                        {exam.difficulty} • {new Date(exam.exam_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Quiz Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mcq', 'theory', 'both'] as const).map(type => (
                    <button key={type} onClick={() => setQuizType(type)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${quizType === type ? 'bg-primary text-white border-primary' : 'bg-bg border-border text-text-secondary hover:border-primary/40'}`}>{type}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Number of Questions</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 50].map(count => (
                    <button key={count} onClick={() => setQuestionCount(count)} className={`py-2.5 rounded-xl text-[10px] font-black transition-all border ${questionCount === count ? 'bg-primary text-white border-primary' : 'bg-bg border-border text-text-secondary hover:border-primary/40'}`}>{count}</button>
                  ))}
                </div>
              </div>

              {selectedExam && (
                <div className={`p-3 rounded-xl border ${selectedExam.pdf_url ? 'bg-primary/5 border-primary/20' : 'bg-error/5 border-error/20'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${selectedExam.pdf_url ? 'text-primary' : 'text-error'}`}>
                    {selectedExam.pdf_url ? '📄 Quiz will be generated strictly from your uploaded PDF' : '⚠️ No PDF — quiz will use general knowledge. Upload a PDF for better results.'}
                  </p>
                </div>
              )}

              <button
                onClick={() => generateQuiz(0)}
                disabled={genLoading || !selectedExam}
                className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/10 disabled:opacity-50"
              >
                {genLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> {questions.length ? 'Regenerate' : 'Generate Quiz'}</>}
              </button>

              {genError && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-error uppercase tracking-widest mb-1">Failed</p>
                    <p className="text-[10px] text-error/80 font-medium">{genError}</p>
                    <button onClick={() => generateQuiz(0)} className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 hover:underline">Try Again →</button>
                  </div>
                </div>
              )}

              {questions.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={saveQuiz} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${saved ? 'bg-success/10 text-success border-success/20' : 'bg-bg border-border text-text-secondary hover:border-primary hover:text-primary'}`}>
                    {saved ? '✓ Saved!' : 'Save Quiz'}
                  </button>
                  <button onClick={shareToWhatsApp} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-green-50 text-green-600 border border-green-100 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-1">
                    <Share2 className="h-3 w-3" /> Share
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right — Quiz Display */}
          <div className="lg:col-span-2">
            {questions.length === 0 ? (
              <div className="min-h-[500px] bg-white rounded-[2rem] border border-border flex flex-col items-center justify-center text-center p-12 shadow-sm">
                <AnimatePresence>
                  {genLoading ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 flex flex-col items-center">
                      <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-pulse">
                        <Sparkles className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tighter">Reading your PDF...</h3>
                        <p className="text-text-secondary text-sm font-medium">Generating exam-standard questions from your course material.</p>
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
                        <BookOpen className="h-12 w-12 text-text-secondary opacity-20" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-text-primary mb-2 tracking-tighter">Ready to quiz you</h3>
                        <p className="text-text-secondary text-sm font-medium max-w-xs mx-auto">Pick your exam, quiz type and number of questions, then hit Generate.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : quizDone ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
                <div className={`p-8 text-center ${mcqQuestions === 0 ? 'bg-primary' : score / mcqQuestions >= 0.7 ? 'bg-success' : score / mcqQuestions >= 0.5 ? 'bg-primary' : 'bg-error'}`}>
                  <Trophy className="h-12 w-12 text-white mx-auto mb-3" />
                  <h2 className="text-3xl font-black text-white tracking-tighter">
                    {mcqQuestions > 0 ? `${score}/${mcqQuestions}` : 'Quiz Complete!'}
                  </h2>
                  <p className="text-white/80 font-bold mt-1">
                    {mcqQuestions > 0
                      ? score / mcqQuestions >= 0.7 ? '🎉 Excellent! You are exam ready!'
                        : score / mcqQuestions >= 0.5 ? '👍 Good effort! Keep studying!'
                        : '📚 Keep practicing, you will get there!'
                      : '📝 Theory quiz complete! Review the model answers below.'
                    }
                  </p>
                </div>
                <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                  {questions.map((q, i) => (
                    <div key={i} className="p-4 bg-bg rounded-2xl border border-border">
                      <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Q{i + 1} — {q.type}</div>
                      <p className="font-bold text-sm text-text-primary mb-3">{q.question}</p>
                      {q.type === 'mcq' ? (
                        <div className="space-y-1">
                          <div className={`flex items-center gap-2 text-xs font-bold p-2 rounded-xl ${answers[i] === (q as MCQ).correctAnswer ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
                            {answers[i] === (q as MCQ).correctAnswer ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                            Your answer: {answers[i] || 'Not answered'}
                          </div>
                          {answers[i] !== (q as MCQ).correctAnswer && (
                            <div className="flex items-center gap-2 text-xs font-bold p-2 rounded-xl text-success bg-success/10">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              Correct: {(q as MCQ).correctAnswer}
                            </div>
                          )}
                          <p className="text-[11px] text-text-secondary font-medium mt-2 italic">{(q as MCQ).explanation}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-text-secondary p-3 bg-white rounded-xl border border-border">
                            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Your Answer:</div>
                            {answers[i] || 'Not answered'}
                          </div>
                          <div className="text-xs font-bold p-3 bg-success/5 rounded-xl border border-success/20">
                            <div className="text-[10px] font-black text-success uppercase tracking-widest mb-1">Model Answer:</div>
                            <p className="text-text-secondary font-medium">{(q as Theory).modelAnswer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-border flex gap-3">
                  <button onClick={restartQuiz} className="flex-1 py-4 bg-bg border border-border text-text-primary font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-2">
                    <RotateCcw className="h-4 w-4" /> Retake
                  </button>
                  <button onClick={() => generateQuiz(0)} className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4" /> New Quiz
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{selectedExam?.course_code} — {quizType.toUpperCase()}</span>
                    <span className="text-[10px] font-black text-primary">{currentIdx + 1} / {questions.length}</span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} className="h-full bg-primary rounded-full" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-[2rem] border border-border shadow-sm p-6 md:p-8"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${currentQuestion?.type === 'mcq' ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-600'}`}>
                        {currentQuestion?.type === 'mcq' ? 'Multiple Choice' : 'Theory'}
                      </span>
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Question {currentIdx + 1}</span>
                    </div>

                    <h3 className="text-lg font-black text-text-primary mb-6 leading-tight">{currentQuestion?.question}</h3>

                    {currentQuestion?.type === 'mcq' ? (
                      <div className="space-y-3">
                        {(currentQuestion as MCQ).options.map((option, i) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrect = option === (currentQuestion as MCQ).correctAnswer;
                          return (
                            <button
                              key={i}
                              onClick={() => handleMCQAnswer(option)}
                              disabled={!!selectedAnswer}
                              className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                                showResult && isCorrect ? 'bg-success/10 border-success text-success' :
                                showResult && isSelected && !isCorrect ? 'bg-error/10 border-error text-error' :
                                isSelected ? 'bg-primary/10 border-primary text-primary' :
                                'bg-bg border-border text-text-primary hover:border-primary/40 disabled:hover:border-border'
                              }`}
                            >
                              <span className="font-black mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                              {option}
                            </button>
                          );
                        })}
                        {showResult && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-bg rounded-2xl border border-border mt-2">
                            <p className="text-xs font-bold text-text-secondary italic">{(currentQuestion as MCQ).explanation}</p>
                          </motion.div>
                        )}
                        {showResult && (
                          <button onClick={handleNext} className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-2">
                            {currentIdx === questions.length - 1 ? 'See Results' : 'Next Question'} <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea
                          value={theoryAnswer}
                          onChange={e => setTheoryAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          rows={6}
                          className="w-full border border-border rounded-2xl px-4 py-3 text-sm font-medium text-text-primary outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                          <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Model Answer:</div>
                          <p className="text-xs font-medium text-text-secondary">{(currentQuestion as Theory).modelAnswer}</p>
                        </div>
                        <button
                          onClick={handleTheoryNext}
                          className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                          {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}