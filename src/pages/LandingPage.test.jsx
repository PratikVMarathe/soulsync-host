import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNoticeProvider } from '../context/AppNoticeContext';
import LandingPage from './LandingPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders clean header and hero actions with "Find Your Quiz"', async () => {
    const user = userEvent.setup();
    render(
      <AppNoticeProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AppNoticeProvider>,
    );

    expect(screen.getAllByRole('button', { name: /sign in/i })[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start your journey/i })).toBeInTheDocument();

    const findQuizBtn = screen.getByRole('button', { name: /find your quiz/i });
    expect(findQuizBtn).toBeInTheDocument();

    // Ensure removed placeholder links are not present
    expect(screen.queryByRole('button', { name: 'Courses' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Wisdom' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'About' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Trusted by learners seeking clarity/i)).not.toBeInTheDocument();

    await user.click(findQuizBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/quiz');
  });
});
