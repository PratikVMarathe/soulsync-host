import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNoticeProvider } from '../context/AppNoticeContext';
import ChallengeCard from './ChallengeCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockSignInWithPopup = vi.fn();
vi.mock('firebase/auth', () => ({
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  signOut: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

const mockQuiz = {
  id: 'quiz-1',
  title: 'Concept 10: Jnana',
  slug: 'jnana',
  description: 'Understand the essence of spiritual knowledge and devotion.',
  category: 'Wisdom',
  level: 'BEGINNER',
  totalQuestions: 10,
  timeLimitLabel: '10 mins',
  status: 'ACTIVE',
  userAttempt: {
    status: 'NOT_STARTED',
    resumeQuestionIndex: 0,
  },
};

function renderCard(props = {}) {
  return render(
    <AppNoticeProvider>
      <ChallengeCard quiz={mockQuiz} {...props} />
    </AppNoticeProvider>,
  );
}

describe('ChallengeCard — Public Access Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('renders concept details and "Start Concept" button', () => {
    renderCard();

    expect(screen.getByText('Jnana')).toBeInTheDocument();
    expect(screen.getByText('Understand the essence of spiritual knowledge and devotion.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start concept/i })).toBeInTheDocument();
  });

  it('navigates directly to /quiz/:slug when clicking Start Concept for any visitor', async () => {
    const user = userEvent.setup();
    renderCard();

    const startBtn = screen.getByRole('button', { name: /start concept/i });
    await user.click(startBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/quiz/jnana');
  });
});
