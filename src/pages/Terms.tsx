import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function Terms() {
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
        <h1 className="text-4xl font-black text-text-primary tracking-tight mb-4">Terms of Service</h1>
        <p className="text-text-secondary font-medium mb-2">Last updated: June 2026</p>
        <p className="text-text-secondary font-medium mb-12">Please read these terms carefully before using CourseGPT.</p>

        <div className="space-y-10">
          {[
            {
              title: '1. Acceptance of Terms',
              content: 'By creating an account or using CourseGPT, you agree to these Terms of Service. If you do not agree, please do not use the platform.',
            },
            {
              title: '2. Eligibility',
              content: 'CourseGPT is intended for Nigerian university students aged 16 and above. By registering, you confirm that the information you provide is accurate.',
            },
            {
              title: '3. Acceptable Use',
              content: 'You agree not to upload copyrighted materials you do not have rights to, attempt to reverse-engineer or hack the platform, use the AI to generate harmful or misleading content, or share your account with others.',
            },
            {
              title: '4. AI-Generated Content',
              content: 'AI responses on CourseGPT are generated for study assistance only. They should not be treated as professional, legal, or medical advice. Always verify important information with your lecturers or official course materials.',
            },
            {
              title: '5. Subscriptions and Payments',
              content: 'Pro and Premium subscriptions are billed monthly. You can cancel at any time from the upgrade page. Refunds are not provided for partial months. CourseGPT reserves the right to change pricing with 30 days notice.',
            },
            {
              title: '6. Points and Rewards',
              content: 'Points earned through uploads and referrals can be withdrawn as cash (minimum 500 points). CourseGPT reserves the right to reverse points obtained through fraudulent activity. Withdrawals are processed every Friday.',
            },
            {
              title: '7. Termination',
              content: 'We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting coursegpt79@gmail.com.',
            },
            {
              title: '8. Limitation of Liability',
              content: 'CourseGPT is provided "as is". We are not liable for any academic outcomes, data loss, or damages arising from the use of the platform.',
            },
            {
              title: '9. Contact',
              content: 'For questions about these terms, contact us at coursegpt79@gmail.com.',
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
