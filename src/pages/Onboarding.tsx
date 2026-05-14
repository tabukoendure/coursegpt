import React from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Calendar, 
  ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    level: '',
    department: '',
    courses: [] as string[],
    examDates: [] as { 
      course_code: string; 
      course_name: string; 
      exam_date: string;
      difficulty: string;
    }[],
  });
  const [courseInput, setCourseInput] = React.useState('');
  const [examForm, setExamForm] = React.useState({
    course_code: '',
    course_name: '',
    exam_date: '',
    difficulty: 'Medium',
  });

  const levels = [
    '100 Level', '200 Level', '300 Level',
    '400 Level', '500 Level'
  ];

  const departments = [
    'Nursing Science', 'Engineering', 'Law',
    'Pharmacy', 'MBBS', 'Other'
  ];

  const suggestedCourses = [
    'BCH201', 'ANA204', 'PIO214', 'PHY202',
    'CHM201', 'ANA202', 'BIO201', 'MTH201',
    'ENG201', 'GST101'
  ];

  const addCourse = (code: string) => {
    const upper = code.toUpperCase().trim();
    if (upper && !form.courses.includes(upper)) {
      setForm(prev => ({ 
        ...prev, 
        courses: [...prev.courses, upper] 
      }));
    }
    setCourseInput('');
  };

  const removeCourse = (code: string) => {
    setForm(prev => ({ 
      ...prev, 
      courses: prev.courses.filter(c => c !== code) 
    }));
  };

  const addExam = () => {
    if (!examForm.course_code || !examForm.exam_date) return;
    setForm(prev => ({ 
      ...prev, 
      examDates: [...prev.examDates, { ...examForm }] 
    }));
    setExamForm({ 
      course_code: '', 
      course_name: '', 
      exam_date: '', 
      difficulty: 'Medium' 
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile
      await supabase
  .from('profiles')
  .upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email,
    email: user.email,
    level: form.level,
    department: form.department,
    university: 'Achievers University',
  });

      // Save exam dates
      if (form.examDates.length > 0) {
        await supabase.from('user_exams').insert(
          form.examDates.map(e => ({ 
            ...e, 
            user_id: user.id 
          }))
        );
      }

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Your Level' },
    { number: 2, label: 'Your Courses' },
    { number: 3, label: 'Exam Dates' },
  ];

  return (
    <div className="min-h-screen bg-bg flex items-center 
      justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center 
          space-x-2 mb-8">
          <div className="p-2 bg-primary rounded-xl 
            shadow-lg shadow-primary/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black 
            text-text-primary tracking-tight uppercase">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center 
          gap-3 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full 
                  flex items-center justify-center 
                  text-xs font-black transition-all ${
                  step > s.number 
                    ? 'bg-success text-white' 
                    : step === s.number 
                      ? 'bg-primary text-white' 
                      : 'bg-border text-text-secondary'
                }`}>
                  {step > s.number 
                    ? <Check className="h-4 w-4" /> 
                    : s.number
                  }
                </div>
                <span className={`text-xs font-black 
                  uppercase tracking-widest hidden 
                  sm:block ${
                  step === s.number 
                    ? 'text-primary' 
                    : 'text-text-secondary opacity-50'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 rounded-full 
                  transition-all ${
                  step > s.number 
                    ? 'bg-success' 
                    : 'bg-border'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-border 
          rounded-[2rem] p-8 shadow-sm">
          <AnimatePresence mode="wait">

            {/* Step 1 — Level and Department */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black 
                    text-text-primary">
                    Welcome to CourseGPT! 🎓
                  </h2>
                  <p className="text-sm text-text-secondary 
                    mt-1">
                    Let's set up your profile so we can 
                    personalize your experience
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black 
                    text-text-secondary uppercase 
                    tracking-widest mb-3 block">
                    What level are you?
                  </label>
                  <div className="grid grid-cols-2 
                    sm:grid-cols-3 gap-3">
                    {levels.map(l => (
                      <button
                        key={l}
                        onClick={() => setForm({ 
                          ...form, level: l 
                        })}
                       className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${form.level === l ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-border text-text-secondary hover:border-primary/30'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black 
                    text-text-secondary uppercase 
                    tracking-widest mb-3 block">
                    What's your department?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {departments.map(d => (
                      <button
                        key={d}
                        onClick={() => setForm({ 
                          ...form, department: d 
                        })}
                       className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all text-left ${form.department === d ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-border text-text-secondary hover:border-primary/30'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!form.level || !form.department}
                  className="w-full bg-primary text-white 
                    rounded-xl py-4 text-sm font-black 
                    uppercase tracking-widest 
                    hover:bg-primary/90 disabled:opacity-40 
                    transition-all flex items-center 
                    justify-center gap-2"
                >
                  Continue 
                  <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2 — Courses */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black 
                    text-text-primary">
                    Your courses this semester 📚
                  </h2>
                  <p className="text-sm text-text-secondary 
                    mt-1">
                    Add your course codes so we can find 
                    relevant past questions for you
                  </p>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={courseInput}
                    onChange={e => setCourseInput(
                      e.target.value.toUpperCase()
                    )}
                    onKeyDown={e => e.key === 'Enter' && 
                      addCourse(courseInput)}
                    placeholder="Type course code e.g BCH201"
                    className="flex-1 border border-border 
                      rounded-xl px-4 py-3 text-sm font-bold 
                      text-text-primary outline-none 
                      focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={() => addCourse(courseInput)}
                    disabled={!courseInput}
                    className="bg-primary text-white px-4 
                      rounded-xl font-black text-sm 
                      disabled:opacity-40 transition-all"
                  >
                    Add
                  </button>
                </div>

                {/* Added courses */}
                {form.courses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.courses.map(c => (
                      <div key={c} 
                        className="flex items-center gap-2 
                          bg-primary-light text-primary 
                          px-3 py-1.5 rounded-xl text-xs 
                          font-black">
                        {c}
                        <button 
                          onClick={() => removeCourse(c)}
                          className="text-primary/50 
                            hover:text-primary"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                <div>
                  <p className="text-[10px] font-black 
                    text-text-secondary uppercase 
                    tracking-widest mb-3">
                    Popular at Achievers
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCourses
                      .filter(c => !form.courses.includes(c))
                      .map(c => (
                      <button
                        key={c}
                        onClick={() => addCourse(c)}
                        className="border border-border 
                          text-text-secondary px-3 py-1.5 
                          rounded-xl text-xs font-black 
                          hover:border-primary/30 
                          hover:text-primary transition-all"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-border 
                      text-text-secondary rounded-xl py-4 
                      text-sm font-black uppercase 
                      tracking-widest hover:bg-bg 
                      transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-primary text-white 
                      rounded-xl py-4 text-sm font-black 
                      uppercase tracking-widest 
                      hover:bg-primary/90 transition-all 
                      flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Exam Dates */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black 
                    text-text-primary">
                    When are your exams? 📅
                  </h2>
                  <p className="text-sm text-text-secondary 
                    mt-1">
                    Add exam dates to get a personalized 
                    countdown and study plan
                  </p>
                </div>

                {/* Exam form */}
                <div className="bg-bg rounded-2xl p-4 
                  space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={examForm.course_code}
                      onChange={e => setExamForm({ 
                        ...examForm, 
                        course_code: e.target.value
                          .toUpperCase() 
                      })}
                      placeholder="Course code"
                      className="border border-border 
                        rounded-xl px-3 py-2.5 text-sm 
                        font-bold text-text-primary 
                        outline-none focus:ring-2 
                        focus:ring-primary/20 bg-white"
                    />
                    <input
                      value={examForm.course_name}
                      onChange={e => setExamForm({ 
                        ...examForm, 
                        course_name: e.target.value 
                      })}
                      placeholder="Course name"
                      className="border border-border 
                        rounded-xl px-3 py-2.5 text-sm 
                        font-bold text-text-primary 
                        outline-none focus:ring-2 
                        focus:ring-primary/20 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={examForm.exam_date}
                      onChange={e => setExamForm({ 
                        ...examForm, 
                        exam_date: e.target.value 
                      })}
                      min={new Date().toISOString()
                        .split('T')[0]}
                      className="border border-border 
                        rounded-xl px-3 py-2.5 text-sm 
                        font-bold text-text-primary 
                        outline-none focus:ring-2 
                        focus:ring-primary/20 bg-white"
                    />
                    <select
                      value={examForm.difficulty}
                      onChange={e => setExamForm({ 
                        ...examForm, 
                        difficulty: e.target.value 
                      })}
                      className="border border-border 
                        rounded-xl px-3 py-2.5 text-sm 
                        font-bold text-text-primary 
                        outline-none focus:ring-2 
                        focus:ring-primary/20 bg-white"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                  <button
                    onClick={addExam}
                    disabled={!examForm.course_code || 
                      !examForm.exam_date}
                    className="w-full bg-primary/10 
                      text-primary rounded-xl py-2.5 
                      text-sm font-black disabled:opacity-40 
                      transition-all"
                  >
                    + Add Exam
                  </button>
                </div>

                {/* Added exams */}
                {form.examDates.length > 0 && (
                  <div className="space-y-2">
                    {form.examDates.map((e, i) => (
                      <div key={i} 
                        className="flex items-center 
                          justify-between bg-success/5 
                          border border-success/20 
                          rounded-xl px-4 py-3">
                        <div className="flex items-center 
                          gap-3">
                          <Check className="h-4 w-4 
                            text-success" />
                          <span className="text-sm 
                            font-black text-text-primary">
                            {e.course_code}
                          </span>
                          <span className="text-xs 
                            text-text-secondary">
                            {new Date(e.exam_date)
                              .toLocaleDateString('en-NG', {
                                day: 'numeric',
                                month: 'short'
                              })}
                          </span>
                        </div>
                        <button
                          onClick={() => setForm(prev => ({
                            ...prev,
                            examDates: prev.examDates
                              .filter((_, idx) => idx !== i)
                          }))}
                          className="text-text-secondary 
                            hover:text-error text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border border-border 
                      text-text-secondary rounded-xl py-4 
                      text-sm font-black uppercase 
                      tracking-widest hover:bg-bg 
                      transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="flex-1 bg-primary text-white 
                      rounded-xl py-4 text-sm font-black 
                      uppercase tracking-widest 
                      hover:bg-primary/90 disabled:opacity-50 
                      transition-all flex items-center 
                      justify-center gap-2"
                  >
                    {loading 
                      ? 'Setting up...' 
                      : 'Go to Dashboard'
                    }
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-center text-xs 
                  text-text-secondary opacity-60">
                  You can skip this and add exams later 
                  in the planner
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}