import React from 'react';
import { supabase } from '../lib/supabase';
import { 
  Zap, Check, ArrowLeft, 
  Loader2, GraduationCap 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function ProWaitlist() {
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [joined, setJoined] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const prefill = async () => {
      const { data: { user } } = 
        await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (data) setName(data.full_name || '');
      }
    };
    prefill();
  }, []);

  const handleJoin = async () => {
    if (!email || !name) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await supabase.from('pro_waitlist').insert([{
        email,
        name,
        joined_at: new Date().toISOString(),
      }]);
      setJoined(true);
    } catch (err) {
      setError(
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const proFeatures = [
    'Unlimited AI messages per day',
    'Upload unlimited PDFs for AI chat',
    'Priority access to new past questions',
    'Advanced exam predictions',
    'Personalized weekly study reports',
    'Ad-free experience',
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-text-primary uppercase tracking-tight">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6">
            <Zap className="h-4 w-4" />
            Coming Soon
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight mb-4">
            CourseGPT Pro
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            Everything you need to not just pass — 
            but excel. Join the waitlist and be first 
            to know when Pro launches.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Features */}
          <div className="bg-white border border-border rounded-[2rem] p-8">
            <h2 className="text-xl font-black text-text-primary mb-2">
              What you get with Pro
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              For just ₦1,000/month
            </p>
            <div className="space-y-4">
              {proFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 bg-success/10 rounded-full flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Free vs Pro comparison */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div />
                <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                  Free
                </div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Pro
                </div>
                {[
                  ['AI messages/day', '30', 'Unlimited'],
                  ['PDF uploads', '1', 'Unlimited'],
                  ['Past questions', '✓', '✓ Priority'],
                  ['Study planner', '✓', '✓ Advanced'],
                ].map(([label, free, pro]) => (
                  <React.Fragment key={label}>
                    <div className="text-xs font-bold text-text-secondary text-left py-2 border-b border-border">
                      {label}
                    </div>
                    <div className="text-xs font-bold text-text-secondary py-2 border-b border-border">
                      {free}
                    </div>
                    <div className="text-xs font-black text-primary py-2 border-b border-border">
                      {pro}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Waitlist form */}
          <div className="bg-white border border-border rounded-[2rem] p-8">
            {!joined ? (
              <>
                <h2 className="text-xl font-black text-text-primary mb-2">
                  Join the waitlist
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                  Be first to know when Pro launches. 
                  Early birds get a special discount.
                </p>

                {error && (
                  <div className="bg-error/10 border border-error/20 text-error rounded-xl px-4 py-3 text-sm font-bold mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={loading}
                    className="w-full bg-primary text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Zap className="h-4 w-4" /> Join Waitlist</>
                    }
                  </button>
                  <p className="text-center text-xs text-text-secondary opacity-60">
                    No spam. We'll only email you when Pro launches.
                  </p>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-black text-text-primary mb-2">
                  You're on the list! 🎉
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  We'll notify you at{' '}
                  <span className="font-bold text-text-primary">
                    {email}
                  </span>{' '}
                  when Pro launches. Early birds get a special discount.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-primary/90 transition-all"
                >
                  Back to studying
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}