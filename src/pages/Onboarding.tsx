import React from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight, Loader2 } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [form, setForm] = React.useState({
    university: '',
    level: '',
    department: '',
  });

  React.useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/login');
      setChecking(false);
    };
    check();
  }, []);

  const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'];

  const handleFinish = async () => {
    if (!form.university || !form.level || !form.department) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email,
        email: user.email,
        university: form.university,
        level: form.level,
        department: form.department,
      }, { onConflict: 'id' });

      if (error) {
        alert('Failed to save profile: ' + error.message);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-text-primary tracking-tight uppercase">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </div>

        <div className="bg-white border border-border rounded-[2rem] p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-text-primary">Welcome to CourseGPT! 🎓</h2>
            <p className="text-sm text-text-secondary mt-1">Just a few details to personalize your experience</p>
          </div>

          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">Your University</label>
            <input
              type="text"
              value={form.university}
              onChange={e => setForm({ ...form, university: e.target.value })}
              placeholder="e.g. University of Lagos, OAU, UNIBEN..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">What level are you?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {levels.map(l => (
                <button key={l} onClick={() => setForm({ ...form, level: l })}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${form.level === l ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">What's your department?</label>
            <input
              type="text"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Nursing Science, Engineering, Law..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            onClick={handleFinish}
            disabled={!form.university || !form.level || !form.department || loading}
            className="w-full bg-primary text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Go to Dashboard <ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}