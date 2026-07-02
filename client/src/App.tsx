import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResumePage } from './pages/ResumePage';
import { JobsPage } from './pages/JobsPage';
import { MatchPage } from './pages/MatchPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { BulletEnhancerPage } from './pages/BulletEnhancerPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/enhancer" element={<BulletEnhancerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
