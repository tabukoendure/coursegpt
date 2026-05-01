import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-text-primary">
                Course<span className="text-primary">GPT</span>
              </span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/past-questions" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">Past Questions</Link>
            <Link to="/ai-tutor" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">AI Tutor</Link>
            <Link to="/study-planner" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">Study Planner</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-text-secondary hover:text-primary font-medium text-sm px-4 py-2">Log in</Link>
            <Link to="/register" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-primary/20">
              Get started free
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-text-secondary p-2">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-border px-4 pt-2 pb-6 space-y-2"
        >
          <Link to="/past-questions" className="block px-3 py-3 rounded-lg text-base font-medium text-text-primary hover:bg-primary-light">Past Questions</Link>
          <Link to="/ai-tutor" className="block px-3 py-3 rounded-lg text-base font-medium text-text-primary hover:bg-primary-light">AI Tutor</Link>
          <Link to="/study-planner" className="block px-3 py-3 rounded-lg text-base font-medium text-text-primary hover:bg-primary-light">Study Planner</Link>
          <div className="pt-4 space-y-2">
            <Link to="/login" className="block w-full text-center py-3 text-text-primary font-medium rounded-lg border border-border">Log in</Link>
            <Link to="/register" className="block w-full text-center py-3 bg-primary text-white font-medium rounded-lg">Get started free</Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
