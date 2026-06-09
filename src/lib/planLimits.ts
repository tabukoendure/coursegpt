import { supabase } from './supabase';

export type Plan = 'free' | 'pro' | 'premium';

export const PLAN_LIMITS: Record<Plan, { pdfSizeMB: number; dailyPdfUploads: number }> = {
  free:    { pdfSizeMB: 5,  dailyPdfUploads: 3  },
  pro:     { pdfSizeMB: 15, dailyPdfUploads: 10 },
  premium: { pdfSizeMB: 50, dailyPdfUploads: Infinity },
};

export const PLAN_LABELS: Record<Plan, string> = {
  free:    'Free',
  pro:     'Pro Student',
  premium: 'Premium',
};

export async function getUserPlan(userId: string): Promise<Plan> {
  const { data } = await supabase
    .from('profiles')
    .select('plan, is_pro, pro_expires_at')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return 'free';

  if (data.pro_expires_at && new Date(data.pro_expires_at) < new Date()) {
    await supabase
      .from('profiles')
      .update({ plan: 'free', is_pro: false })
      .eq('id', userId);
    return 'free';
  }

  return (data.plan as Plan) || 'free';
}

const PDF_USAGE_KEY = 'cgpt_pdf_usage';

function getTodayPdfCount(): number {
  try {
    const raw = localStorage.getItem(PDF_USAGE_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    return date === today ? (count as number) : 0;
  } catch {
    return 0;
  }
}

export function incrementPdfCount(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const count = getTodayPdfCount();
    localStorage.setItem(PDF_USAGE_KEY, JSON.stringify({ date: today, count: count + 1 }));
  } catch {}
}

export function getRemainingPdfUploads(plan: Plan): number {
  const limit = PLAN_LIMITS[plan].dailyPdfUploads;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - getTodayPdfCount());
}

export async function checkPdfUpload(file: File, userId: string): Promise<string | null> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > limits.pdfSizeMB) {
    const upgrade = plan === 'free' ? 'Pro (15MB) or Premium (50MB)' : 'Premium (50MB)';
    return `This PDF is ${fileSizeMB.toFixed(1)}MB. Your ${PLAN_LABELS[plan]} plan allows up to ${limits.pdfSizeMB}MB. Upgrade to ${upgrade} for larger files.`;
  }

  if (limits.dailyPdfUploads !== Infinity) {
    const todayCount = getTodayPdfCount();
    if (todayCount >= limits.dailyPdfUploads) {
      const upgrade = plan === 'free' ? 'Pro (10/day) or Premium (unlimited)' : 'Premium (unlimited)';
      return `You have used all ${limits.dailyPdfUploads} PDF uploads allowed today on the ${PLAN_LABELS[plan]} plan. Upgrade to ${upgrade}, or try again tomorrow.`;
    }
  }

  return null;
}
