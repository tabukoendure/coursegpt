import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-black text-text-primary uppercase tracking-tight">COURSE<span className="text-primary">GPT</span></span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-text-primary tracking-tight mb-4">About CourseGPT</h1>
        <p className="text-text-secondary text-lg mb-12 font-medium">Built for Nigerian university students, by people who understand the struggle.</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-black text-text-primary mb-3">Our Mission</h2>
            <p className="text-text-secondary font-medium leading-relaxed">CourseGPT exists to give every Nigerian university student access to smart study tools — regardless of their school, department, or budget. From UNILAG to FUTA, from Medicine to Law, we are building the study partner every student deserves.</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-text-primary mb-3">What We Offer</h2>
            <ul className="space-y-3">
              {[
                'Past questions library — filtered by university and department',
                'AI Tutor — ask anything about your course material',
                'PDF tools — upload lecture notes and generate summaries, flashcards, quizzes and cheatsheets',
                'Study Planner — plan your exam prep week by week',
                'Leaderboard — compete with students across your university',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-text-secondary font-medium">
                  <span className="h-5 w-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-text-primary mb-3">Contact Us</h2>
            <p className="text-text-secondary font-medium leading-relaxed">For support, feedback or partnership enquiries, reach us at:</p>
            <a href="mailto:coursegpt79@gmail.com" className="inline-block mt-2 text-primary font-black hover:underline">coursegpt79@gmail.com</a>
            <p className="text-text-secondary font-medium mt-2">WhatsApp: <a href="https://wa.me/2349066467677" className="text-primary font-black hover:underline">09066467677</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
