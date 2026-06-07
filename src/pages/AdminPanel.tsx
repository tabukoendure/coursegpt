import React from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, MessageSquare, TrendingUp, Download, Trash2, Shield, LogOut, GraduationCap, AlertCircle, Check, RefreshCw, Eye, BarChart2, CreditCard, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

const ADMIN_EMAIL = 'coursegpt79@gmail.com';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [stats, setStats] = React.useState({ totalUsers: 0, totalPastQuestions: 0, totalChatSessions: 0, totalDownloads: 0 });
  const [users, setUsers] = React.useState<any[]>([]);
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');
  const [payModal, setPayModal] = React.useState<{ open: boolean; withdrawal: any }>({ open: false, withdrawal: null });
  const [payAmount, setPayAmount] = React.useState('');
  const [payNote, setPayNote] = React.useState('');
  const [paying, setPaying] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== ADMIN_EMAIL) { navigate('/'); return; }
        setAuthorized(true);
        fetchAllData();
      } catch { navigate('/'); }
      finally { setChecking(false); }
    };
    checkAuth();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(profilesData || []);

      const { data: questionsData } = await supabase.from('past_questions').select('*').order('created_at', { ascending: false });
      setQuestions(questionsData || []);

      const { count: chatCount } = await supabase.from('chat_sessions').select('*', { count: 'exact', head: true });
      const totalDownloads = questionsData?.reduce((sum, q) => sum + (q.download_count || 0), 0) || 0;
      setStats({ totalUsers: profilesData?.length || 0, totalPastQuestions: questionsData?.length || 0, totalChatSessions: chatCount || 0, totalDownloads });

      const { data: wData } = await supabase
        .from('withdrawal_requests')
        .select('*, profiles(full_name, email, university)')
        .order('created_at', { ascending: false });
      setWithdrawals(wData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleConfirmPaid = async () => {
    if (!payModal.withdrawal || !payAmount) return;
    setPaying(true);
    try {
      const amountPaid = parseFloat(payAmount);
      const { error: err } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'paid',
          amount_paid: amountPaid,
          admin_note: payNote || `₦${amountPaid} paid`,
          paid_at: new Date().toISOString(),
        })
        .eq('id', payModal.withdrawal.id);

      if (err) throw err;

      // Deduct points from user (amount paid = points deducted since 1:1)
      await supabase
        .from('profiles')
        .update({ points: Math.max(0, (payModal.withdrawal.profiles?.points || 0) - payModal.withdrawal.amount_requested) })
        .eq('id', payModal.withdrawal.user_id);

      // Log transaction
      await supabase.from('transactions').insert([{
        user_id: payModal.withdrawal.user_id,
        type: 'withdrawal',
        points: -payModal.withdrawal.amount_requested,
        description: `Withdrawal paid — ₦${amountPaid}${payNote ? '. ' + payNote : ''}`,
      }]);

      setSuccess(`Marked as paid — ₦${amountPaid} to ${payModal.withdrawal.profiles?.full_name}`);
      setTimeout(() => setSuccess(''), 4000);
      setPayModal({ open: false, withdrawal: null });
      setPayAmount('');
      setPayNote('');
      fetchAllData();
    } catch (e: any) {
      setError(e.message || 'Failed to confirm payment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setPaying(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this past question?')) return;
    try {
      await supabase.from('past_questions').delete().eq('id', id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSuccess('Deleted'); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed'); setTimeout(() => setError(''), 3000); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await supabase.from('profiles').delete().eq('id', id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccess('User deleted'); setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed'); setTimeout(() => setError(''), 3000); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  if (checking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!authorized) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'withdrawals', label: `Withdrawals ${pendingWithdrawals.length > 0 ? `(${pendingWithdrawals.length})` : ''}`, icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'questions', label: 'Past Questions', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Pay Modal */}
      {payModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-gray-900 text-lg mb-1">Confirm Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              {payModal.withdrawal?.profiles?.full_name} requested ₦{payModal.withdrawal?.amount_requested}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Amount You Are Paying (₦)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder={`Max: ₦${payModal.withdrawal?.amount_requested}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Reason / Note (shown to user)</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="e.g. Duplicate uploads detected, partial payment"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-xs font-bold text-gray-500">
                Phone: {payModal.withdrawal?.phone} • Network: {payModal.withdrawal?.network}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setPayModal({ open: false, withdrawal: null }); setPayAmount(''); setPayNote(''); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-black text-gray-500">
                Cancel
              </button>
              <button onClick={handleConfirmPaid} disabled={!payAmount || paying}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-black disabled:opacity-50">
                {paying ? 'Processing...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-black text-gray-900 uppercase tracking-tight">COURSE<span className="text-primary">GPT</span></span>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAllData} disabled={loading} className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2">
            <Check className="h-4 w-4" /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </motion.div>
        )}

        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">CourseGPT platform overview</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Past Questions', value: stats.totalPastQuestions, icon: FileText, color: 'text-purple-600 bg-purple-50' },
            { label: 'AI Sessions', value: stats.totalChatSessions, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
            { label: 'Pending Payouts', value: pendingWithdrawals.length, icon: CreditCard, color: 'text-orange-600 bg-orange-50' },
          ].map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className={`p-2 rounded-xl w-fit mb-3 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-black text-gray-900">{card.value}</div>
              <div className="text-xs font-bold text-gray-500 mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-all -mb-px whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Platform Summary
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Total registered users', value: stats.totalUsers },
                  { label: 'Past questions uploaded', value: stats.totalPastQuestions },
                  { label: 'Total AI conversations', value: stats.totalChatSessions },
                  { label: 'Pending withdrawal requests', value: pendingWithdrawals.length },
{ label: 'Total pending payout amount', value: `₦${pendingWithdrawals.reduce((sum, w) => sum + (w.amount_requested || 0), 0)}` },
{ label: 'Total points owed to all users', value: `${users.reduce((sum, u) => sum + (u.points || 0), 0)} pts = ₦${users.reduce((sum, u) => sum + (u.points || 0), 0)}` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-bold text-gray-600">{item.label}</span>
                    <span className="text-sm font-black text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            {pendingWithdrawals.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm font-bold text-orange-700">
                ⚠️ {pendingWithdrawals.length} pending withdrawal{pendingWithdrawals.length > 1 ? 's' : ''} — total ₦{pendingWithdrawals.reduce((sum, w) => sum + (w.amount_requested || 0), 0)}
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-gray-900">All Withdrawal Requests ({withdrawals.length})</h3>
              </div>
              {withdrawals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CreditCard className="h-12 w-12 mx-auto opacity-20 mb-3" />
                  <p className="text-sm font-bold">No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {withdrawals.map(w => (
                    <div key={w.id} className={`p-6 flex items-center justify-between gap-4 ${w.status === 'pending' ? 'bg-orange-50/50' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-gray-900">{w.profiles?.full_name || 'Unknown'}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${w.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            {w.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <p>{w.profiles?.email} • {w.profiles?.university}</p>
                          <p>📱 {w.phone} • {w.network}</p>
                          <p>Requested: ₦{w.amount_requested} • {new Date(w.created_at).toLocaleDateString('en-NG')}</p>
                          {w.status === 'paid' && (
                            <p className="text-green-600 font-bold">✓ Paid ₦{w.amount_paid} on {new Date(w.paid_at).toLocaleDateString('en-NG')}{w.admin_note ? ` — ${w.admin_note}` : ''}</p>
                          )}
                        </div>
                      </div>
                      {w.status === 'pending' && (
                        <button
                          onClick={() => { setPayModal({ open: true, withdrawal: w }); setPayAmount(String(w.amount_requested)); }}
                          className="px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all whitespace-nowrap"
                        >
                          Confirm Paid
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-black text-gray-900">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Email', 'University', 'Level', 'Points', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-black shrink-0">
                            {user.full_name?.[0] || '?'}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{user.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{user.university || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">{user.level || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-green-600">{user.points || 0} pts</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString('en-NG') : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="h-12 w-12 mx-auto opacity-20 mb-3" />
                  <p className="text-sm font-bold">No users yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Past Questions Tab */}
        {activeTab === 'questions' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-black text-gray-900">All Past Questions ({questions.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Course', 'University', 'Year', 'Department', 'Downloads', 'Uploaded', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questions.map(q => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-primary">{q.course_code}</div>
                        <div className="text-xs text-gray-500">{q.course_name}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{q.university || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">{q.year}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{q.department || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900">{q.download_count || 0}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{q.created_at ? new Date(q.created_at).toLocaleDateString('en-NG') : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {q.file_url && (
                            <a href={q.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                              <Eye className="h-4 w-4" />
                            </a>
                          )}
                          <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto opacity-20 mb-3" />
                  <p className="text-sm font-bold">No past questions yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}