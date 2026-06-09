import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
        <h1 className="text-4xl font-black text-text-primary tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-text-secondary font-medium mb-2">Last updated: June 2026</p>
        <p className="text-text-secondary font-medium mb-12">By using CourseGPT, you agree to this policy.</p>

        <div className="space-y-10">
          {[
            {
              title: '1. Information We Collect',
              content: 'We collect your name, email address, university, department, and level when you register. We also collect uploaded PDF files, chat messages, and usage data to improve the service.',
            },
            {
              title: '2. How We Use Your Information',
              content: 'Your information is used to personalise your study experience, generate AI responses, track your progress, and process payments. We do not sell your data to third parties.',
            },
            {
              title: '3. PDF Uploads',
              content: 'PDFs you upload for AI tools are processed to extract text for AI analysis. Files are stored securely on Supabase Storage. You can delete your data at any time by contacting us.',
            },
            {
              title: '4. Payments',
              content: 'Payments are processed securely by Paystack. CourseGPT does not store your card details. Paystack\'s privacy policy applies to all payment transactions.',
            },
            {
              title: '5. Data Security',
              content: 'We use industry-standard security measures including encrypted connections (HTTPS), secure authentication via Supabase, and access controls to protect your data.',
            },
            {
              title: '6. Your Rights',
              content: 'You can request deletion of your account and all associated data by emailing coursegpt79@gmail.com. We will process your request within 7 business days.',
            },
            {
              title: '7. Contact',
              content: 'For privacy-related questions, contact us at coursegpt79@gmail.com.',
            },
          ].map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-black text-text-primary mb-3">{section.title}</h2>
              <p className="text-text-secondary font-medium leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
