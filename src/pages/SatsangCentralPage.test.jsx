import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SatsangCentralPage from './SatsangCentralPage';

const mockOpportunities = [
  {
    id: 'opp-with-all-social',
    title: 'Bhagavad Gita Wisdom Class',
    category: 'CLASS',
    status: 'ACTIVE',
    description: 'Weekly in-depth Gita study.',
    location: 'Temple Room 1',
    meetingLink: 'https://zoom.us/j/123456',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/gita.jpg',
    socialLinks: {
      whatsapp: 'https://chat.whatsapp.com/GitaGroup',
      instagram: 'https://instagram.com/soulsync_gita',
      youtube: 'https://youtube.com/@soulsync_live',
      facebook: 'https://facebook.com/soulsync_community',
      telegram: 'https://t.me/soulsync_gita',
    },
    startAt: { seconds: 1700000000 },
  },
  {
    id: 'opp-no-social',
    title: 'Janmashtami Maha Festival',
    category: 'FESTIVAL',
    status: 'ACTIVE',
    description: 'Grand celebration.',
    location: 'Main Sanctuary',
    socialLinks: {
      whatsapp: '',
      instagram: '',
      youtube: '',
      facebook: '',
      telegram: '',
    },
    startAt: { seconds: 1700001000 },
  },
];

const mockLoadActiveSatsangOpportunities = vi.fn();
const mockLoadUserInterestRequests = vi.fn();
const mockSubmitInterestRequest = vi.fn();

vi.mock('../services/satsangCentralService', () => ({
  loadActiveSatsangOpportunities: () => mockLoadActiveSatsangOpportunities(),
  loadUserInterestRequests: (...args) => mockLoadUserInterestRequests(...args),
  submitInterestRequest: (...args) => mockSubmitInterestRequest(...args),
}));

const mockUser = {
  uid: 'user-456',
  email: 'devotee@soulsync.dev',
  name: 'Devotee User',
  phoneNumber: '9876543210',
};

function renderPage(props = {}) {
  const defaultProps = {
    onUserChange: vi.fn(),
    user: mockUser,
    ...props,
  };

  return {
    ...render(
      <BrowserRouter>
        <SatsangCentralPage {...defaultProps} />
      </BrowserRouter>,
    ),
    props: defaultProps,
  };
}

describe('SatsangCentralPage — Social Media & View Details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadActiveSatsangOpportunities.mockResolvedValue(mockOpportunities);
    mockLoadUserInterestRequests.mockResolvedValue([]);
  });

  it('renders opportunity cards with social media buttons', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();
      expect(screen.getByText('Janmashtami Maha Festival')).toBeInTheDocument();
    });

    // WhatsApp shows "Join WhatsApp" text and links to chat.whatsapp.com
    const whatsappLink = screen.getByRole('link', { name: /join whatsapp/i });
    expect(whatsappLink).toBeInTheDocument();
    expect(whatsappLink).toHaveAttribute('href', 'https://chat.whatsapp.com/GitaGroup');
    expect(whatsappLink).toHaveAttribute('target', '_blank');
    expect(whatsappLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Instagram, YouTube, Facebook, Telegram links
    expect(screen.getByRole('link', { name: /open instagram/i })).toHaveAttribute(
      'href',
      'https://instagram.com/soulsync_gita',
    );
    expect(screen.getByRole('link', { name: /watch on youtube/i })).toHaveAttribute(
      'href',
      'https://youtube.com/@soulsync_live',
    );
    expect(screen.getByRole('link', { name: /open facebook/i })).toHaveAttribute(
      'href',
      'https://facebook.com/soulsync_community',
    );
    expect(screen.getByRole('link', { name: /join telegram/i })).toHaveAttribute(
      'href',
      'https://t.me/soulsync_gita',
    );

    // Festival opportunity without social links has no social links rendered
    const festivalCard = screen.getByText('Janmashtami Maha Festival').closest('.satsang-card');
    expect(festivalCard.querySelectorAll('.satsang-card-social-actions a')).toHaveLength(0);
  });

  it('renders "View Details" button instead of "I\'m Interested" if user already submitted interest', async () => {
    mockLoadUserInterestRequests.mockResolvedValueOnce([
      {
        id: 'req-1',
        satsangCentralId: 'opp-with-all-social',
        userId: 'user-456',
        email: 'devotee@soulsync.dev',
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();
    });

    const gitaCard = screen.getByText('Bhagavad Gita Wisdom Class').closest('.satsang-card');
    expect(gitaCard.querySelector('.satsang-btn-view-details')).toBeInTheDocument();
    expect(gitaCard.querySelector('.satsang-btn-interest')).not.toBeInTheDocument();

    const festivalCard = screen.getByText('Janmashtami Maha Festival').closest('.satsang-card');
    expect(festivalCard.querySelector('.satsang-btn-interest')).toBeInTheDocument();
    expect(festivalCard.querySelector('.satsang-btn-view-details')).not.toBeInTheDocument();
  });

  it('opens View Details modal when clicking "View Details" button', async () => {
    mockLoadUserInterestRequests.mockResolvedValueOnce([
      {
        id: 'req-1',
        satsangCentralId: 'opp-with-all-social',
        userId: 'user-456',
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /view details/i }));

    // Details modal dialog is open
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Weekly in-depth Gita study.')).toBeInTheDocument();
    expect(within(dialog).getByText('Join Online Meeting')).toBeInTheDocument();
    expect(within(dialog).getByText('Connect with us')).toBeInTheDocument();

    // Close modal
    const closeBtn = within(dialog).getByRole('button', { name: 'Close modal' });
    await user.click(closeBtn);
  });

  it('submitting interest displays Thank You view with the selected opportunity\'s social links', async () => {
    mockSubmitInterestRequest.mockResolvedValueOnce(mockUser);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const gitaCard = screen.getByText('Bhagavad Gita Wisdom Class').closest('.satsang-card');
    const interestBtn = gitaCard.querySelector('.satsang-btn-interest');
    await user.click(interestBtn);

    // Form modal opens
    expect(screen.getByText('Express Interest')).toBeInTheDocument();

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit interest/i }));

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
      expect(screen.getByText('Connect with us')).toBeInTheDocument();
    });

    // The card now switches to "View Details" after closing
    await user.click(screen.getByRole('button', { name: 'Close modal' }));

    await waitFor(() => {
      const updatedCard = screen.getByText('Bhagavad Gita Wisdom Class').closest('.satsang-card');
      expect(updatedCard.querySelector('.satsang-btn-view-details')).toBeInTheDocument();
    });
  });

  it('submitting interest for opportunity without social links displays Thank You view without social links', async () => {
    mockSubmitInterestRequest.mockResolvedValueOnce(mockUser);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Janmashtami Maha Festival')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const festivalCard = screen.getByText('Janmashtami Maha Festival').closest('.satsang-card');
    const interestBtn = festivalCard.querySelector('.satsang-btn-interest');
    await user.click(interestBtn);

    await user.click(screen.getByRole('button', { name: /submit interest/i }));

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
      expect(screen.queryByText('Connect with us')).not.toBeInTheDocument();
    });
  });
});
