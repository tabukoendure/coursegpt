import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, Mail, Lock, 
  AlertCircle, Loader2, Eye, EyeOff 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = 
    React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = 
    React.useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = 
        await supabase.auth.getSession();
      if (session) navigate('/dashboard');
    };
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw error;

if (!data.user?.email_confirmed_at) {
  setError('Please verify your email first. Check your inbox for the verification link.');
  await supabase.auth.signOut();
  return;
}

navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Wrong email or password. Please try again.'
          : err.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col 
      items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link to="/" className="flex items-center 
          space-x-2">
          <div className="p-2 bg-primary rounded-xl 
            shadow-lg shadow-primary/20">
            <GraduationCap className="h-8 w-8 
              text-white" />
          </div>
          <span className="text-3xl font-black 
            text-text-primary tracking-tight uppercase">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 md:p-10 
          rounded-[2.5rem] border border-border 
          shadow-sm w-full max-w-md"
      >
        <h1 className="text-3xl font-black 
          text-text-primary mb-2 tracking-tight">
          Welcome back
        </h1>
        <p className="text-text-secondary mb-8 
          font-medium">
          Ready to ace your next exam?
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border 
              border-red-100 rounded-2xl flex items-start 
              space-x-3 text-red-600 text-sm font-bold"
          >
            <AlertCircle className="h-5 w-5 shrink-0 
              mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[10px] 
              font-black text-text-secondary mb-2 
              uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 
                top-1/2 -translate-y-1/2 h-5 w-5 
                text-text-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-12 pr-4 py-4 bg-bg 
                  border border-border rounded-2xl 
                  focus:outline-none focus:ring-4 
                  focus:ring-primary/10 
                  focus:border-primary transition-all 
                  font-bold text-text-primary"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-[10px] font-black 
                text-text-secondary uppercase 
                tracking-widest">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-primary 
                  hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 
                top-1/2 -translate-y-1/2 h-5 w-5 
                text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-bg 
                  border border-border rounded-2xl 
                  focus:outline-none focus:ring-4 
                  focus:ring-primary/10 
                  focus:border-primary transition-all 
                  font-bold text-text-primary"
              />
              <button
                type="button"
                onClick={() => 
                  setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 
                  -translate-y-1/2 text-text-secondary 
                  hover:text-primary transition-colors"
              >
                {showPassword
                  ? <EyeOff className="h-5 w-5" />
                  : <Eye className="h-5 w-5" />
                }
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white 
              font-black rounded-2xl hover:bg-primary/90 
              transition-all shadow-lg shadow-primary/20 
              flex items-center justify-center 
              disabled:opacity-70 uppercase tracking-widest 
              text-sm"
          >
            {loading
              ? <Loader2 className="h-5 w-5 
                  animate-spin" />
              : 'Log in'
            }
          </button>
        </form>

        <div className="mt-8 flex items-center mb-8">
          <div className="flex-grow border-t 
            border-border" />
          <span className="px-4 text-xs 
            text-text-secondary font-black uppercase 
            tracking-widest">
            or
          </span>
          <div className="flex-grow border-t 
            border-border" />
        </div>

        <p className="text-center text-text-secondary 
          font-medium text-sm">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary font-black 
              hover:underline"
          >
            Register free
          </Link>
        </p>
      </motion.div>

      {/* Footer */}
      <p className="mt-8 text-xs text-text-secondary 
        opacity-40 font-bold uppercase tracking-widest">
        Built for Achievers University, Owo
      </p>
    </div>
  );
}