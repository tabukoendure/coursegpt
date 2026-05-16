import React from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronRight, Loader2, Search } from 'lucide-react';

const NIGERIAN_UNIVERSITIES = [
  // Federal Universities
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
  // State Universities
  "Abia State University, Uturu",
  "Adamawa State University, Mubi",
  "Adekunle Ajasin University, Akungba-Akoko",
  "Akwa Ibom State University",
  "Ambrose Alli University, Ekpoma",
  "Anambra State University",
  "Bauchi State University, Gadau",
  "Benue State University, Makurdi",
  "Bowen University, Iwo",
  "Calabar State University",
  "Cross River State University of Technology",
  "Delta State University, Abraka",
  "Ebonyi State University",
  "Ekiti State University",
  "Enugu State University of Science and Technology",
  "Gombe State University",
  "Ibrahim Badamasi Babangida University, Lapai",
  "Ignatius Ajuru University of Education, Port Harcourt",
  "Imo State University, Owerri",
  "Isah Kaita University, Dutsin-Ma",
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
  "Nile University of Nigeria, Abuja",
  "Ogun State University",
  "Olabisi Onabanjo University, Ago-Iwoye",
  "Ondo State University of Science and Technology",
  "Osun State University",
  "Oyo State University",
  "Plateau State University, Bokkos",
  "Rivers State University",
  "Sokoto State University",
  "Tai Solarin University of Education, Ijebu-Ode",
  "Taraba State University, Jalingo",
  "Umaru Musa Yaradua University, Katsina",
  "Yobe State University, Damaturu",
  "Zamfara State University",
  // Private Universities
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
  "CETEP City University, Lagos",
  "Chrisland University, Abeokuta",
  "Christopher University, Mowe",
  "Clifford University, Owerrinta",
  "Coal City University, Enugu",
  "Covenant University, Ota",
  "Crawford University, Igbesa",
  "Crescent University, Abeokuta",
  "Dominican University, Ibadan",
  "Edwin Clark University, Kiagbodo",
  "Elizade University, Ilara-Mokin",
  "Evangel University, Akaeze",
  "Fountain University, Osogbo",
  "Glorious Vision University, Ogwa",
  "Godfrey Okoye University, Enugu",
  "Gregory University, Uturu",
  "Hallmark University, Ijebu-Itele",
  "Hezekiah University, Umudi",
  "Hills University, Abuja",
  "Igbinedion University, Okada",
  "Ilishan-Remo University",
  "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "Kings University, Ode-Omu",
  "Kola Daisi University, Ibadan",
  "Kwararafa University, Wukari",
  "Landmark University, Omu-Aran",
  "Lead City University, Ibadan",
  "Legacy University, Okija",
  "Madonna University, Okija",
  "McPherson University, Seriki Sotayo",
  "Mercy Medical University, Iwo",
  "Michael and Cecilia Ibru University",
  "Mountain Top University, Ibafo",
  "Novena University, Ogume",
  "Oduduwa University, Ipetumodu",
  "Pan-Atlantic University, Lagos",
  "Paul University, Awka",
  "Peter University, Achina-Orumba",
  "Philomath University, Kuje",
  "Precious Cornerstone University, Ibadan",
  "Redeemer's University, Ede",
  "Renaissance University, Enugu",
  "Rhema University, Obeama-Asa",
  "Ritman University, Ikot Ekpene",
  "Robert Milligan University, Calabar",
  "Salem University, Lokoja",
  "Samuel Adegboyega University, Ogwa",
  "Skyline University, Kano",
  "Southwestern University, Oku-Owa",
  "Spiritan University, Nneochi",
  "Summit University, Offa",
  "Tansian University, Umunya",
  "Trinity University, Lagos",
  "Unizik Distance Learning",
  "University of Mkar, Mkar",
  "Veritas University, Abuja",
  "Western Delta University, Oghara",
  "Wellspring University, Evbuobanosa",
  "Wesley University, Ondo",
  "Western Delta University",
  "Westland University, Iwo",
  "William Jessup University",
  "Wisdom University, Umeh",
  "Yusuf Maitama Sule University, Kano",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [form, setForm] = React.useState({
    university: '',
    level: '',
    department: '',
  });
  const [uniSearch, setUniSearch] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);

  const filteredUniversities = NIGERIAN_UNIVERSITIES.filter(u =>
    u.toLowerCase().includes(uniSearch.toLowerCase())
  ).slice(0, 8);

  React.useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/login');
      setChecking(false);
    };
    check();
  }, []);

  const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'];

  const handleFinish = async () => {
    if (!form.university || !form.level || !form.department) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email,
        email: user.email,
        university: form.university,
        level: form.level,
        department: form.department,
      }, { onConflict: 'id' });

      if (error) {
        alert('Failed to save profile: ' + error.message);
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-text-primary tracking-tight uppercase">
            COURSE<span className="text-primary">GPT</span>
          </span>
        </div>

        <div className="bg-white border border-border rounded-[2rem] p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-text-primary">Welcome to CourseGPT! 🎓</h2>
            <p className="text-sm text-text-secondary mt-1">Just a few details to personalize your experience</p>
          </div>

          {/* University with autocomplete */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">Your University</label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  value={uniSearch || form.university}
                  onChange={e => {
                    setUniSearch(e.target.value);
                    setForm({ ...form, university: '' });
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search your university..."
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all ${form.university ? 'border-primary bg-primary/5' : 'border-border'}`}
                />
              </div>

              {/* Selected university pill */}
              {form.university && (
                <div className="mt-2 flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl">
                  <span className="text-sm font-black text-primary flex-1">{form.university}</span>
                  <button
                    onClick={() => { setForm({ ...form, university: '' }); setUniSearch(''); }}
                    className="text-primary/50 hover:text-error text-lg leading-none"
                  >×</button>
                </div>
              )}

              {/* Dropdown */}
              {showDropdown && uniSearch.length > 0 && !form.university && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-2xl shadow-xl overflow-hidden">
                  {filteredUniversities.length > 0 ? (
                    filteredUniversities.map(uni => (
                      <button
                        key={uni}
                        onClick={() => {
                          setForm({ ...form, university: uni });
                          setUniSearch('');
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-text-primary hover:bg-primary/5 hover:text-primary transition-all border-b border-border/50 last:border-0"
                      >
                        {uni}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-text-secondary font-medium">
                      No university found. Check spelling.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Level */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">What level are you?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {levels.map(l => (
                <button key={l} onClick={() => setForm({ ...form, level: l })}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${form.level === l ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">What's your department?</label>
            <input
              type="text"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Nursing Science, Engineering, Law..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            onClick={handleFinish}
            disabled={!form.university || !form.level || !form.department || loading}
            className="w-full bg-primary text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Go to Dashboard <ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}