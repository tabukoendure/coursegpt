import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Library, MessageSquare, Calendar, Star, ArrowRight, Sparkles, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/dashboard?search=${search}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-light text-primary text-xs font-bold tracking-tight mb-8"
          >
Built for Nigerian University Students 🎓
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-text-primary tracking-tight leading-[1.1] mb-6"
          >
            Stop failing exams.<br />
            <span className="text-primary italic">Start studying smarter.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Find past questions for any course, get AI-powered explanations tailored to your lecturers, and build a study plan that actually works.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16"
          >
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center group"
            >
              Get started free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 text-text-primary font-bold text-lg rounded-2xl border border-border hover:bg-white transition-all">
              See how it works
            </button>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto relative group"
          >
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-text-secondary group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a course — try BCH201, ANA204, PIO214..."
                className="w-full pl-14 pr-6 py-5 bg-white border border-border rounded-3xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
              />
            </div>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 pt-10 border-t border-border flex flex-wrap justify-center gap-10 md:gap-20"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary">200+</div>
              <div className="text-sm text-text-secondary font-medium">Past Questions</div>
            </div>
            <div className="text-center border-l border-border pl-10 md:pl-20">
              <div className="text-3xl font-bold text-text-primary">50+</div>
              <div className="text-sm text-text-secondary font-medium">Courses</div>
            </div>
            <div className="text-center border-l border-border pl-10 md:pl-20">
              <div className="text-3xl font-bold text-primary flex items-center">
                AI <Sparkles className="ml-1 h-5 w-5" />
              </div>
              <div className="text-sm text-text-secondary font-medium">Powered</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight">Everything you need to pass</h2>
            <p className="mt-4 text-lg text-text-secondary">Designed specifically for the Nigerian university curriculum.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="h-14 w-14 bg-primary-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Library className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">Past Questions Library</h3>
              <p className="text-text-secondary leading-relaxed">
                Every past question organized by course code. Search BCH201, get results instantly. No more begging seniors.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="h-14 w-14 bg-primary-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">AI Course Assistant</h3>
              <p className="text-text-secondary leading-relaxed">
                Ask anything about your course. Get answers tailored to how your lecturers teach and structure exams.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="h-14 w-14 bg-primary-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">Smart Study Planner</h3>
              <p className="text-text-secondary leading-relaxed">
                Enter your exam dates. Get a daily study plan that covers exactly what you need to master before the hall opens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight text-center mb-20">Simple as 1, 2, 3</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-border -z-10" />
            
            <div className="text-center">
              <div className="h-16 w-16 bg-white border border-border rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-primary shadow-sm">1</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Create free account</h3>
              <p className="text-text-secondary">Sign up in seconds with your university details.</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-white border border-border rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-primary shadow-sm">2</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Search your course code</h3>
              <p className="text-text-secondary">Instantly access a library of verified past questions.</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-white border border-border rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-primary shadow-sm">3</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Study smarter with AI</h3>
              <p className="text-text-secondary">Get explanations and predictions for upcoming exams.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center md:text-left">Popular Courses</h2>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {[
              { code: 'BCH201', name: 'General Biochemistry', count: 12 },
              { code: 'ANA204', name: 'Gross Anatomy', count: 8 },
              { code: 'PIO214', name: 'Physiology', count: 15 },
              { code: 'PHY202', name: 'Modern Physics', count: 10 },
              { code: 'CHM201', name: 'Organic Chemistry', count: 9 },
              { code: 'ANA202', name: 'Histology', count: 11 },
              { code: 'BIO201', name: 'Genetics', count: 7 },
              { code: 'MTH201', name: 'Linear Algebra', count: 14 },
            ].map((course) => (
              <button 
                key={course.code}
                onClick={() => navigate(`/dashboard?search=${course.code}`)}
                className="bg-bg hover:bg-primary-light border border-border hover:border-primary text-left p-4 rounded-2xl transition-all group"
              >
                <div className="font-bold text-text-primary group-hover:text-primary">{course.code}</div>
                <div className="text-xs text-text-secondary mb-2">{course.name}</div>
                <div className="text-[10px] font-bold text-primary-light-content bg-primary-light px-2 py-1 rounded inline-block">
                  {course.count} past questions
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-text-primary tracking-tight text-center mb-16">What students are saying</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Chioma', role: '300L Nursing Student', text: "CourseGPT totally changed my approach to ANA204. I found past questions I couldn't find anywhere else, and the AI explained the concepts so clearly. I scored an A!" },
              { name: 'Emeka', role: '200L Computer Science', text: "The study planner is a lifesaver. It broke down MTH201 into small chunks and I actually covered the entire syllabus before the exam. Highly recommend!" },
              { name: 'Fatima', role: '400L MLS Student', text: "I was struggling with Biochemistry until I started using CourseGPT. The AI assistant answers questions just like our lecturers want them. It's like having a private tutor 24/7." }
            ].map((t, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-border shadow-sm">
                <div className="flex text-success mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-text-primary mb-6 italic italic capitalize">"{t.text}"</p>
                <div>
                  <div className="font-bold text-text-primary">{t.name}</div>
                  <div className="text-sm text-text-secondary">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-primary rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl shadow-primary/30 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <GraduationCap className="h-64 w-64" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to pass your next exam?</h2>
          <p className="text-xl text-primary-light opacity-90 max-w-2xl mx-auto mb-10">
            Join thousands of Nigerian university students already studying smarter. Start for free — no credit card needed.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="px-10 py-5 bg-white text-primary rounded-2xl font-bold text-xl hover:bg-primary-light transition-all shadow-lg"
          >
            Start studying for free
          </button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
