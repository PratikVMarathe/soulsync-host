import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNoticeProvider } from '../context/AppNoticeContext';
import QuizLibraryPage from './QuizLibraryPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockQuizzes = [
  {
    id: 'quiz-1',
    title: 'Concept 1: Focus',
    slug: 'focus',
    description: 'Learn focused attention and single-minded dedication.',
    category: 'Meditation',
    level: 'BEGINNER',
    totalQuestions: 5,
    status: 'ACTIVE',
  },
  {
    id: 'quiz-2',
    title: 'Concept 2: Karma',
    slug: 'karma',
    description: 'Discover the law of action and reaction.',
    category: 'Philosophy',
    level: 'INTERMEDIATE',
    totalQuestions: 8,
    status: 'ACTIVE',
  },
];

const mockLoadAvailableQuizzes = vi.fn();
vi.mock('../services/quizCatalogService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    loadAvailableQuizzes: (...args) => mockLoadAvailableQuizzes(...args),
  };
});

function renderPage(props = {}) {
  return render(
    <AppNoticeProvider>
      <QuizLibraryPage {...props} />
    </AppNoticeProvider>,
  );
}

describe('QuizLibraryPage — Public Browsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAvailableQuizzes.mockResolvedValue(mockQuizzes);
  });

  it('allows unauthenticated users (user = null) to browse all active quizzes', async () => {
    renderPage({ user: null });

    expect(screen.getByText(/Loading your concepts/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Focus')).toBeInTheDocument();
      expect(screen.getByText('Karma')).toBeInTheDocument();
    });

    expect(mockLoadAvailableQuizzes).toHaveBeenCalledWith(null);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Visible quizzes')).toBeInTheDocument();
  });
});
