import React from 'react';
import { supabase } from '../lib/supabase';
import { 
  Lock, Bell, Shield, LogOut, 
  Check, Eye, EyeOff, Trash2,
  ChevronRight, GraduationCap, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const NIGERIAN_UNIVERSITIES = [
  "Abubakar Tafawa Balewa University, Bauchi",
  "Ahmadu Bello University, Zaria",
  "Bayero University, Kano",
  "Federal University of Agriculture, Abeokuta",
  "Federal University of Agriculture, Makurdi",
  "Federal University of Agriculture, Umudike",
  "Federal University of Petroleum Resources, Effurun",
  "Federal University of Technology, Akure",
  "Federal University of Technology, Minna",
  "Federal University of Technology, Owerri",
  "Federal University, Birnin Kebbi",
  "Federal University, Dutse",
  "Federal University, Dutsin-Ma",
  "Federal University, Gashua",
  "Federal University, Gusau",
  "Federal University, Kashere",
  "Federal University, Lafia",
  "Federal University, Lokoja",
  "Federal University, Ndufu-Alike",
  "Federal University, Otuoke",
  "Federal University, Oye-Ekiti",
  "Federal University, Wukari",
  "Michael Okpara University of Agriculture, Umudike",
  "Modibbo Adama University of Technology, Yola",
  "National Open University of Nigeria, Lagos",
  "Nigerian Defence Academy, Kaduna",
  "Nnamdi Azikiwe University, Awka",
  "Obafemi Awolowo University, Ile-Ife",
  "University of Abuja",
  "University of Benin",
  "University of Calabar",
  "University of Ibadan",
  "University of Ilorin",
  "University of Jos",
  "University of Lagos",
  "University of Maiduguri",
  "University of Nigeria, Nsukka",
  "University of Port Harcourt",
  "University of Uyo",
  "Usmanu Danfodiyo University, Sokoto",
  "Abia State University, Uturu",
  "Adamawa State University, Mubi",
  "Adekunle Ajasin University, Akungba-Akoko",
  "Akwa Ibom State University",
  "Ambrose Alli University, Ekpoma",
  "Anambra State University",
  "Bauchi State University, Gadau",
  "Benue State University, Makurdi",
  "Cross River State University of Technology",
  "Delta State University, Abraka",
  "Ebonyi State University",
  "Ekiti State University",
  "Enugu State University of Science and Technology",
  "Gombe State University",
  "Ibrahim Badamasi Babangida University, Lapai",
  "Imo State University, Owerri",
  "Kaduna State University",
  "Kano University of Science and Technology, Wudil",
  "Kebbi State University of Science and Technology",
  "Kogi State University, Anyigba",
  "Kwara State University, Malete",
  "Ladoke Akintola University of Technology, Ogbomoso",
  "Lagos State University",
  "Nasarawa State University, Keffi",
  "Niger Delta University, Wilberforce Island",
  "Niger State University, Minna",
  "Olabisi Onabanjo University, Ago-Iwoye",
  "Osun State University",
  "Plateau State University, Bokkos",
  "Rivers State University",
  "Sokoto State University",
  "Tai Solarin University of Education, Ijebu-Ode",
  "Taraba State University, Jalingo",
  "Umaru Musa Yaradua University, Katsina",
  "Yobe State University, Damaturu",
  "Achievers University, Owo",
  "Adeleke University, Ede",
  "Afe Babalola University, Ado-Ekiti",
  "African University of Science and Technology, Abuja",
  "Ajayi Crowther University, Oyo",
  "Al-Hikmah University, Ilorin",
  "Al-Qalam University, Katsina",
  "American University of Nigeria, Yola",
  "Augustine University, Ilara",
  "Babcock University, Ilishan-Remo",
  "Baze University, Abuja",
  "Bells University of Technology, Ota",
  "Benson Idahosa University, Benin City",
  "Bingham University, Karu",
  "Bowen University, Iwo",
  "Caleb University, Lagos",
  "Caritas University, Enugu",
  "Chrisland University, Abeokuta",
  "Christopher University, Mowe",
  "Coal City University, Enugu",
  "Covenant University, Ota",
  "Crawford University, Igbesa",
  "Crescent University, Abeokuta",
  "Dominican University, Ibadan",
  "Edwin Clark University, Kiagbodo",
  "Elizade University, Ilara-Mokin",
  "Evangel University, Akaeze",
  "Fountain University, Osogbo",
  "Godfrey Okoye University, Enugu",
  "Gregory University, Uturu",
  "Hallmark University, Ijebu-Itele",
  "Hezekiah University, Umudi",
  "Igbinedion University, Okada",
  "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "Kings University, Ode-Omu",
  "Kwararafa University, Wukari",
  "Landmark University, Omu-Aran",
  "Lead City University, Ibadan",
  "Legacy University, Okija",
  "Madonna University, Okija",
  "McPherson University, Seriki Sotayo",
  "Mountain Top University, Ibafo",
  "Novena University, Ogume",
  "Oduduwa University, Ipetumodu",
  "Pan-Atlantic University, Lagos",
  "Paul University, Awka",
  "Redeemer's University, Ede",
  "Renaissance University, Enugu",
  "Rhema University, Obeama-Asa",
  "Ritman University, Ikot Ekpene",
  "Salem University, Lokoja",
  "Samuel Adegboyega University, Ogwa",
  "Skyline University, Kano",
  "Southwestern University, Oku-Owa",
  "Spiritan University, Nneochi",
  "Summit University, Offa",
  "Tansian University, Umunya",
  "Trinity University, Lagos",
  "University of Mkar, Mkar",
  "Veritas University, Abuja",
  "Western Delta University, Oghara",
  "Wellspring University, Evbuobanosa",
  "Wesley University, Ondo",
  "Yusuf Maitama Sule University, Kano",
];

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [notifications, setNotifications] = React.useState({
    newQuestions: true,
    examReminders: true,
    aiTips: false,
  });
  const [passwordForm, setPasswordForm] = React.useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [university, setUniversity] = React.useState('');
  const [uniSearch, setUniSearch] = React.useState('');
  const [showUniDropdown, setShowUniDropdown] = React.useState(false);
  const [savingUni, setSavingUni] = React.useState(false);

  const filteredUniversities = NIGERIAN_UNIVERSITIES.filter(u =>
    u.toLowerCase().includes(uniSearch.toLowerCase())
  ).slice(0, 8);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('university').eq('id', user.id).maybeSingle();
      if (data?.university) setUniversity(data.university);
    };
    fetchProfile();
  }, []);

  const showSuccess = (msg: string) => { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); };
  const showError = (msg: string) => { setError(msg); setSuccess(''); setTimeout(() => setError(''), 4000); };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) { showError('Please fill in all fields'); return; }
    if (passwordForm.newPassword.length < 6) { showError('Password must be at least 6 characters'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      showSuccess('Password updated successfully');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUniversity = async () => {
    if (!university) { showError('Please select a university'); return; }
    setSavingUni(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('profiles').update({ university }).eq('id', user.id);
      if (error) throw error;
      showSuccess('University updated successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to update university');
    } finally {
      setSavingUni(false);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirm) return;
    showError('To delete your account please contact support@mycoursegpt.com');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your account preferences</p>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/20 text-success rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2">
          <Check className="h-4 w-4" /> {success}
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-error/10 border border-error/20 text-error rounded-2xl px-4 py-3 text-sm font-bold">
          {error}
        </motion.div>
      )}

      {/* University */}
      <div className="bg-white border border-border rounded-[2rem] p-8">
        <h3 className="font-black text-text-primary flex items-center gap-2 mb-6">
          <GraduationCap className="h-4 w-4 text-primary" /> Change University
        </h3>
        <div className="space-y-4">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                value={uniSearch || university}
                onChange={e => { setUniSearch(e.target.value); setUniversity(''); setShowUniDropdown(true); }}
                onFocus={() => setShowUniDropdown(true)}
                placeholder="Search your university..."
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all ${university ? 'border-primary bg-primary/5' : 'border-border'}`}
              />
            </div>
            {university && (
              <div className="mt-2 flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl">
                <span className="text-sm font-black text-primary flex-1">{university}</span>
                <button onClick={() => { setUniversity(''); setUniSearch(''); }} className="text-primary/50 hover:text-error text-lg leading-none">×</button>
              </div>
            )}
            {showUniDropdown && uniSearch.length > 0 && !university && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-2xl shadow-xl overflow-hidden">
                {filteredUniversities.length > 0 ? filteredUniversities.map(uni => (
                  <button key={uni} onClick={() => { setUniversity(uni); setUniSearch(''); setShowUniDropdown(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-bold text-text-primary hover:bg-primary/5 hover:text-primary transition-all border-b border-border/50 last:border-0">
                    {uni}
                  </button>
                )) : (
                  <div className="px-4 py-3 text-sm text-text-secondary font-medium">No university found.</div>
                )}
              </div>
            )}
          </div>
          <button onClick={handleSaveUniversity} disabled={savingUni || !university}
            className="w-full bg-primary text-white rounded-xl py-3 text-sm font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all">
            {savingUni ? 'Saving...' : 'Save University'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-border rounded-[2rem] p-8">
        <h3 className="font-black text-text-primary flex items-center gap-2 mb-6">
          <Lock className="h-4 w-4 text-primary" /> Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Min. 6 characters"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 pr-12"
              />
              <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">Confirm New Password</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 pr-12"
              />
              <button onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3 text-sm font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-border rounded-[2rem] p-8">
        <h3 className="font-black text-text-primary flex items-center gap-2 mb-6">
          <Bell className="h-4 w-4 text-primary" /> Notifications
        </h3>
        <div className="space-y-4">
          {[
            { key: 'newQuestions', label: 'New past questions added', desc: 'Get notified when new questions are uploaded' },
            { key: 'examReminders', label: 'Exam reminders', desc: 'Reminders 3 days before your exam dates' },
            { key: 'aiTips', label: 'AI study tips', desc: 'Weekly AI-generated study recommendations' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-bold text-text-primary">{item.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                className={`w-12 h-6 rounded-full transition-all relative ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications[item.key as keyof typeof notifications] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="bg-white border border-border rounded-[2rem] p-8">
        <h3 className="font-black text-text-primary flex items-center gap-2 mb-6">
          <Shield className="h-4 w-4 text-primary" /> Account
        </h3>
        <div className="space-y-3">
          <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-border hover:bg-bg transition-all group">
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-text-secondary" />
              <span className="text-sm font-bold text-text-primary">Sign out</span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-secondary opacity-0 group-hover:opacity-100 transition-all" />
          </button>
          <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-error/20 hover:bg-error/5 transition-all group">
            <div className="flex items-center gap-3">
              <Trash2 className="h-4 w-4 text-error" />
              <span className="text-sm font-bold text-error">Delete account</span>
            </div>
            <ChevronRight className="h-4 w-4 text-error opacity-0 group-hover:opacity-100 transition-all" />
          </button>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-40">
          CourseGPT v1.0 — Built for Nigerian Universities
        </p>
      </div>
    </div>
  );
}