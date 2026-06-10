import { Link } from 'react-router-dom';
import { GraduationCap, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-text-primary">
                Course<span className="text-primary">GPT</span>
              </span>
            </Link>
            <p className="mt-4 text-text-secondary max-w-xs">
              Study smarter with AI-powered past questions and study plans built for Nigerian university students.
            </p>
            <div className="mt-6 space-y-3">
              <p className="text-xs font-black text-text-secondary uppercase tracking-widest">Connect With Us</p>
              <div className="flex flex-col gap-2">
                <a href="https://whatsapp.com/channel/0029Vb7xVjg0VycG8sA7LE2g" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-green-600 transition-colors">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  WhatsApp Channel
                </a>
                <a href="https://chat.whatsapp.com/EDvKIrg8gtF5naypmTVZVf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-green-600 transition-colors">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  WhatsApp Community
                </a>
                <a href="https://www.tiktok.com/@mycoursegpt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                  </svg>
                  TikTok — @mycoursegpt
                </a>
                <a href="https://wa.me/2349066467677" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-green-600 transition-colors">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  WhatsApp Support
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Features</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/dashboard/questions" className="text-text-secondary hover:text-primary transition-colors">Past Questions</Link></li>
              <li><Link to="/dashboard/ai" className="text-text-secondary hover:text-primary transition-colors">AI Tutor</Link></li>
              <li><Link to="/dashboard/planner" className="text-text-secondary hover:text-primary transition-colors">Study Planner</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/about" className="text-text-secondary hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="text-text-secondary hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-text-secondary hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-text-secondary">© 2026 CourseGPT. Built for Nigerian Universities.</p>
          <div className="flex items-center gap-4">
            <a href="mailto:coursegpt79@gmail.com" className="text-sm text-text-secondary hover:text-primary transition-colors">coursegpt79@gmail.com</a>
            <span className="text-sm text-text-secondary">#StudySmarter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}