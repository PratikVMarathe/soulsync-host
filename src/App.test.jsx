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

describe('App — Routing & Public User Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders dashboard directly when visitor is not signed in', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome to soulsync/i })).toBeInTheDocument();
      expect(screen.getByText(/daily spark/i)).toBeInTheDocument();
    });
  });

  it('renders admin login gate when navigating to /admin/* unauthenticated', async () => {
    window.history.pushState({}, '', '/admin/quizzes');

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /soulsync admin portal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    });
  });
});
