import React from 'react';
import {
  Send, Loader2, Sparkles, MessageSquare, Copy, Share2,
  User, Plus, History, Hash, FileText, X, Menu, Trash2,
  CheckCircle2, FileUp, Zap, BookOpen, Target, AlignLeft
} from 'lucide-react';
import { askGemini, checkDailyLimit, incrementUsage, parseQuizResponse, QuizQuestion } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  course_code?: string;
  isPdfCard?: boolean;
  filename?: string;
  pageCount?: number;
}

interface ChatSession {
  id: string;
  title: string;
  course_code: string;
  created_at: string;
  updated_at: string;
}

export default function AiTutor() {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sessionsLoading, setSessionsLoading] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Daily limit
  const [messagesRemaining, setMessagesRemaining] = React.useState(30);
  const [limitReached, setLimitReached] = React.useState(false);

  // PDF States
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [pdfContext, setPdfContext] = React.useState<string | null>(null);
  const [pdfName, setPdfName] = React.useState<string | null>(null);
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [uploadCourseCode, setUploadCourseCode] = React.useState('');

  // Quiz States
  const [quizMode, setQuizMode] = React.useState(false);
  const [quizQuestions, setQuizQuestions] = React.useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<string[]>([]);
  const [quizGenerating, setQuizGenerating] = React.useState(false);

  // Course code for current session
  const [activeCourseCode, setActiveCourseCode] = React.useState('General');
  const [showCourseInput, setShowCourseInput] = React.useState(false);
  const [courseCodeInput, setCourseCodeInput] = React.useState('');

  React.useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        fetchSessions(user.id);
        loadDailyLimit(user.id);
      }
    };
    init();
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDailyLimit = async (userId: string) => {
    const { remaining, allowed } = await checkDailyLimit(supabase, userId);
    setMessagesRemaining(remaining);
    setLimitReached(!allowed);
  };

  const fetchSessions = async (userId?: string) => {
    try {
      setSessionsLoading(true);
      const uid = userId || currentUser?.id;
      if (!uid) return;

      const { data } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        setSessions(data);
        if (!currentSessionId) loadSession(data[0].id);
      }
    } catch (err) {
      console.error('Fetch sessions error:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setMobileMenuOpen(false);
    setLoading(true);
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    } catch (err) {
      console.error('Load session error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setMobileMenuOpen(false);
    setPdfContext(null);
    setPdfName(null);
    setActiveCourseCode('General');
    setQuizMode(false);
  };

  const extractPDFText = async (file: File): Promise<{ text: string; pages: number }> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    if (fullText.length > 25000) {
      fullText = fullText.substring(0, 25000) + '\n\n[Document truncated to fit AI context limit]';
    }
    return { text: fullText, pages: pdf.numPages };
  };

  const handleFileUpload = async () => {
    if (!pdfFile || !uploadCourseCode.trim()) return;
    try {
      setUploading(true);
      const user = currentUser;
      if (!user) return;

      const fileName = `${Date.now()}_${pdfFile.name}`;
      const filePath = `${user.id}/pdfs/${fileName}`;
      await supabase.storage.from('past-questions').upload(filePath, pdfFile);

      const { text, pages } = await extractPDFText(pdfFile);
      setPdfContext(text);
      setPdfName(pdfFile.name);
      setActiveCourseCode(uploadCourseCode.toUpperCase());

      const systemMsg: ChatMessage = {
        role: 'system',
        content: `PDF loaded: ${pdfFile.name}. ${pages} pages read successfully.`,
        created_at: new Date().toISOString(),
        isPdfCard: true,
        filename: pdfFile.name,
        pageCount: pages,
      };
      setMessages(prev => [...prev, systemMsg]);
      setShowUploadModal(false);
      setPdfFile(null);
    } catch (err) {
      console.error('PDF Upload error:', err);
      alert('Failed to process PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (text: string, mode: any = 'general') => {
    if (!text.trim() || loading) return;

    const user = currentUser;
    if (!user) return;

    // Check daily limit
    const { allowed, remaining } = await checkDailyLimit(supabase, user.id);
    if (!allowed) {
      setLimitReached(true);
      setMessagesRemaining(0);
      return;
    }

    let sessionId = currentSessionId;
    const courseCode = activeCourseCode || 'General';

    // Create session if needed
    if (!sessionId) {
      try {
        const { data: newSession, error } = await supabase
          .from('chat_sessions')
          .insert([{
            user_id: user.id,
            title: text.substring(0, 35),
            course_code: courseCode,
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (error) {
          console.error('Session create error:', error);
          return;
        }
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
        fetchSessions();
      } catch (err) {
        console.error('Session error:', err);
        return;
      }
    }

    // Add user message to UI
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
      course_code: courseCode,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Save user message to DB
    try {
      await supabase.from('chat_messages').insert([{
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: text,
        course_code: courseCode,
      }]);
    } catch (err) {
      console.error('Save message error:', err);
    }

    // Increment usage
    await incrementUsage(supabase, user.id);
    setMessagesRemaining(Math.max(0, remaining - 1));

    try {
      const response = await askGemini(
        text,
        courseCode,
        mode,
pdfContext || undefined,
  messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
);
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
        course_code: courseCode,
      };
      setMessages(prev => [...prev, aiMsg]);

      // Save AI response
      await supabase.from('chat_messages').insert([{
        session_id: sessionId,
        user_id: user.id,
        role: 'assistant',
        content: response,
        course_code: courseCode,
      }]);

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      fetchSessions();
    } catch (err) {
      console.error('AI Error:', err);
      const errorMsg: ChatMessage = {
        role: 'system',
        content: 'Failed to get AI response. Please check your connection.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeCourseCode || activeCourseCode === 'General') {
      setShowCourseInput(true);
      return;
    }
    setQuizGenerating(true);
    try {
      const prompt = `Generate a quiz for ${activeCourseCode} with 5 MCQ questions and 2 theory questions based on common Nigerian university exam patterns. Follow the EXACT format in your instructions.`;
      const response = await askGemini(prompt, activeCourseCode, 'quiz');
      const parsed = parseQuizResponse(response);
      if (parsed.length > 0) {
        setQuizQuestions(parsed);
        setUserAnswers(new Array(parsed.length).fill(''));
        setCurrentQuizIndex(0);
        setQuizMode(true);
      } else {
        await handleSend(prompt, 'quiz');
      }
    } catch (err) {
      console.error('Quiz generation error:', err);
    } finally {
      setQuizGenerating(false);
    }
  };

  const submitQuizForMarking = async () => {
    setQuizMode(false);
    const markPrompt = `Mark these student answers:

${quizQuestions.map((q, i) => `Question ${i + 1} (${q.type.toUpperCase()}): ${q.question}
Student Answer: ${userAnswers[i] || 'No answer provided'}
${q.correctAnswer ? `Correct Answer: ${q.correctAnswer}` : ''}
${q.modelAnswer ? `Model Answer: ${q.modelAnswer}` : ''}
${q.marks ? `Available Marks: ${q.marks}` : ''}`).join('\n\n')}

For each question:
- Score earned vs total marks
- What was correct
- What was missing
- Feedback

Then give:
- Total score out of ${quizQuestions.reduce((sum, q) => sum + (q.marks || (q.type === 'mcq' ? 2 : 10)), 0)}
- Grade (A=80%+ B=65%+ C=50%+ F=below 50%)
- One encouraging message
- Two topics to review`;

    await handleSend(markPrompt, 'mark');
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;
    await supabase.from('chat_sessions').delete().eq('id', id);
    if (currentSessionId === id) startNewChat();
    fetchSessions();
  };

  const SessionsList = () => (
    <>
      {sessionsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-bg/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-10 opacity-30">
          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
          <p className="text-[10px] font-bold">No sessions yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={`w-full p-3 rounded-xl text-left transition-all group border cursor-pointer ${currentSessionId === session.id ? 'bg-primary-light border-primary' : 'hover:bg-bg border-transparent'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate flex-1">
                  <Hash className="h-3 w-3 text-primary opacity-50 shrink-0" />
                  <span className={`text-xs font-bold truncate ${currentSessionId === session.id ? 'text-primary' : 'text-text-primary'}`}>
                    {session.title || 'Conversation'}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error/10 hover:text-error rounded-md transition-all shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[8px] font-black uppercase text-text-secondary">{session.course_code}</span>
                <span className="text-[8px] text-text-secondary opacity-60">
                  {new Date(session.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-140px)] bg-white rounded-none md:rounded-[2.5rem] border-0 md:border border-border shadow-sm overflow-hidden relative">

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white z-[70] lg:hidden flex flex-col border-r border-border"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-black text-primary tracking-tighter">Conversations</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-text-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <button onClick={startNewChat} className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all">
                <Plus className="h-4 w-4 mr-2" /> New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-20">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                <History className="h-3 w-3" /> Recent
              </p>
              <SessionsList />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="w-64 border-r border-border bg-bg/20 flex-col hidden lg:flex shrink-0">
        <div className="p-4 border-b border-border bg-white">
          <button onClick={startNewChat} className="w-full py-2.5 bg-primary text-white font-bold rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all text-sm">
            <Plus className="h-4 w-4 mr-2" /> New Chat
          </button>
        </div>

        {/* Daily limit indicator */}
        <div className="px-4 py-3 border-b border-border bg-white">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Daily AI Messages</span>
            <span className={`text-[9px] font-black ${messagesRemaining < 5 ? 'text-error' : 'text-primary'}`}>
              {messagesRemaining}/30
            </span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${messagesRemaining < 5 ? 'bg-error' : 'bg-primary'}`}
              style={{ width: `${(messagesRemaining / 30) * 100}%` }}
            />
          </div>
          {messagesRemaining < 10 && (
            <p className="text-[9px] text-text-secondary mt-1">
              {messagesRemaining === 0 ? 'Limit reached. Resets tomorrow.' : `${messagesRemaining} messages left today`}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
            <History className="h-3 w-3" /> Recent Chats
          </p>
          <SessionsList />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">

        {/* Top Bar */}
        <div className="h-16 shrink-0 border-b border-border bg-white flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-text-primary lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                AI Tutor
                {pdfName ? (
                  <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] rounded-full flex items-center border border-success/20">
                    <FileText className="h-3 w-3 mr-1" /> {pdfName}
                    <button onClick={() => { setPdfContext(null); setPdfName(null); }} className="ml-1.5 hover:text-error">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-primary-light text-primary text-[10px] rounded-full border border-primary/10">
                    {activeCourseCode}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile limit indicator */}
            <div className="lg:hidden flex items-center gap-1">
              <Zap className={`h-3 w-3 ${messagesRemaining < 5 ? 'text-error' : 'text-primary'}`} />
              <span className={`text-[10px] font-black ${messagesRemaining < 5 ? 'text-error' : 'text-primary'}`}>
                {messagesRemaining}
              </span>
            </div>
            <button onClick={startNewChat} className="flex items-center gap-1 border border-border rounded-xl px-3 py-2 hover:border-primary transition-all">
              <Plus className="h-4 w-4 text-primary" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-tight">New</span>
            </button>
          </div>
        </div>

        {/* Course code input modal */}
        <AnimatePresence>
          {showCourseInput && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
              >
                <h3 className="font-black text-text-primary mb-2">Which course?</h3>
                <p className="text-sm text-text-secondary mb-4">Enter the course code to generate a targeted quiz</p>
                <input
                  type="text"
                  value={courseCodeInput}
                  onChange={e => setCourseCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. BCH201"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowCourseInput(false)} className="flex-1 border border-border rounded-xl py-3 text-sm font-bold text-text-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (courseCodeInput) {
                        setActiveCourseCode(courseCodeInput);
                        setShowCourseInput(false);
                        setTimeout(() => handleGenerateQuiz(), 100);
                      }
                    }}
                    className="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-black"
                  >
                    Generate Quiz
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-bg/5">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="p-6 bg-primary-light rounded-[2.5rem] mb-6">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-text-primary mb-3">CourseGPT Tutor</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-8">
                Ask questions, get exam predictions, generate quizzes, or upload your lecture notes.
              </p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => handleSend("What common exam topics should I focus on?", "predict")} className="p-4 bg-white border border-border rounded-2xl text-[10px] font-bold hover:border-primary transition-all text-center">
                  🎯 Exam Predictions
                </button>
                <button onClick={() => handleSend("Give me a study plan for this week.", "general")} className="p-4 bg-white border border-border rounded-2xl text-[10px] font-bold hover:border-primary transition-all text-center">
                  📅 Study Plan
                </button>
                <button onClick={() => setShowUploadModal(true)} className="p-4 bg-white border border-border rounded-2xl text-[10px] font-bold hover:border-primary transition-all text-center">
                  📄 Upload PDF
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start max-w-[90%] md:max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role !== 'system' && (
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-bg border border-border' : 'bg-primary text-white font-black text-[10px]'}`}>
                    {msg.role === 'user' ? <User className="h-5 w-5 text-text-secondary" /> : 'AI'}
                  </div>
                )}
                <div>
                  {msg.isPdfCard ? (
                    <div className="p-4 bg-success/5 border border-success/20 rounded-2xl flex items-center gap-4">
                      <div className="h-10 w-10 bg-success/10 rounded-xl flex items-center justify-center">
                        <FileText className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-success uppercase">PDF Loaded</div>
                        <div className="text-sm font-bold text-text-primary">{msg.filename}</div>
                        <div className="text-[10px] text-text-secondary">{msg.pageCount} pages processed</div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-success ml-auto" />
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : msg.role === 'system' ? 'bg-orange-50 text-orange-700 border border-orange-100 text-xs italic' : 'bg-white border border-border rounded-tl-none'}`}>
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                      {msg.role === 'assistant' && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3">
                          <button onClick={() => navigator.clipboard.writeText(msg.content)} className="p-1.5 hover:bg-bg rounded-lg text-text-secondary transition-all">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('From CourseGPT:\n\n' + msg.content.substring(0, 500))}`, '_blank')} className="p-1.5 hover:bg-bg rounded-lg text-text-secondary transition-all">
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-auto opacity-50">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex items-center gap-3 bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-border">
                <div className="flex gap-1.5">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay }} className="h-2 w-2 bg-primary rounded-full" />
                  ))}
                </div>
                <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Thinking...</span>
              </div>
            </motion.div>
          )}

          {/* Limit reached banner */}
          {limitReached && (
            <div className="bg-error/10 border border-error/20 rounded-2xl p-4 text-center">
              <p className="text-sm font-black text-error">Daily limit reached (30 messages)</p>
              <p className="text-xs text-text-secondary mt-1">Your limit resets at midnight. Upgrade to Pro for unlimited messages.</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 bg-white border-t border-border flex items-center gap-2 overflow-x-auto shrink-0">
          <button onClick={() => setShowUploadModal(true)} className="flex items-center whitespace-nowrap px-3 py-2 bg-bg border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all gap-1.5">
            <FileUp className="h-3.5 w-3.5" /> Upload PDF
          </button>
          <button onClick={() => handleSend("What topics will most likely come out in the next exam?", "predict")} className="flex items-center whitespace-nowrap px-3 py-2 bg-bg border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Exam Predictions
          </button>
          <button onClick={() => handleSend("Explain a difficult topic in simple terms.", "explain")} className="flex items-center whitespace-nowrap px-3 py-2 bg-bg border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Explain Topic
          </button>
          <button onClick={() => handleSend("Summarize the most important points for my exam.", "summarize")} className="flex items-center whitespace-nowrap px-3 py-2 bg-bg border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all gap-1.5">
            <AlignLeft className="h-3.5 w-3.5" /> Summarize
          </button>
        </div>

        {/* Input */}
        <div className="p-4 md:p-5 bg-white border-t border-border shrink-0">
          {limitReached ? (
            <div className="max-w-4xl mx-auto text-center py-2">
              <p className="text-xs font-bold text-error">Daily limit reached — resets at midnight</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="max-w-4xl mx-auto flex items-end gap-3">
              <div className="relative flex-1">
                <textarea
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="Ask anything... (Shift+Enter for new line)"
                  className="w-full pl-5 pr-14 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 bottom-2 p-3 bg-primary text-white rounded-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* PDF Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white p-8 rounded-t-[2rem] md:rounded-[2rem] w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-text-primary">Upload lecture material</h3>
                  <p className="text-sm text-text-secondary">AI will study your PDF and answer questions from it</p>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-2 text-text-secondary hover:bg-bg rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                onClick={() => document.getElementById('pdf-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-5 ${pdfFile ? 'border-success bg-success/5' : 'border-border hover:border-primary bg-bg/50'}`}
              >
                <input type="file" id="pdf-input" className="hidden" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                {pdfFile ? (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 text-success mx-auto" />
                    <div className="text-sm font-bold text-text-primary">{pdfFile.name}</div>
                    <div className="text-[10px] text-text-secondary">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    <button onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="text-xs font-bold text-error hover:underline">Remove</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileUp className="h-10 w-10 text-text-secondary mx-auto opacity-30" />
                    <div className="text-sm font-bold text-text-primary">Drop PDF here or click to browse</div>
                    <p className="text-[10px] text-text-secondary">PDF files up to 15MB</p>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Course code e.g. BCH201"
                value={uploadCourseCode}
                onChange={e => setUploadCourseCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-bg border border-border rounded-xl font-bold text-sm outline-none focus:border-primary mb-5"
              />

              <div className="flex gap-3">
                <button onClick={() => setShowUploadModal(false)} className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-text-secondary hover:bg-bg rounded-xl transition-all border border-border">
                  Cancel
                </button>
                <button
                  disabled={uploading || !pdfFile || !uploadCourseCode}
                  onClick={handleFileUpload}
                  className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white bg-primary rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading...</> : 'Upload & Study'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quiz Mode */}
      <AnimatePresence>
        {quizMode && quizQuestions.length > 0 && (
          <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-lg p-0 md:p-8">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-t-[2rem] md:rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <span className="text-xs font-black text-primary uppercase tracking-widest">Active Quiz — {activeCourseCode}</span>
                  <h4 className="text-xl font-black text-text-primary">Question {currentQuizIndex + 1} of {quizQuestions.length}</h4>
                </div>
                <button onClick={() => setQuizMode(false)} className="p-2 hover:bg-bg rounded-xl">
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="h-2 w-full bg-border rounded-full mb-6">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }} />
                </div>

                <h5 className="text-lg font-black text-text-primary mb-6 leading-tight">
                  {quizQuestions[currentQuizIndex]?.question}
                </h5>

                {quizQuestions[currentQuizIndex]?.type === 'mcq' ? (
                  <div className="space-y-3">
                    {quizQuestions[currentQuizIndex]?.options?.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const newAns = [...userAnswers];
                          newAns[currentQuizIndex] = opt;
                          setUserAnswers(newAns);
                        }}
                        className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${userAnswers[currentQuizIndex] === opt ? 'border-primary bg-primary-light text-primary' : 'border-border bg-white hover:border-primary/40'}`}
                      >
                        <span className="opacity-50 mr-3">{['A', 'B', 'C', 'D'][idx]})</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={5}
                    value={userAnswers[currentQuizIndex] || ''}
                    onChange={(e) => {
                      const newAns = [...userAnswers];
                      newAns[currentQuizIndex] = e.target.value;
                      setUserAnswers(newAns);
                    }}
                    placeholder="Type your answer here..."
                    className="w-full p-4 bg-bg border-2 border-border rounded-2xl focus:border-primary outline-none font-medium text-sm resize-none"
                  />
                )}
              </div>

              <div className="p-6 border-t border-border flex gap-3 shrink-0">
                <button
                  disabled={currentQuizIndex === 0}
                  onClick={() => setCurrentQuizIndex(prev => prev - 1)}
                  className="px-6 py-3 font-black text-xs uppercase tracking-widest text-text-secondary bg-bg rounded-xl disabled:opacity-30"
                >
                  Back
                </button>
                {currentQuizIndex === quizQuestions.length - 1 ? (
                  <button onClick={submitQuizForMarking} className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white bg-primary rounded-xl shadow-lg shadow-primary/25">
                    Submit for Marking 🎯
                  </button>
                ) : (
                  <button
                    disabled={!userAnswers[currentQuizIndex]}
                    onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                    className="flex-1 py-3 font-black text-xs uppercase tracking-widest text-white bg-primary rounded-xl disabled:opacity-50"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}