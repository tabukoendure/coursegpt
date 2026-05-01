import React from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, MessageSquare, TrendingUp, Download, Trash2, Shield, LogOut, GraduationCap, AlertCircle, Check, RefreshCw, Eye, BarChart2 } from 'lucide-react';
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
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this past question? This cannot be undone.')) return;
    try {
      await supabase.from('past_questions').delete().eq('id', id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSuccess('Past question deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to delete'); setTimeout(() => setError(''), 3000); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      await supabase.from('profiles').delete().eq('id', id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setSuccess('User deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to delete user'); setTimeout(() => setError(''), 3000); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  if (checking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!authorized) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'questions', label: 'Past Questions', icon: FileText },
  ];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Past Questions', value: stats.totalPastQuestions, icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { label: 'AI Sessions', value: stats.totalChatSessions, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
    { label: 'Total Downloads', value: stats.totalDownloads, icon: Download, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
          <p className="text-sm text-gray-500 mt-1">CourseGPT platform overview — visible only to you</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
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
        <div className="flex gap-2 border-b border-gray-200">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
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
                  { label: 'Total PDF downloads', value: stats.totalDownloads },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm font-bold text-gray-600">{item.label}</span>
                    <span className="text-sm font-black text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Most Downloaded Past Questions
              </h3>
              {questions.sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 5).map(q => (
                <div key={q.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black">{q.course_code}</div>
                    <span className="text-sm font-bold text-gray-700">{q.course_name || 'Untitled'} — {q.year}</span>
                  </div>
                  <span className="text-xs font-black text-gray-500">{q.download_count || 0} downloads</span>
                </div>
              ))}
              {questions.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No past questions uploaded yet</p>}
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
                    {['Name', 'Email', 'Level', 'Department', 'Joined', 'Actions'].map(h => (
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
                      <td className="px-6 py-4">
                        <span className="text-xs font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">{user.level || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.department || 'N/A'}</td>
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
                    {['Course', 'Year', 'Department', 'Downloads', 'Uploaded', 'Actions'].map(h => (
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
                  <p className="text-sm font-bold">No past questions uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}