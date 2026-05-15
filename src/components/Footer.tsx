import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

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
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Features</h3>
            <ul className="mt-4 space-y-2">
              <li><Link to="/past-questions" className="text-text-secondary hover:text-primary transition-colors">Past Questions</Link></li>
              <li><Link to="/ai-tutor" className="text-text-secondary hover:text-primary transition-colors">AI Tutor</Link></li>
              <li><Link to="/study-planner" className="text-text-secondary hover:text-primary transition-colors">Study Planner</Link></li>
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
          <div className="flex space-x-6">
            <span className="text-sm text-text-secondary">#StudySmarter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
