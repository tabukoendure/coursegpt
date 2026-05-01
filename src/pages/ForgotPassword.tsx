import React from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Check, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center 
      justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
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

        <div className="bg-white border border-border 
          rounded-[2rem] p-8 shadow-sm">

          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-black 
                  text-text-primary">
                  Reset your password
                </h1>
                <p className="text-sm text-text-secondary 
                  mt-1">
                  Enter your email and we'll send you 
                  a reset link
                </p>
              </div>

              {error && (
                <div className="bg-error/10 border 
                  border-error/20 text-error rounded-xl 
                  px-4 py-3 text-sm font-bold mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black 
                    text-text-secondary uppercase 
                    tracking-widest mb-2 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 
                      top-1/2 -translate-y-1/2 h-4 w-4 
                      text-text-secondary" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && 
                        handleSubmit()}
                      placeholder="your@email.com"
                      className="w-full pl-12 pr-4 py-3 
                        border border-border rounded-xl 
                        text-sm font-bold text-text-primary 
                        outline-none focus:ring-2 
                        focus:ring-primary/20"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-primary text-white 
                    rounded-xl py-4 text-sm font-black 
                    uppercase tracking-widest 
                    hover:bg-primary/90 disabled:opacity-50 
                    transition-all shadow-lg 
                    shadow-primary/20"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="h-16 w-16 bg-success/10 
                rounded-full flex items-center justify-center 
                mx-auto mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-lg font-black 
                text-text-primary mb-2">
                Check your email
              </h2>
              <p className="text-sm text-text-secondary 
                mb-6 leading-relaxed">
                We sent a password reset link to{' '}
                <span className="font-bold 
                  text-text-primary">{email}</span>.
                Check your inbox and click the link.
              </p>
              <p className="text-xs text-text-secondary 
                opacity-60">
                Didn't receive it? Check your spam folder 
                or try again.
              </p>
            </motion.div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="flex items-center justify-center 
              gap-2 text-sm font-bold text-text-secondary 
              hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}