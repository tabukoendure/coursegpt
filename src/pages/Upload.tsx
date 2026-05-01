import React from 'react';
import { 
  Upload as UploadIcon, FileText, CheckCircle2, 
  Loader2, CreditCard, Gift, TrendingUp, 
  AlertCircle, Trash2, Award, ChevronRight, HelpCircle, Target 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 8 }, (_, i) => 
  String(currentYear - i)
);
const depts = ['Nursing Science', 'Engineering', 'Law', 'Pharmacy', 'MBBS', 'Other'];
export default function Upload() {
  const [activeTab, setActiveTab] = React.useState<'form' | 'my-uploads'>('form');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [formData, setFormData] = React.useState({
    courseCode: '',
    courseName: '',
    year: '2024',
    department: 'Sciences',
    description: ''
  });
  const [myUploads, setMyUploads] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (activeTab === 'my-uploads') {
      fetchMyUploads();
    }
  }, [activeTab]);

  const fetchMyUploads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('past_questions')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });
      setMyUploads(data || []);
    } catch (err) {
      console.error('Fetch my uploads error:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') { setError('Please upload a PDF file only.'); return; }
    if (selectedFile.size > 15 * 1024 * 1024) { setError('File size must be less than 15MB.'); return; }
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload.'); return; }
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be logged in to upload.'); setLoading(false); return; }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.courseCode}_${formData.year}_${Date.now()}.${fileExt}`;
      const filePath = `${formData.courseCode}/${formData.year}/${fileName}`;

      const { data: uploadData, error: storageError } = await supabase.storage.from('past-questions').upload(filePath, file);
      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('past-questions').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase.from('past_questions').insert([{
        course_code: formData.courseCode.toUpperCase(),
        course_name: formData.courseName,
        year: formData.year,
        department: formData.department,
        file_url: publicUrl,
        description: formData.description,
        uploaded_by: user.id
      }]);

      if (dbError) throw dbError;

      setSuccess(true);
      setFile(null);
      setFormData({ courseCode: '', courseName: '', year: '2024', department: 'Sciences', description: '' });
      setTimeout(() => { 
        setSuccess(false); 
        setActiveTab('my-uploads'); 
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setLoading(false);
    }
  };

  const totalDownloads = myUploads.reduce((acc, curr) => acc + (curr.download_count || 0), 0);
  const estimatedEarnings = Math.floor(totalDownloads / 10) * 50;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight uppercase tracking-tighter">Upload & Earn</h1>
          <p className="text-sm text-text-secondary mt-1 font-medium italic">Support the library and get rewarded with airtime vouchers.</p>
        </div>
        <div className="bg-white p-1 shadow-sm border border-border rounded-2xl w-fit flex h-fit">
          <button 
            onClick={() => setActiveTab('form')} 
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'form' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-secondary hover:bg-bg'}`}
          >
            Contribute ↗
          </button>
          <button 
            onClick={() => setActiveTab('my-uploads')} 
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my-uploads' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-secondary hover:bg-bg'}`}
          >
            My Library
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'form' ? (
          <motion.div 
            key="form" 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }} 
            className="grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            <div className="lg:col-span-3">
              <form onSubmit={handleUpload} className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-border shadow-sm space-y-8">
                {success && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-5 bg-success/5 border border-success/20 rounded-[2rem] flex items-center text-success font-black text-xs uppercase tracking-widest"
                  >
                    <CheckCircle2 className="h-6 w-6 mr-4" /> Uploaded successfully! Redirecting...
                  </motion.div>
                )}
                
                {error && (
                  <div className="p-5 bg-error/5 border border-error/20 rounded-[2rem] flex items-center text-error font-black text-[10px] uppercase tracking-widest">
                    <AlertCircle className="h-6 w-6 mr-4" /> {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Course Code</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.courseCode} 
                      onChange={e => setFormData({...formData, courseCode: e.target.value.toUpperCase()})} 
                      placeholder="BCH201" 
                      className="w-full px-6 py-4 bg-bg border border-border rounded-2xl focus:border-primary outline-none transition-all font-bold text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Full Course Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.courseName} 
                      onChange={e => setFormData({...formData, courseName: e.target.value})} 
                      placeholder="Intro to Biochemistry" 
                      className="w-full px-6 py-4 bg-bg border border-border rounded-2xl focus:border-primary outline-none transition-all font-bold text-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Year</label>
                      <select 
                        value={formData.year}
                        onChange={e => setFormData({...formData, year: e.target.value})}
                        className="w-full px-6 py-4 bg-bg border border-border rounded-2xl focus:border-primary outline-none transition-all font-bold text-xs"
                      >
                         {years.map(y => <option key={y}>{y}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Department</label>
                      <select 
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="w-full px-6 py-4 bg-bg border border-border rounded-2xl focus:border-primary outline-none transition-all font-bold text-xs"
                      >
                         {depts.map(d => <option key={d}>{d}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Past Question PDF</label>
                  <label className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${file ? 'border-success bg-success/5 rotate-0' : 'border-border bg-bg/50 hover:border-primary hover:bg-white'} group`}>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                    {file ? (
                      <div className="text-center">
                        <div className="h-16 w-16 bg-success/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-success" />
                        </div>
                        <p className="text-sm font-black text-success truncate max-w-[250px] uppercase tracking-tight">{file.name}</p>
                        <p className="text-[10px] font-bold text-success/60 mt-1 uppercase tracking-[0.2em]">FILE READY FOR CONTRIBUTION</p>
                      </div>
                    ) : (
                      <div className="text-center text-text-secondary">
                        <UploadIcon className="h-12 w-12 mx-auto mb-4 opacity-10 group-hover:opacity-40 group-hover:scale-110 transition-all font-black" />
                        <p className="text-sm font-black text-text-primary tracking-tight">Drop your PDF here</p>
                        <p className="text-[10px] mt-2 font-bold opacity-60">VERIFIED ARCHIEVERS PAPERS ONLY • MAX 15MB</p>
                      </div>
                    )}
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !file} 
                  className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 flex items-center justify-center disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <UploadIcon className="h-5 w-5 mr-3" />} Complete Submission
                </button>
              </form>
            </div>
            
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 md:p-10 rounded-[3rem] border border-border shadow-sm relative overflow-hidden">
                <Gift className="absolute -bottom-6 -right-6 h-32 w-32 text-purple-500 opacity-5" />
                <h3 className="text-[11px] font-black text-text-primary mb-8 uppercase tracking-[0.2em] flex items-center">
                   <Target className="h-4 w-4 mr-2 text-primary" /> Reward Structure
                </h3>
                <div className="space-y-4">
                  {[
                    { title: 'Airtime Voucher', desc: '₦100 for every 20 downloads', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
                    { title: 'Honor Role', desc: 'Top contributors get prime site badges', icon: Award, color: 'text-purple-600 bg-purple-50' },
                    { title: 'Network Bonus', desc: 'Bonus data for first upload', icon: TrendingUp, color: 'text-success bg-success/5' }
                  ].map((r, i) => (
                    <div key={i} className="flex items-center space-x-4 p-5 bg-white border border-border/10 rounded-[2rem] hover:bg-bg/40 transition-all cursor-default">
                      <div className={`p-4 rounded-2xl ${r.color}`}><r.icon className="h-6 w-6" /></div>
                      <div>
                        <div className="font-black text-xs text-text-primary uppercase tracking-tight">{r.title}</div>
                        <div className="text-[10px] text-text-secondary font-bold uppercase tracking-tight opacity-70">{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 p-5 bg-bg/50 border border-border/50 rounded-2xl text-[9px] text-text-secondary text-center leading-relaxed font-black uppercase tracking-widest opacity-50">
                  Payments are processed every Friday. Minimum withdrawal: ₦500.
                </div>
              </section>

              <section className="bg-primary/5 p-8 rounded-[3rem] border border-primary/10">
                <div className="flex items-center space-x-3 mb-4">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Quick Tips</span>
                </div>
                <ul className="space-y-3 text-[11px] font-bold text-text-secondary list-disc pl-4 leading-relaxed">
                  <li>Ensure the scan is high resolution and readable</li>
                  <li>Always use the correct course code (e.g. BCH201)</li>
                  <li>Include marking schemes if you have them</li>
                  <li>Duplicate uploads will be automatically rejected</li>
                </ul>
              </section>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="my-uploads" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-8 pb-10"
          >
            {/* Earnings Recap Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm flex items-center space-x-6">
                 <div className="h-16 w-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
                    <DownloadIcon className="h-8 w-8" />
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Total Impact</div>
                    <div className="text-3xl font-black text-text-primary tracking-tighter">{totalDownloads} Downloads</div>
                 </div>
              </div>
              
              <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20 flex items-center space-x-6">
                 <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center">
                    <Gift className="h-8 w-8" />
                 </div>
                 <div>
                    <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Available Rewards</div>
                    <div className="text-3xl font-black tracking-tighter">₦{estimatedEarnings}</div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-border border-dashed flex items-center justify-center">
                 <button className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-all">
                   Withdraw Rewards ↗
                 </button>
              </div>
            </div>

            {/* Uploaded History List */}
            <section className="bg-white rounded-[3rem] border border-border shadow-sm overflow-hidden min-h-[400px]">
               <div className="p-8 border-b border-border bg-bg/5 flex justify-between items-center">
                  <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">Your Upload History</h3>
                  <span className="text-[10px] font-bold text-text-secondary">{myUploads.length} Documents</span>
               </div>
               
               {myUploads.length > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-b border-border text-[9px] font-black uppercase text-text-secondary tracking-widest">
                         <th className="px-8 py-5">Document</th>
                         <th className="px-8 py-5">Uploaded On</th>
                         <th className="px-8 py-5">Downloads</th>
                         <th className="px-8 py-5">Status</th>
                         <th className="px-8 py-5">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border/50">
                       {myUploads.map(upload => (
                         <tr key={upload.id} className="hover:bg-bg/30 transition-all font-medium text-xs text-text-primary">
                           <td className="px-8 py-6">
                              <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 bg-bg rounded-xl flex items-center justify-center text-primary font-black uppercase text-[10px] border border-border/50">
                                  {upload.course_code.substring(0,2)}
                                </div>
                                <div className="truncate max-w-[200px]">
                                   <div className="font-bold text-sm tracking-tight">{upload.course_code}</div>
                                   <div className="text-[10px] text-text-secondary truncate">{upload.course_name || 'Achievers Course'}</div>
                                </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">{new Date(upload.created_at).toLocaleDateString()}</td>
                           <td className="px-8 py-6">
                             <span className="bg-bg px-3 py-1.5 rounded-xl font-black text-[10px] border border-border">
                               {upload.download_count || 0}
                             </span>
                           </td>
                           <td className="px-8 py-6">
                              <span className="flex items-center text-success font-black text-[9px] uppercase tracking-widest">
                                <CheckCircle2 className="h-3 w-3 mr-2" /> Verified
                              </span>
                           </td>
                           <td className="px-8 py-6">
                              <button className="p-2 text-text-secondary hover:text-primary transition-all">
                                 <ChevronRight className="h-5 w-5" />
                              </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-24 w-24 bg-bg rounded-[3rem] flex items-center justify-center mb-6 opacity-30">
                       <FileText className="h-12 w-12" />
                    </div>
                    <p className="text-sm font-black text-text-primary mb-2">No uploads yet</p>
                    <p className="text-xs text-text-secondary mb-8">Your contributions help Achievers students succeed.</p>
                    <button 
                      onClick={() => setActiveTab('form')}
                      className="px-8 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20"
                    >
                      Upload First document
                    </button>
                 </div>
               )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DownloadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
