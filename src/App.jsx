import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './config/firebase';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppNoticeCenter from './components/AppNoticeCenter';
import AppSidebar from './components/AppSidebar';
import AppTopbar from './components/AppTopbar';
import { ADMIN_ROLES } from './constants/auth';
import { AppNoticeProvider } from './context/AppNoticeContext';
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
import QuizLibraryPage from './pages/QuizLibraryPage';
import SatsangCentralPage from './pages/SatsangCentralPage';
import {
  getAuthErrorMessage,
  resolveAuthSession,
  safeSignOut,
} from './services/sessionService';
import './index.css';

const loadAdminModule = (import.meta.env.DEV || import.meta.env.MODE === 'test')
  ? () => import('../../soulsync-admin/src/AdminModule.jsx')
  : () => {
      const remote = 'adminApp/AdminModule';
      return import(/* @vite-ignore */ `${remote}`);
    };

const loadQuizWidget = (import.meta.env.DEV || import.meta.env.MODE === 'test')
  ? () => import('../../soulsync-quiz/src/App.jsx')
  : () => {
      const remote = 'quizApp/QuizWidget';
      return import(/* @vite-ignore */ `${remote}`);
    };

const AdminModule = lazy(loadAdminModule);
const QuizWidget = lazy(loadQuizWidget);

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

function QuizWrapper({ user }) {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/quiz');
    }
  };

  const handleContinueJourney = () => {
    navigate('/satsang-central', { state: { fromQuizJourney: true } });
  };

  return (
    <QuizWidget
      isEmbedded
      onBack={handleBack}
      onExit={handleBack}
      onComplete={handleContinueJourney}
      onReturn={handleContinueJourney}
      quizId={quizId}
      user={user}
    />
  );
}

function AdminLoginGate() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminSignIn = async () => {
    setIsSigningIn(true);
    setErrorMsg('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setErrorMsg('Sign-in failed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="app-status-screen" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="admin-dialog-card" style={{ maxWidth: '440px', width: '90%', padding: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
          SoulSync Admin Portal
        </h2>
        <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          Please sign in with your authorized administrator account to manage quizzes and satsang opportunities.
        </p>

        {errorMsg && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        <button
          className="primary-cta"
          disabled={isSigningIn}
          onClick={handleAdminSignIn}
          style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}
          type="button"
        >
          <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  );
}

function AdminWorkspaceRoute({ onSignOut, onUserChange, signOutPending, user }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <AdminLoginGate />;
  }

  if (!isAdminRole(user.role)) {
    return (
      <div className="app-status-screen" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="admin-dialog-card" style={{ maxWidth: '440px', width: '90%', padding: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.75rem' }}>
            Access Denied
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Your account ({user.email}) is not registered with administrator privileges.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              className="secondary-cta is-compact"
              onClick={() => navigate('/')}
              type="button"
            >
              Go to Dashboard
            </button>
            <button
              className="ghost-cta is-compact"
              onClick={onSignOut}
              type="button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppErrorBoundary
      compact
      fallbackState={{
        message: 'The admin workspace could not be loaded. The admin service may be unavailable right now.',
        statusCode: 502,
        title: 'Admin Service Unavailable',
      }}
      resetKey={location.pathname}
    >
      <Suspense fallback={<div className="app-loading-screen">Loading admin workspace...</div>}>
        <AdminModule
          onSignOut={onSignOut}
          onUserChange={onUserChange}
          signOutPending={signOutPending}
          viewer={user}
        />
      </Suspense>
    </AppErrorBoundary>
  );
}

function UserShell({ onUserChange, user }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      <AppSidebar
        isExpanded={isSidebarExpanded}
        onExpandedChange={setIsSidebarExpanded}
      />

      <div className={`app-layout-body${isSidebarExpanded ? ' is-sidebar-expanded' : ''}`}>
        <AppTopbar
          isSidebarExpanded={isSidebarExpanded}
        />

        <main className="app-layout-main">
          <AppErrorBoundary resetKey={location.pathname}>
            <Routes>
              <Route
                element={<Dashboard user={user} />}
                path="/"
              />
              <Route
                element={<QuizLibraryPage user={user} />}
                path="/quiz"
              />
              <Route
                element={(
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
                )}
                path="/quiz/:quizId"
              />
              <Route
                element={<SatsangCentralPage onUserChange={onUserChange} user={user} />}
                path="/satsang-central"
              />
              <Route element={<Navigate replace to="/" />} path="/profile" />
              <Route element={<Navigate replace to="/" />} path="/dashboard" />
              <Route element={<NotFoundPage />} path="*" />
            </Routes>
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function AppRouter({
  onSignOut,
  onUserChange,
  signOutPending,
  user,
}) {
  return (
    <Routes>
      <Route
        element={(
          <AdminWorkspaceRoute
            onSignOut={onSignOut}
            onUserChange={onUserChange}
            signOutPending={signOutPending}
            user={user}
          />
        )}
        path="/admin/*"
      />
      <Route
        element={(
          <UserShell
            onUserChange={onUserChange}
            user={user}
          />
        )}
        path="/*"
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signOutPending, setSignOutPending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (isMounted) {
          setUser(null);
          setSignOutPending(false);
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

  const handleSignOut = useCallback(async () => {
    setSignOutPending(true);

    try {
      await safeSignOut();
    } catch (error) {
      console.error('Failed to sign out from SoulSync host:', error);
    } finally {
      setUser(null);
      setSignOutPending(false);
    }
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
        <AppRouter
          onSignOut={handleSignOut}
          onUserChange={setUser}
          signOutPending={signOutPending}
          user={user}
        />
      </Router>
    </AppNoticeProvider>
  );
}
