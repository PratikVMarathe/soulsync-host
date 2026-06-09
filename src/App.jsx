import { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import AppErrorBoundary from './components/AppErrorBoundary';
import { ALL_APP_ROLES } from './constants/auth';
import AppNoticeCenter from './components/AppNoticeCenter';
import AppSidebar from './components/AppSidebar';
import AppTopbar from './components/AppTopbar';
import { AppNoticeProvider } from './context/AppNoticeContext';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import QuizLibraryPage from './pages/QuizLibraryPage';
import {
  getAuthErrorMessage,
  resolveAuthSession,
  safeSignOut,
} from './services/sessionService';
import './index.css';

const QuizWidget = lazy(() => import('quizApp/QuizWidget'));

function RoleGuard({ allowedRoles = ALL_APP_ROLES, children, user }) {
  if (!user) {
    return <Navigate replace to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate replace to="/" />;
  }

  return children;
}

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

function AuthenticatedShell({ onUserChange, user }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();

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
          <AppErrorBoundary resetKey={location.pathname}>
            <Routes>
              <Route
                element={(
                  <RoleGuard user={user}>
                    <Dashboard user={user} />
                  </RoleGuard>
                )}
                path="/"
              />
              <Route
                element={(
                  <RoleGuard user={user}>
                    <ProfilePage onUserChange={onUserChange} user={user} />
                  </RoleGuard>
                )}
                path="/profile"
              />
              <Route
                element={(
                  <RoleGuard user={user}>
                    <QuizLibraryPage />
                  </RoleGuard>
                )}
                path="/quiz"
              />
              <Route
                element={
                  <RoleGuard user={user}>
                    <AppErrorBoundary
                      compact
                      fallbackState={{
                        message: 'The quiz experience could not be loaded. The quiz service may be unavailable right now.',
                        statusCode: 502,
                        title: 'Quiz Service Unavailable',
                      }}
                      resetKey={location.pathname}
                    >
                      <Suspense fallback={<div className="app-loading-screen">Loading concept...</div>}>
                        <QuizWrapper user={user} />
                      </Suspense>
                    </AppErrorBoundary>
                  </RoleGuard>
                }
                path="/quiz/:quizId"
              />
              <Route element={<NotFoundPage />} path="*" />
            </Routes>
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function AppRouter({ authError, onUserChange, user }) {
  if (!user) {
    return (
      <AppErrorBoundary>
        <Routes>
          <Route element={<LandingPage authError={authError} />} path="/" />
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </AppErrorBoundary>
    );
  }

  return <AuthenticatedShell onUserChange={onUserChange} user={user} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setAuthError('');
      }

      try {
        const viewer = await resolveAuthSession(currentUser);

        if (!isMounted) return;

        setUser(viewer);
      } catch (error) {
        if (!isMounted) return;

        console.error('Failed to resolve SoulSync session:', error);
        setUser(null);
        setAuthError(getAuthErrorMessage(error));

        try {
          await safeSignOut();
        } catch (signOutError) {
          console.error('Failed to sign out after access denial:', signOutError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="app-loading-screen">Loading SoulSync...</div>;
  }

  return (
    <AppNoticeProvider>
      <Router>
        <div className="app-global-background" aria-hidden="true">
          <div className="app-background-orb is-left" />
          <div className="app-background-orb is-right" />
          <div className="app-background-leaf" />
        </div>

        <AppNoticeCenter />
        <AppRouter authError={authError} onUserChange={setUser} user={user} />
      </Router>
    </AppNoticeProvider>
  );
}
