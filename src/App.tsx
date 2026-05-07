import ProWaitlist from './pages/ProWaitlist';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import Questions from './pages/Questions';
import AiTutor from './pages/AiTutor';
import Planner from './pages/Planner';
import Upload from './pages/Upload';
import Recap from './pages/Recap';
import SummaryGenerator from './pages/SummaryGenerator';
import Flashcards from './pages/Flashcards';
import Cheatsheet from './pages/Cheatsheet';
import ProgressReport from './pages/ProgressReport';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/admin-cg2026" element={<AdminPanel />} />
        <Route path="/pro" element={<ProWaitlist />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } 
        >
          <Route index element={<DashboardOverview />} />
          <Route path="questions" element={<Questions />} />
          <Route path="ai" element={<AiTutor />} />
          <Route path="planner" element={<Planner />} />
          <Route path="upload" element={<Upload />} />
          <Route path="recap" element={<Recap />} />
          <Route path="summary" element={<SummaryGenerator />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="cheatsheet" element={<Cheatsheet />} />
          <Route path="progress" element={<ProgressReport />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}