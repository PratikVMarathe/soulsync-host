import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
    classDetails: {
      availableModes: ['ONLINE', 'OFFLINE'],
      availableLanguages: ['ENGLISH', 'HINDI'],
      availableDays: ['SATURDAY', 'SUNDAY', 'MONDAY', 'WEDNESDAY'],
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
  displayName: 'Devotee User',
  phoneNumber: '9876543210',
};

function renderPage(props = {}, routerState = null) {
  const defaultProps = {
    onUserChange: vi.fn(),
    user: mockUser,
    ...props,
  };

  const initialEntries = routerState
    ? [{ pathname: '/satsang-central', state: routerState }]
    : ['/satsang-central'];

  return {
    ...render(
      <MemoryRouter initialEntries={initialEntries}>
        <SatsangCentralPage {...defaultProps} />
      </MemoryRouter>,
    ),
    props: defaultProps,
  };
}

describe('SatsangCentralPage — Prompt Flow, Interest Form & Social Media', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadActiveSatsangOpportunities.mockResolvedValue(mockOpportunities);
    mockLoadUserInterestRequests.mockResolvedValue([]);
  });

  it('renders opportunity cards with social media buttons and class feature pills', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();
      expect(screen.getByText('Janmashtami Maha Festival')).toBeInTheDocument();
    });

    // Check class feature pills for Bhagavad Gita Wisdom Class
    expect(screen.getByText('Online, Offline')).toBeInTheDocument();
    expect(screen.getByText('English, Hindi')).toBeInTheDocument();
    expect(screen.getByText('Sat, Sun, Mon, Wed')).toBeInTheDocument();

    const whatsappLink = screen.getByRole('link', { name: /join whatsapp/i });
    expect(whatsappLink).toBeInTheDocument();
    expect(whatsappLink).toHaveAttribute('href', 'https://chat.whatsapp.com/GitaGroup');

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
  });

  it('immediately shows Bhagavad Gita prompt when arriving from Continue Your Journey flow', async () => {
    renderPage({}, { fromQuizJourney: true });

    await waitFor(() => {
      expect(screen.getByText(/we are having bhagavad gita class/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yes, i'm interested/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no, maybe later/i })).toBeInTheDocument();
    });

    // Clicking "Yes, I'm Interested" opens the Interest Form
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /yes, i'm interested/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Express Interest')).toBeInTheDocument();
    expect(within(dialog).getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();
  });

  it('closes prompt and continues to Satsang Central when clicking "No, Maybe Later"', async () => {
    renderPage({}, { fromQuizJourney: true });

    await waitFor(() => {
      expect(screen.getByText(/we are having bhagavad gita class/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /no, maybe later/i }));

    // Prompt closed, Satsang Central cards visible
    expect(screen.queryByText(/we are having bhagavad gita class/i)).not.toBeInTheDocument();
    expect(screen.getByText('Bhagavad Gita Wisdom Class')).toBeInTheDocument();
  });

  it('renders "View Details" button and opens View Details modal with class offerings & schedule', async () => {
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
    const viewDetailsBtn = gitaCard.querySelector('.satsang-btn-view-details');
    expect(viewDetailsBtn).toBeInTheDocument();
    expect(gitaCard.querySelector('.satsang-btn-interest')).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(viewDetailsBtn);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Class Offerings & Schedule')).toBeInTheDocument();
    expect(within(dialog).getByText('Available Modes')).toBeInTheDocument();
    expect(within(dialog).getByText('Available Languages')).toBeInTheDocument();
    expect(within(dialog).getByText('Available Days')).toBeInTheDocument();
  });

  it('validates fields and submits interest request with dynamic configured options', async () => {
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
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Express Interest')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Email/i)).toBeDisabled();

    // Verify modal availability summary
    expect(within(dialog).getByText('Available Modes:')).toBeInTheDocument();
    expect(within(dialog).getByText('Available Languages:')).toBeInTheDocument();
    expect(within(dialog).getByText('Available Days:')).toBeInTheDocument();

    // Fill in required fields
    const ageInput = within(dialog).getByLabelText(/^Age/i);
    await user.type(ageInput, '24');

    const institutionInput = within(dialog).getByLabelText(/college \/ institution name/i);
    await user.type(institutionInput, 'Pune University');

    // Switch passion to PROFESSIONAL -> check label change
    const passionSelect = within(dialog).getByLabelText(/^Passion/i);
    await user.selectOptions(passionSelect, 'PROFESSIONAL');
    expect(within(dialog).getByLabelText(/organization \/ company name/i)).toBeInTheDocument();

    // Select configured day: MONDAY
    const daySelect = within(dialog).getByLabelText(/^Preferred Day/i);
    await user.selectOptions(daySelect, 'MONDAY');

    // Submit form
    await user.click(within(dialog).getByRole('button', { name: /submit interest/i }));

    await waitFor(() => {
      expect(mockSubmitInterestRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Devotee User',
          email: 'devotee@soulsync.dev',
          phoneNumber: '9876543210',
          age: 24,
          passion: 'PROFESSIONAL',
          mode: 'ONLINE',
          language: 'ENGLISH',
          preferredDay: 'MONDAY',
        }),
      );
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
    });
  });
});
