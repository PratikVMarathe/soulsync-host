import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppSidebar from './AppSidebar';

const mockUser = {
  displayName: 'Arjun Devotee',
  email: 'arjun@soulsync.dev',
};

function renderSidebar(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppSidebar user={mockUser} />
    </MemoryRouter>,
  );
}

describe('AppSidebar — Mobile Bottom Navigation Visibility', () => {
  it('displays bottom navigation bar on Home / Dashboard route', () => {
    renderSidebar('/');

    const bottomNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).not.toHaveClass('is-hidden');
    expect(bottomNav).not.toHaveAttribute('aria-hidden');

    const homeButton = screen.getAllByRole('button', { name: /home/i });
    expect(homeButton.length).toBeGreaterThan(0);
  });

  it('displays bottom navigation bar on Quiz Library route (/quiz)', () => {
    renderSidebar('/quiz');

    const bottomNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).not.toHaveClass('is-hidden');
    expect(bottomNav).not.toHaveAttribute('aria-hidden');
  });

  it('displays bottom navigation bar on Profile route (/profile)', () => {
    renderSidebar('/profile');

    const bottomNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).not.toHaveClass('is-hidden');
    expect(bottomNav).not.toHaveAttribute('aria-hidden');
  });

  it('hides mobile bottom navigation during Quiz Attempt & Result (/quiz/:quizId)', () => {
    renderSidebar('/quiz/concept-1-focus');

    // The nav is hidden using is-hidden class and aria-hidden="true"
    const bottomNav = document.querySelector('.app-bottom-nav');
    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).toHaveClass('is-hidden');
    expect(bottomNav).toHaveAttribute('aria-hidden', 'true');

    // Desktop sidebar remains unaffected and accessible
    const desktopAside = screen.getByRole('complementary', { name: /primary navigation/i });
    expect(desktopAside).toBeInTheDocument();
  });

  it('hides mobile bottom navigation on Satsang Central route (/satsang-central)', () => {
    renderSidebar('/satsang-central');

    const bottomNav = document.querySelector('.app-bottom-nav');
    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).toHaveClass('is-hidden');
    expect(bottomNav).toHaveAttribute('aria-hidden', 'true');

    // Desktop sidebar remains unaffected and accessible
    const desktopAside = screen.getByRole('complementary', { name: /primary navigation/i });
    expect(desktopAside).toBeInTheDocument();
  });
});
