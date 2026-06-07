import React from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Upload, Users, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function Leaderboard() {
  const [leaders, setLeaders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userUniversity, setUserUniversity] = React.useState('');

  React.useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('university').eq('id', user.id).maybeSingle();
        const uni = profile?.university || '';
        setUserUniversity(uni);
        fetchLeaders(uni);
      }
    };
    init();
  }, []);

  const fetchLeaders = async (university: string) => {
    try {
      let q = supabase.from('profiles').select('full_name, points, university, level, department').order('points', { ascending: false }).limit(20);
      if (university) q = q.eq('university', university);
      const { data } = await q;
      setLeaders((data || []).filter(u => (u.points || 0) > 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `#${idx + 1}`;
  };

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-64 bg-border rounded-lg" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-border rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" /> Leaderboard
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-medium flex items-center gap-1">
          <GraduationCap className="h-4 w-4" /> {userUniversity || 'Your University'} — Top Contributors
        </p>
      </header>

      {/* Top 3 podium */}
      {leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* 2nd place */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-border rounded-[2rem] p-5 text-center mt-8">
            <div className="text-3xl mb-2">🥈</div>
            <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 font-black text-lg mx-auto mb-2">
              {leaders[1]?.full_name?.[0] || '?'}
            </div>
            <div className="text-xs font-black text-text-primary truncate">{leaders[1]?.full_name?.split(' ')[0]}</div>
            <div className="text-[10px] text-text-secondary mt-0.5">{leaders[1]?.points} pts</div>
          </motion.div>

          {/* 1st place */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-primary rounded-[2rem] p-5 text-center shadow-xl shadow-primary/20">
            <div className="text-3xl mb-2">🥇</div>
            <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-xl mx-auto mb-2">
              {leaders[0]?.full_name?.[0] || '?'}
            </div>
            <div className="text-xs font-black text-white truncate">{leaders[0]?.full_name?.split(' ')[0]}</div>
            <div className="text-[10px] text-white/70 mt-0.5">{leaders[0]?.points} pts</div>
          </motion.div>

          {/* 3rd place */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white border border-border rounded-[2rem] p-5 text-center mt-8">
            <div className="text-3xl mb-2">🥉</div>
            <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-black text-lg mx-auto mb-2">
              {leaders[2]?.full_name?.[0] || '?'}
            </div>
            <div className="text-xs font-black text-text-primary truncate">{leaders[2]?.full_name?.split(' ')[0]}</div>
            <div className="text-[10px] text-text-secondary mt-0.5">{leaders[2]?.points} pts</div>
          </motion.div>
        </div>
      )}

      {/* Full list */}
      <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-black text-text-primary text-sm uppercase tracking-widest">Full Rankings</h3>
        </div>
        {leaders.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-12 w-12 mx-auto text-text-secondary opacity-20 mb-4" />
            <p className="font-black text-text-primary mb-1">No contributors yet</p>
            <p className="text-sm text-text-secondary">Be the first to upload past questions and top the board!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leaders.map((user, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-4 px-6 py-4 ${idx === 0 ? 'bg-primary/5' : 'hover:bg-bg'} transition-all`}>
                <div className={`w-8 text-center font-black text-sm ${idx < 3 ? 'text-xl' : 'text-text-secondary'}`}>
                  {getMedal(idx)}
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${idx === 0 ? 'bg-primary text-white' : 'bg-bg text-text-primary border border-border'}`}>
                  {user.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-text-primary text-sm truncate">{user.full_name}</div>
                  <div className="text-[10px] text-text-secondary">{user.level} • {user.department}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-primary text-sm">{user.points} pts</div>
                  <div className="text-[10px] text-text-secondary">₦{user.points} value</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-center">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest">
          Upload past questions (+25pts) • Refer friends (+50pts) • Withdraw at 500pts
        </p>
      </div>
    </div>
  );
}