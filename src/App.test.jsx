import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const mockOnAuthStateChanged = vi.fn();
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('./config/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
}));

const mockResolveAuthSession = vi.fn();
const mockSafeSignOut = vi.fn();
vi.mock('./services/sessionService', () => ({
  resolveAuthSession: (...args) => mockResolveAuthSession(...args),
  safeSignOut: (...args) => mockSafeSignOut(...args),
  getAuthErrorMessage: (err) => err.message || 'Auth error',
}));

vi.mock('./services/quizCatalogService', () => ({
  loadAvailableQuizzes: vi.fn().mockResolvedValue([]),
  getQuizFilterOptions: vi.fn().mockReturnValue({ categories: [], levels: [] }),
  filterQuizzes: vi.fn().mockReturnValue([]),
}));

describe('App — Routing, Auth & Sign Out Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders landing page when user is not authenticated', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ancient wisdom/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start your journey/i })).toBeInTheDocument();
    });
  });

  it('redirects to /quiz/:slug after login if pendingQuizSlug is in sessionStorage', async () => {
    window.sessionStorage.setItem('pendingQuizSlug', 'jnana');

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: 'user-123', email: 'devotee@soulsync.dev' });
      return () => {};
    });

    mockResolveAuthSession.mockResolvedValueOnce({
      uid: 'user-123',
      email: 'devotee@soulsync.dev',
      role: 'USER',
      status: 'ACTIVE',
    });

    render(<App />);

    await waitFor(() => {
      expect(window.sessionStorage.getItem('pendingQuizSlug')).toBeNull();
      expect(window.location.pathname).toBe('/quiz/jnana');
    });
  });
});
