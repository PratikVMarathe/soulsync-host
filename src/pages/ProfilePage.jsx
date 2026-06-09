import { useEffect, useMemo, useState } from 'react';
import AppIcon from '../components/AppIcon';
import { updateCurrentUserProfile } from '../services/sessionService';
import { formatRoleLabel } from '../utils/identity';

function formatDate(value) {
  if (!value) return 'Recently';

  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getInitials(user) {
  const source = user?.displayName || user?.email || 'SoulSync';

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function ProfilePage({ onUserChange, user }) {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [feedback, setFeedback] = useState({ error: '', success: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormState({
      name: user?.profile?.name || user?.displayName || '',
      email: user?.profile?.email || user?.email || '',
      phoneNumber: user?.profile?.phoneNumber || '',
    });
  }, [user]);

  const profile = user?.profile || {};
  const initials = getInitials(user);
  const canEditEmail = !profile.email;
  const canEditPhone = !profile.phoneNumber;
  const memberSince = useMemo(() => formatDate(profile.createdAt), [profile.createdAt]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
    setFeedback({ error: '', success: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ error: '', success: '' });

    try {
      const nextViewer = await updateCurrentUserProfile(formState);
      onUserChange(nextViewer);
      setFormState({
        name: nextViewer.profile?.name || nextViewer.displayName || '',
        email: nextViewer.profile?.email || nextViewer.email || '',
        phoneNumber: nextViewer.profile?.phoneNumber || '',
      });
      setFeedback({
        error: '',
        success: 'Your profile has been updated in SoulSync.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setFeedback({
        error: error?.publicMessage || 'We could not save your profile right now. Please try again.',
        success: '',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-identity-card">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-identity-copy">
            <span className="profile-eyebrow">Your Profile</span>
            <h1>{user?.displayName || 'SoulSync Member'}</h1>
            <p>
              Keep your SoulSync details current so your learning journey and account access stay
              in sync.
            </p>

            <div className="profile-badge-row">
              <span className="profile-badge">
                <AppIcon name="profile" size={16} />
                {formatRoleLabel(user?.role)}
              </span>
              <span className="profile-badge is-soft">
                <AppIcon name="lotus" size={16} />
                {user?.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-summary-grid">
          <article className="profile-summary-card">
            <span>Member Since</span>
            <strong>{memberSince}</strong>
          </article>
          <article className="profile-summary-card">
            <span>Sign-In Provider</span>
            <strong>Google</strong>
          </article>
          {/* <article className="profile-summary-card">
            <span>Phone Status</span>
            <strong>{profile.phoneNumber ? 'Locked' : 'Can be set once'}</strong>
          </article> */}
        </div>
      </section>

      <section className="dashboard-section profile-form-shell">
        <div className="section-heading">
          <div>
            <h2>Personal Details</h2>
            <p>
              You can update your name anytime. Email and phone become read-only after they are set.
            </p>
          </div>
        </div>

        {feedback.error ? (
          <div className="dashboard-state-card is-error">{feedback.error}</div>
        ) : null}

        {feedback.success ? (
          <div className="dashboard-state-card profile-success-card">{feedback.success}</div>
        ) : null}

        <form className="profile-form-grid" onSubmit={handleSubmit}>
          <label className="profile-field">
            <span>Full Name</span>
            <input
              name="name"
              onChange={handleChange}
              placeholder="Enter your full name"
              type="text"
              value={formState.name}
            />
            <small>This name appears across your SoulSync dashboard.</small>
          </label>

          <label className="profile-field">
            <span>Email Address</span>
            <input
              disabled={!canEditEmail}
              name="email"
              onChange={handleChange}
              placeholder="Google email"
              type="email"
              value={formState.email}
            />
            <small>
              {canEditEmail
                ? 'If this field is empty, you can set it once to match your Google account email.'
                : 'Email is locked after it is set.'}
            </small>
          </label>

          <label className="profile-field">
            <span>Phone Number</span>
            <input
              disabled={!canEditPhone}
              name="phoneNumber"
              onChange={handleChange}
              placeholder="Add phone number"
              type="tel"
              value={formState.phoneNumber}
            />
            <small>
              {canEditPhone
                ? 'You can add a phone number once. After that it becomes read-only.'
                : 'Phone number is locked after it is set.'}
            </small>
          </label>

          <div className="profile-readonly-grid">
            <article className="profile-readonly-card">
              <span>Role</span>
              <strong>{formatRoleLabel(user?.role)}</strong>
            </article>
            <article className="profile-readonly-card">
              <span>Status</span>
              <strong>{user?.status || 'ACTIVE'}</strong>
            </article>
          </div>

          <div className="profile-form-actions">
            <button className="primary-cta" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
