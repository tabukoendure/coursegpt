import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, Mail, Lock, User, 
  AlertCircle, Loader2, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const referralCode = new URLSearchParams(window.location.search).get('ref') || '';
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    password: '',
    level: '100 Level',
    department: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showVerify, setShowVerify] = React.useState(false);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate('/dashboard');
    };
    checkSession();
  }, []);

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
  .from('profiles')
  .insert([{
    id: authData.user.id,
    full_name: formData.fullName,
    email: formData.email,
    level: formData.level,
    department: formData.department,
        referred_by: referralCode || null,
  }]);

        if (profileError) console.error('Profile error:', profileError);
        navigate('/onboarding');
      }
    } catch (err: any) {
      if (err.message.includes('already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showVerify) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-border shadow-sm w-full max-w-md text-center"
        >
          <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-text-primary mb-3 tracking-tight">Check your email</h1>
          <p className="text-text-secondary font-medium mb-2">We sent a verification link to</p>
          <p className="text-primary font-black mb-6">{formData.email}</p>
          <p className="text-sm text-text-secondary font-medium mb-8">
            Click the link in the email to verify your account, then come back to log in.
          </p>
          <Link
            to="/login"
            className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center uppercase tracking-widest text-sm"
          >
            Go to Login
          </Link>
          <p className="mt-4 text-xs text-text-secondary opacity-60">Didn't get the email? Check your spam folder.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <span className="text-3xl font-black text-text-primary tracking-tight uppercase">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-border shadow-sm w-full max-w-lg"
      >
        <h1 className="text-3xl font-black text-text-primary mb-2 tracking-tight">Create your account</h1>
        <p className="text-text-secondary mb-8 font-medium">
          Join thousands of Nigerian university students
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 text-sm font-bold"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleRegister}
          disabled={googleLoading || loading}
          className="w-full py-4 bg-white border-2 border-border rounded-2xl font-black text-sm text-text-primary hover:border-primary hover:bg-bg transition-all flex items-center justify-center gap-3 mb-6 disabled:opacity-70"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-grow border-t border-border" />
          <span className="px-4 text-xs text-text-secondary font-black uppercase tracking-widest">
            or register with email
          </span>
          <div className="flex-grow border-t border-border" />
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-widest">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Chioma Adebayo"
                className="w-full pl-12 pr-4 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@email.com"
                className="w-full pl-12 pr-4 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full pl-12 pr-12 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-text-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-widest">Level</label>
              <select
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-text-primary"
              >
                {['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'].map(l => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-text-secondary mb-2 uppercase tracking-widest">Department</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Nursing Science"
                className="w-full px-4 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-text-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-70 uppercase tracking-widest text-sm mt-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-text-secondary font-medium text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-black hover:underline">Log in</Link>
        </p>
      </motion.div>

      <p className="mt-8 text-xs text-text-secondary opacity-40 font-bold uppercase tracking-widest">
Built for Nigerian university students
      </p>
    </div>
  );
}