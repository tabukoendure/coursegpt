import React from 'react';
import { supabase } from '../lib/supabase';
import { Zap, Check, ArrowLeft, Loader2, GraduationCap, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const PRO_PLAN = import.meta.env.VITE_PAYSTACK_PRO_PLAN;
const PREMIUM_PLAN = import.meta.env.VITE_PAYSTACK_PREMIUM_PLAN;

export default function ProWaitlist() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [subscribing, setSubscribing] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        setProfile(data);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSubscribe = async (planType: 'pro' | 'premium') => {
    if (!user) { navigate('/login'); return; }
    setSubscribing(planType);
    setError('');

    const planCode = planType === 'pro' ? PRO_PLAN : PREMIUM_PLAN;
    const amount = planType === 'pro' ? 150000 : 250000;

try {
  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop || !PaystackPop.setup) {
    setError('Payment system not ready. Please refresh the page and try again.');
    setSubscribing(null);
    return;
  }

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: user.email,
    amount: planType === 'pro' ? 150000 : 250000,
    plan: planType === 'pro' ? PRO_PLAN : PREMIUM_PLAN,
    currency: 'NGN',
    ref: `coursegpt_${planType}_${user.id}_${Date.now()}`,
    callback: async (response: any) => {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await supabase.from('profiles').update({
          plan: planType,
          is_pro: true,
          pro_expires_at: expiresAt.toISOString(),
          paystack_subscription_code: response.reference,
        }).eq('id', user.id);
        await supabase.from('transactions').insert([{
          user_id: user.id,
          type: 'subscription',
          points: 0,
          description: `${planType === 'pro' ? 'Pro Student' : 'Premium'} subscription — ₦${planType === 'pro' ? '1,500' : '2,500'}/month`,
        }]);
        setProfile((prev: any) => ({ ...prev, plan: planType, is_pro: true }));
        setSuccess(`🎉 You are now on the ${planType === 'pro' ? 'Pro Student' : 'Premium'} plan!`);
        setTimeout(() => setSuccess(''), 5000);
      } catch (err) {
        console.error('Profile update error:', err);
      }
      setSubscribing(null);
    },
    onClose: () => {
      setSubscribing(null);
    },
  });

  handler.openIframe();
} catch (err: any) {
  console.error('Paystack setup error:', err?.message, err);
  setError(`Payment error: ${err?.message || 'Unknown error'}`);
  setSubscribing(null);
}
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Cancel your subscription? You will lose Pro access at the end of your billing period.')) return;
    try {
      await supabase.from('profiles').update({
        plan: 'free',
        is_pro: false,
        pro_expires_at: null,
        paystack_subscription_code: null,
      }).eq('id', user.id);
      setProfile((prev: any) => ({ ...prev, plan: 'free', is_pro: false }));
      setSuccess('Subscription cancelled. You have been moved to the Free plan.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to cancel. Please contact support.');
    }
  };

  const currentPlan = profile?.plan || 'free';

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₦0',
      period: 'forever',
      color: 'border-border',
      headerColor: 'bg-bg',
      features: [
        '10 AI messages per day',
        '3 PDF uploads per day (tools)',
        '5MB PDF size limit',
        'Unlimited past question uploads',
        'Basic quiz & flashcards',
        'Study planner',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Student',
      price: '₦1,500',
      period: '/month',
      color: 'border-primary',
      headerColor: 'bg-primary',
      badge: 'Most Popular',
      features: [
        '30 AI messages per day',
        '10 PDF uploads per day (tools)',
        '15MB PDF size limit',
        'Unlimited past question uploads',
        'Extended quiz & flashcards',
        'Priority AI responses',
        'Study planner + AI study tips',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₦2,500',
      period: '/month',
      color: 'border-yellow-400',
      headerColor: 'bg-gradient-to-br from-yellow-400 to-orange-500',
      badge: 'Best Value',
      features: [
        'Unlimited AI messages',
        'Unlimited PDF uploads (tools)',
        '50MB PDF size limit',
        'Unlimited past question uploads',
        'Full quiz & flashcards',
        'Fastest AI priority',
        'All features, no restrictions',
      ],
    },
  ];

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-text-primary uppercase tracking-tight">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </Link>
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-6">
            <Zap className="h-4 w-4" /> Upgrade Your Plan
          </div>
          <h1 className="text-4xl font-black text-text-primary tracking-tight mb-4">
            Study smarter with Pro
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            More AI messages, bigger PDFs, unlimited tools. Cancel anytime.
          </p>
        </div>

        {/* Current plan banner */}
        {currentPlan !== 'free' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="font-black text-primary text-sm">
                ✓ You are on the {currentPlan === 'pro' ? 'Pro Student' : 'Premium'} plan
              </p>
              {profile?.pro_expires_at && (
                <p className="text-xs text-text-secondary mt-0.5">
                  Renews on {new Date(profile.pro_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <button onClick={handleCancelSubscription} className="text-xs font-black text-error hover:underline uppercase tracking-widest">
              Cancel Plan
            </button>
          </motion.div>
        )}

        {/* Alerts */}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-success/10 border border-success/20 text-success rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 mb-6">
            <Check className="h-4 w-4" /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-error/10 border border-error/20 text-error rounded-2xl px-4 py-3 text-sm font-bold mb-6">
            {error}
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-[2rem] border-2 overflow-hidden transition-all ${plan.color} ${currentPlan === plan.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>

              {/* Plan header */}
              <div className={`${plan.headerColor} p-6`}>
                {plan.badge && (
                  <span className="inline-block bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                    {plan.badge}
                  </span>
                )}
                <h2 className={`text-xl font-black mb-1 ${plan.id === 'free' ? 'text-text-primary' : 'text-white'}`}>
                  {plan.name}
                </h2>
                <div className={`flex items-baseline gap-1 ${plan.id === 'free' ? 'text-text-primary' : 'text-white'}`}>
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className={`text-sm font-bold ${plan.id === 'free' ? 'text-text-secondary' : 'text-white/70'}`}>{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-5 w-5 bg-success/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-sm font-bold text-text-primary">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="px-6 pb-6">
                {currentPlan === plan.id ? (
                  <div className="w-full py-3 bg-success/10 text-success font-black text-xs uppercase tracking-widest rounded-2xl text-center">
                    ✓ Current Plan
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="w-full py-3 bg-bg border border-border text-text-secondary font-black text-xs uppercase tracking-widest rounded-2xl text-center">
                    Free Forever
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id as 'pro' | 'premium')}
                    disabled={subscribing !== null}
                    className={`w-full py-3 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${plan.id === 'pro' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:opacity-90 shadow-yellow-400/20'}`}
                  >
                    {subscribing === plan.id
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                      : <><Zap className="h-4 w-4" /> Subscribe Now</>
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-text-secondary font-medium">
            Payments are processed securely by Paystack. Cancel anytime from this page.
          </p>
          <p className="text-xs text-text-secondary font-medium">
            Your plan renews automatically every 30 days. You will be notified before renewal.
          </p>
        </div>
      </div>
    </div>
  );
}