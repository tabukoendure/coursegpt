import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, Mail, Lock, User, 
  AlertCircle, Loader2, Eye, EyeOff,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    password: '',
    level: '100 Level',
    department: '',
  });
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!formData.department) {
      setError('Please select your department');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = 
        await supabase.auth.signUp({
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
            university: 'Achievers University',
          }]);

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        // Always redirect to onboarding after register
        navigate('/onboarding');
      }
    } catch (err: any) {
      if (err.message.includes('already registered')) {
        setError(
          'This email is already registered. ' +
          'Please log in instead.'
        );
      } else {
        setError(err.message || 'Something went wrong');
      }
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
          shadow-sm w-full max-w-lg"
      >
        <h1 className="text-3xl font-black 
          text-text-primary mb-2 tracking-tight">
          Create your account
        </h1>
        <p className="text-text-secondary mb-8 
          font-medium">
          Join the smartest students at 
          Achievers University
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border 
              border-red-100 rounded-2xl flex 
              items-start space-x-3 text-red-600 
              text-sm font-bold"
          >
            <AlertCircle className="h-5 w-5 
              shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleRegister} 
          className="space-y-5">

          {/* Full Name */}
          <div>
            <label className="block text-[10px] 
              font-black text-text-secondary mb-2 
              uppercase tracking-widest">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 
                top-1/2 -translate-y-1/2 h-5 w-5 
                text-text-secondary" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ 
                  ...formData, 
                  fullName: e.target.value 
                })}
                placeholder="Chioma Adebayo"
                className="w-full pl-12 pr-4 py-4 
                  bg-bg border border-border 
                  rounded-2xl focus:outline-none 
                  focus:ring-4 focus:ring-primary/10 
                  focus:border-primary transition-all 
                  font-bold text-text-primary"
              />
            </div>
          </div>

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
                value={formData.email}
                onChange={e => setFormData({ 
                  ...formData, 
                  email: e.target.value 
                })}
                placeholder="you@email.com"
                className="w-full pl-12 pr-4 py-4 
                  bg-bg border border-border 
                  rounded-2xl focus:outline-none 
                  focus:ring-4 focus:ring-primary/10 
                  focus:border-primary transition-all 
                  font-bold text-text-primary"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] 
              font-black text-text-secondary mb-2 
              uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 
                top-1/2 -translate-y-1/2 h-5 w-5 
                text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={e => setFormData({ 
                  ...formData, 
                  password: e.target.value 
                })}
                placeholder="Min. 6 characters"
                className="w-full pl-12 pr-12 py-4 
                  bg-bg border border-border 
                  rounded-2xl focus:outline-none 
                  focus:ring-4 focus:ring-primary/10 
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

          {/* Level and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] 
                font-black text-text-secondary mb-2 
                uppercase tracking-widest">
                Level
              </label>
              <div className="relative">
                <select
                  value={formData.level}
                  onChange={e => setFormData({ 
                    ...formData, 
                    level: e.target.value 
                  })}
                  className="w-full px-4 py-4 bg-bg 
                    border border-border rounded-2xl 
                    focus:outline-none focus:ring-4 
                    focus:ring-primary/10 
                    focus:border-primary transition-all 
                    font-bold text-text-primary 
                    appearance-none"
                >
                  {['100 Level', '200 Level', 
                    '300 Level', '400 Level', 
                    '500 Level'].map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 
                  top-1/2 -translate-y-1/2 h-4 w-4 
                  text-text-secondary pointer-events-none" 
                />
              </div>
            </div>

<div>
  <label className="block text-[10px] 
    font-black text-text-secondary mb-2 
    uppercase tracking-widest">
    Department
  </label>
  <input
    type="text"
    required
    value={formData.department}
    onChange={e => setFormData({ 
      ...formData, 
      department: e.target.value 
    })}
    placeholder="e.g. Nursing Science"
    className="w-full px-4 py-4 bg-bg 
      border border-border rounded-2xl 
      focus:outline-none focus:ring-4 
      focus:ring-primary/10 
      focus:border-primary transition-all 
      font-bold text-text-primary"
  />
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
              text-sm mt-2"
          >
            {loading
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : 'Create account'
            }
          </button>
        </form>

        <p className="mt-8 text-center text-text-secondary 
          font-medium text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary font-black 
              hover:underline"
          >
            Log in
          </Link>
        </p>
      </motion.div>

      <p className="mt-8 text-xs text-text-secondary 
        opacity-40 font-bold uppercase tracking-widest">
        Built for Achievers University, Owo
      </p>
    </div>
  );
}