import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { PageLoader } from './components/Loaders';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WorkflowDashboard from './pages/WorkflowDashboard';
import StepBuilder from './pages/StepBuilder';
import ExecutionsList from './pages/ExecutionsList';
import ExecutionTracker from './pages/ExecutionTracker';

function Protected({ children }) {
  const { user, isReady } = useAuth();
  if (!isReady) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }) {
  const { user, isReady } = useAuth();
  if (!isReady) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {user && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/login" element={<Guest><LoginPage /></Guest>} />
          <Route path="/signup" element={<Guest><SignupPage /></Guest>} />

          <Route path="/" element={<Protected><WorkflowDashboard /></Protected>} />
          <Route path="/builder/:id" element={<Protected><StepBuilder /></Protected>} />
          <Route path="/executions" element={<Protected><ExecutionsList /></Protected>} />
          <Route path="/execution/:id" element={<Protected><ExecutionTracker /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
