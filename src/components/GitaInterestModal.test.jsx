import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GitaInterestModal from './GitaInterestModal';
import * as satsangCentralService from '../services/satsangCentralService';

vi.mock('../services/satsangCentralService', () => ({
  submitInterestRequest: vi.fn(),
}));

describe('GitaInterestModal Component', () => {
  const mockOpportunity = {
    id: 'opp-gita-1',
    title: 'Bhagavad Gita Wisdom Class',
    category: 'CLASS',
    classDetails: {
      availableModes: ['ONLINE', 'OFFLINE'],
      availableLanguages: ['ENGLISH', 'HINDI'],
      availableDays: ['SATURDAY', 'SUNDAY'],
    },
    socialLinks: {},
  };

  const mockUser = {
    uid: 'user-123',
    displayName: 'Pratik Marathe',
    email: 'pratik@example.com',
    phoneNumber: '9876543210',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with class satsang-modal-dialog and pre-fills user info', () => {
    render(
      <GitaInterestModal
        isOpen
        onClose={vi.fn()}
        opportunity={mockOpportunity}
        user={mockUser}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('satsang-modal-dialog');
    expect(screen.getByText('Express Interest')).toBeInTheDocument();
    expect(screen.getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/^name/i);
    expect(nameInput).toHaveValue('Pratik Marathe');

    const phoneInput = screen.getByLabelText(/phone number/i);
    expect(phoneInput).toHaveValue('9876543210');
  });

  it('submits form successfully and displays confirmation view', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    satsangCentralService.submitInterestRequest.mockResolvedValueOnce({
      ...mockUser,
      phoneNumber: '9876543210',
    });

    render(
      <GitaInterestModal
        isOpen
        onClose={handleClose}
        onSuccess={handleSuccess}
        opportunity={mockOpportunity}
        user={mockUser}
      />
    );

    // Fill in required Age and College/Institution
    const ageInput = screen.getByLabelText(/^age/i);
    await user.type(ageInput, '24');

    const instInput = screen.getByLabelText(/college \/ institution name/i);
    await user.type(instInput, 'ABC Engineering College');

    const submitBtn = screen.getByRole('button', { name: /submit interest/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(satsangCentralService.submitInterestRequest).toHaveBeenCalledTimes(1);
    });

    expect(satsangCentralService.submitInterestRequest).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Pratik Marathe',
      email: 'pratik@example.com',
      phoneNumber: '9876543210',
      age: 24,
      passion: 'STUDENT',
      institutionName: 'ABC Engineering College',
      mode: 'ONLINE',
      language: 'ENGLISH',
      preferredDay: 'SATURDAY',
    }));

    // Confirmation view should now be visible
    expect(screen.getByText('Thank you!')).toBeInTheDocument();
    expect(screen.getByText('Your interest has been recorded.')).toBeInTheDocument();
    expect(handleSuccess).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('hasRegisteredGitaClass')).toBe('true');

    // Clicking Close triggers onClose
    const closeBtn = screen.getByRole('button', { name: /^close$/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('handles cancel button click', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <GitaInterestModal
        isOpen
        onClose={handleClose}
        opportunity={mockOpportunity}
        user={mockUser}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
