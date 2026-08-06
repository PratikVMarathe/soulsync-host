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
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import AppErrorBoundary from './components/AppErrorBoundary';
import AppNoticeCenter from './components/AppNoticeCenter';
import AppSidebar from './components/AppSidebar';
import AppTopbar from './components/AppTopbar';
import { ADMIN_ROLES } from './constants/auth';
import { AppNoticeProvider } from './context/AppNoticeContext';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import QuizLibraryPage from './pages/QuizLibraryPage';
import SatsangCentralPage from './pages/SatsangCentralPage';
import {
  getAuthErrorMessage,
  resolveAuthSession,
  safeSignOut,
} from './services/sessionService';
import './index.css';

const loadAdminModule = import.meta.env.DEV
  ? () => import('../../soulsync-admin/src/AdminModule.jsx')
  : () => import('adminApp/AdminModule');

const loadQuizWidget = import.meta.env.DEV
  ? () => import('../../soulsync-quiz/src/App.jsx')
  : () => import('quizApp/QuizWidget');

const AdminModule = lazy(loadAdminModule);
const QuizWidget = lazy(loadQuizWidget);

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

function UserRoleGuard({ children, user }) {
  if (!user) {
    return <Navigate replace to="/" />;
  }

  if (isAdminRole(user.role)) {
    return <Navigate replace to="/admin/" />;
  }

  return children;
}

function QuizWrapper({ user }) {
  const { quizId } = useParams();
  const navigate = useNavigate();

  return (
    <QuizWidget
      isEmbedded
      onExit={() => navigate('/satsang-central')}
      quizId={quizId}
      user={user}
    />
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
        user={user}
      />

      <div className={`app-layout-body${isSidebarExpanded ? ' is-sidebar-expanded' : ''}`}>
        <AppTopbar isSidebarExpanded={isSidebarExpanded} user={user} />

        <main className="app-layout-main">
          <AppErrorBoundary resetKey={location.pathname}>
            <Routes>
              <Route
                element={(
                  <UserRoleGuard user={user}>
                    <Dashboard user={user} />
                  </UserRoleGuard>
                )}
                path="/"
              />
              <Route
                element={(
                  <UserRoleGuard user={user}>
                    <ProfilePage onUserChange={onUserChange} user={user} />
                  </UserRoleGuard>
                )}
                path="/profile"
              />
              <Route
                element={(
                  <UserRoleGuard user={user}>
                    <QuizLibraryPage user={user} />
                  </UserRoleGuard>
                )}
                path="/quiz"
              />
              <Route
                element={(
                  <UserRoleGuard user={user}>
                    <SatsangCentralPage onUserChange={onUserChange} user={user} />
                  </UserRoleGuard>
                )}
                path="/satsang-central"
              />
              <Route
                element={
                  <UserRoleGuard user={user}>
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
                  </UserRoleGuard>
                }
                path="/quiz/:quizId"
              />
              <Route element={<Navigate replace to="/" />} path="/admin/*" />
              <Route element={<NotFoundPage />} path="*" />
            </Routes>
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function AdminWorkspaceRoute({ onSignOut, onUserChange, signOutPending, user }) {
  const location = useLocation();

  if (!user) {
    return <Navigate replace to="/" />;
  }

  if (!isAdminRole(user.role)) {
    return <Navigate replace to="/" />;
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

function GuestRoutes({ authError }) {
  return (
    <AppErrorBoundary>
      <Routes>
        <Route element={<LandingPage authError={authError} />} path="/" />
        <Route element={<Navigate replace to="/" />} path="/admin/*" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </AppErrorBoundary>
  );
}

function AdminRoutes({ onSignOut, onUserChange, signOutPending, user }) {
  return (
    <Routes>
      <Route element={<Navigate replace to="/admin/" />} path="/" />
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
      <Route element={<Navigate replace to="/admin/" />} path="*" />
    </Routes>
  );
}

function AppRouter({
  authError,
  onSignOut,
  onUserChange,
  signOutPending,
  user,
}) {
  if (!user) {
    return <GuestRoutes authError={authError} />;
  }

  if (isAdminRole(user.role)) {
    return (
      <AdminRoutes
        onSignOut={onSignOut}
        onUserChange={onUserChange}
        signOutPending={signOutPending}
        user={user}
      />
    );
  }

  return <UserShell onUserChange={onUserChange} user={user} />;
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
          authError={authError}
          onSignOut={handleSignOut}
          onUserChange={setUser}
          signOutPending={signOutPending}
          user={user}
        />
      </Router>
    </AppNoticeProvider>
  );
}
