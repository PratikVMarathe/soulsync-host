import { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import AppSidebar from './components/AppSidebar';
import AppTopbar from './components/AppTopbar';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import './index.css';

const QuizWidget = lazy(() => import('quizApp/QuizWidget'));

function QuizWrapper({ user }) {
  const { quizId } = useParams();
  const navigate = useNavigate();

  return (
    <QuizWidget
      isEmbedded
      onExit={() => navigate('/')}
      quizId={quizId}
      user={user}
    />
  );
}

function AuthenticatedShell({ user }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="app-layout">
      <AppSidebar
        isExpanded={isSidebarExpanded}
        onExpandedChange={setIsSidebarExpanded}
        user={user}
      />

      <div className={`app-layout-body${isSidebarExpanded ? ' is-sidebar-expanded' : ''}`}>
        <AppTopbar isSidebarExpanded={isSidebarExpanded} user={user} />

        <main className="app-layout-main">
          <Routes>
            <Route element={<Dashboard user={user} />} path="/" />
            <Route
              element={
                <Suspense fallback={<div className="app-loading-screen">Loading concept...</div>}>
                  <QuizWrapper user={user} />
                </Suspense>
              }
              path="/quiz/:quizId"
            />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppRouter({ user }) {
  if (!user) {
    return (
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    );
  }

  return <AuthenticatedShell user={user} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="app-loading-screen">Loading SoulSync...</div>;
  }

  return (
    <Router>
      <div className="app-global-background" aria-hidden="true">
        <div className="app-background-orb is-left" />
        <div className="app-background-orb is-right" />
        <div className="app-background-leaf" />
      </div>

      <AppRouter user={user} />
    </Router>
  );
}
