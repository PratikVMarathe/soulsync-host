import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppIcon from '../components/AppIcon';
import { getActiveSocialLinks } from '../constants/socialMedia';
import {
  loadActiveSatsangOpportunities,
  loadUserInterestRequests,
  submitInterestRequest,
} from '../services/satsangCentralService';
import { normalizePhoneNumber } from '../utils/identity';

const CATEGORY_CONFIG = {
  CLASS: { key: 'CLASS', label: 'Class', icon: 'book' },
  EVENT: { key: 'EVENT', label: 'Event', icon: 'spark' },
  FESTIVAL: { key: 'FESTIVAL', label: 'Festival', icon: 'lotus' },
};

function formatTimestampRange(startAt, endAt) {
  if (!startAt) return '';

  const startDate = startAt.toDate ? startAt.toDate() : new Date(startAt.seconds * 1000);
  if (Number.isNaN(startDate.getTime())) return '';

  const dateStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (!endAt) {
    return `${dateStr} at ${timeStr}`;
  }

  const endDate = endAt.toDate ? endAt.toDate() : new Date(endAt.seconds * 1000);
  if (Number.isNaN(endDate.getTime())) {
    return `${dateStr} at ${timeStr}`;
  }

  const endTimeStr = endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateStr}, ${timeStr} - ${endTimeStr}`;
}

export default function SatsangCentralPage({ onUserChange, user }) {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [userInterestedIds, setUserInterestedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBackButton, setShowBackButton] = useState(false);

  // Modals State
  const [activeOpportunity, setActiveOpportunity] = useState(null);
  const [viewDetailsOpportunity, setViewDetailsOpportunity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    description: '',
  });
  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const hasPhoneInProfile = Boolean(normalizePhoneNumber(user?.phoneNumber));

  useEffect(() => {
    let ignore = false;

    const fetchOpportunitiesAndInterests = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, userRequests] = await Promise.all([
          loadActiveSatsangOpportunities(),
          user?.uid ? loadUserInterestRequests(user.uid) : Promise.resolve([]),
        ]);
        if (!ignore) {
          setOpportunities(data);
          if (userRequests) {
            const interestedSet = new Set(userRequests.map((r) => r.satsangCentralId));
            setUserInterestedIds(interestedSet);
          }
        }
      } catch (err) {
        console.error('Failed to load Satsang opportunities:', err);
        if (!ignore) {
          setError('Failed to load opportunities. Please try again later.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchOpportunitiesAndInterests();

    return () => {
      ignore = true;
    };
  }, [user?.uid]);

  // 3-second timer for Back to Dashboard button
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBackButton(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenInterestModal = useCallback((opportunity) => {
    setActiveOpportunity(opportunity);
    setFormData({
      name: user?.displayName || user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      description: '',
    });
    setPhoneError('');
    setFormError('');
    setIsSuccess(false);
  }, [user]);

  const handleCloseModal = useCallback(() => {
    setActiveOpportunity(null);
    setPhoneError('');
    setFormError('');
    setIsSuccess(false);
  }, []);

  const handleOpenDetailsModal = useCallback((opportunity) => {
    setViewDetailsOpportunity(opportunity);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setViewDetailsOpportunity(null);
  }, []);

  const handleSubmitInterest = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setFormError('');

    const cleanPhone = normalizePhoneNumber(formData.phoneNumber);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await submitInterestRequest({
        user,
        opportunity: activeOpportunity,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        description: formData.description,
      });

      if (updatedUser && typeof onUserChange === 'function') {
        onUserChange(updatedUser);
      }

      if (activeOpportunity?.id) {
        setUserInterestedIds((prev) => new Set([...prev, activeOpportunity.id]));
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to submit interest request:', err);
      if (err.code === 'phone-registered' || err.message?.includes('already registered')) {
        setPhoneError('This phone number is already registered.');
      } else {
        setFormError(err.message || 'Failed to submit interest request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedOpportunities = useMemo(() => {
    const groups = {
      CLASS: [],
      EVENT: [],
      FESTIVAL: [],
    };

    opportunities.forEach((opp) => {
      const cat = (opp.category || 'CLASS').toUpperCase();
      if (groups[cat]) {
        groups[cat].push(opp);
      } else {
        groups.CLASS.push(opp);
      }
    });

    return groups;
  }, [opportunities]);

  return (
    <div className="satsang-central-page">
      {/* 3-Second Timer Back Button - Desktop Floating Top Right */}
      {showBackButton && (
        <button
          className="satsang-back-btn-desktop fade-in"
          onClick={() => navigate('/')}
          type="button"
        >
          <AppIcon name="arrowLeft" size={18} />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* Hero Header */}
      <header className="satsang-central-hero">
        <span className="satsang-badge">
          <AppIcon name="lotus" size={20} />
          Satsang Central
        </span>
        <h1>Hari Smṛti Mandala</h1>
        <p>
          Explore ongoing classes, sacred events, and upcoming festivals to deepen your spiritual journey with ISKCON.
        </p>
      </header>

      {/* Main Content */}
      {loading ? (
        <div className="app-loading-screen">Loading opportunities...</div>
      ) : error ? (
        <div className="satsang-error-box">{error}</div>
      ) : (
        <div className="satsang-sections-container">
          {Object.keys(CATEGORY_CONFIG).map((categoryKey) => {
            const config = CATEGORY_CONFIG[categoryKey];
            const items = groupedOpportunities[categoryKey] || [];

            if (items.length === 0) return null;

            return (
              <section className="satsang-category-section" key={categoryKey}>
                <div className="satsang-category-header">
                  <AppIcon name={config.icon} size={22} />
                  <h2>{config.label}</h2>
                  <span className="satsang-count-chip">{items.length}</span>
                </div>

                <div className="satsang-cards-grid">
                  {items.map((opp) => {
                    const timeRange = formatTimestampRange(opp.startAt, opp.endAt);

                    return (
                      <article className="satsang-card" key={opp.id}>
                        {/* Flexible UI: Only show image container if imageUrl is present */}
                        {opp.imageUrl ? (
                          <div className="satsang-card-image">
                            <img
                              alt={opp.imageAlt || opp.title}
                              onError={(e) => {
                                e.currentTarget.parentElement.style.display = 'none';
                              }}
                              referrerPolicy="no-referrer"
                              src={opp.imageUrl}
                            />
                          </div>
                        ) : null}

                        <div className="satsang-card-content">
                          <span className="satsang-card-category-tag">
                            {opp.category}
                          </span>

                          <h3 className="satsang-card-title">{opp.title}</h3>

                          {/* Flexible UI: Only render description if non-empty */}
                          {opp.description ? (
                            <p className="satsang-card-desc">{opp.description}</p>
                          ) : null}

                          {/* Flexible UI: Details list - render date/time & location if present */}
                          {(timeRange || opp.location || opp.meetingLink) ? (
                            <div className="satsang-card-meta">
                              {timeRange ? (
                                <div className="satsang-meta-item">
                                  <AppIcon name="clock" size={16} />
                                  <span>{timeRange}</span>
                                </div>
                              ) : null}

                              {opp.location ? (
                                <div className="satsang-meta-item">
                                  <AppIcon name="location" size={16} />
                                  <span>{opp.location}</span>
                                </div>
                              ) : opp.meetingLink ? (
                                <div className="satsang-meta-item">
                                  <AppIcon name="location" size={16} />
                                  <a href={opp.meetingLink} target="_blank" rel="noopener noreferrer">
                                    Join Online Meeting
                                  </a>
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="satsang-card-actions">
                            {userInterestedIds.has(opp.id) ? (
                              <button
                                className="satsang-btn-view-details"
                                onClick={() => handleOpenDetailsModal(opp)}
                                type="button"
                              >
                                <AppIcon name="book" size={18} />
                                <span className="satsang-btn-label">View Details</span>
                              </button>
                            ) : (
                              <button
                                className="satsang-btn-interest"
                                onClick={() => handleOpenInterestModal(opp)}
                                type="button"
                              >
                                <AppIcon name="heart" size={18} />
                                <span className="satsang-btn-label">I&apos;m Interested</span>
                              </button>
                            )}

                            {getActiveSocialLinks(opp.socialLinks).length > 0 ? (
                              <div className="satsang-card-social-actions">
                                {getActiveSocialLinks(opp.socialLinks).map((link) => (
                                  <a
                                    aria-label={link.ariaLabel}
                                    className={link.isPrimarySpecial ? 'satsang-social-whatsapp-btn' : 'satsang-social-icon-btn'}
                                    href={link.url}
                                    key={link.platform}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    title={link.actionLabel}
                                  >
                                    <AppIcon name={link.icon} size={18} />
                                    {link.isPrimarySpecial ? <span>Join WhatsApp</span> : null}
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 3-Second Timer Back Button - Mobile Fixed Bottom */}
      {showBackButton && (
        <button
          className="satsang-back-btn-mobile slide-up"
          onClick={() => navigate('/')}
          type="button"
        >
          <AppIcon name="arrowLeft" size={18} />
          <span>Back to Dashboard</span>
        </button>
      )}

      {/* View Details Modal */}
      {viewDetailsOpportunity ? (
        <div className="satsang-modal-backdrop" onClick={handleCloseDetailsModal}>
          <div
            aria-modal="true"
            className="satsang-modal-dialog satsang-details-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close modal"
              className="satsang-modal-close"
              onClick={handleCloseDetailsModal}
              type="button"
            >
              <AppIcon name="x" size={20} />
            </button>

            <div className="satsang-modal-header">
              <span className="satsang-modal-badge">{viewDetailsOpportunity.category}</span>
              <h2>{viewDetailsOpportunity.title}</h2>
            </div>

            {viewDetailsOpportunity.imageUrl ? (
              <div className="satsang-details-image">
                <img
                  alt={viewDetailsOpportunity.imageAlt || viewDetailsOpportunity.title}
                  onError={(e) => {
                    e.currentTarget.parentElement.style.display = 'none';
                  }}
                  referrerPolicy="no-referrer"
                  src={viewDetailsOpportunity.imageUrl}
                />
              </div>
            ) : null}

            {viewDetailsOpportunity.description ? (
              <p className="satsang-details-desc">{viewDetailsOpportunity.description}</p>
            ) : null}

            <div className="satsang-details-meta-list">
              {formatTimestampRange(viewDetailsOpportunity.startAt, viewDetailsOpportunity.endAt) ? (
                <div className="satsang-meta-item">
                  <AppIcon name="clock" size={18} />
                  <span>{formatTimestampRange(viewDetailsOpportunity.startAt, viewDetailsOpportunity.endAt)}</span>
                </div>
              ) : null}

              {viewDetailsOpportunity.location ? (
                <div className="satsang-meta-item">
                  <AppIcon name="location" size={18} />
                  <span>{viewDetailsOpportunity.location}</span>
                </div>
              ) : null}

              {viewDetailsOpportunity.meetingLink ? (
                <div className="satsang-meta-item">
                  <AppIcon name="spark" size={18} />
                  <a
                    href={viewDetailsOpportunity.meetingLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Join Online Meeting
                  </a>
                </div>
              ) : null}
            </div>

            {getActiveSocialLinks(viewDetailsOpportunity.socialLinks).length > 0 ? (
              <div className="satsang-connect-section">
                <h4>Connect with us</h4>
                <div className="satsang-social-actions-group">
                  {getActiveSocialLinks(viewDetailsOpportunity.socialLinks).map((link) => (
                    <a
                      aria-label={link.ariaLabel}
                      className={link.isPrimarySpecial ? 'satsang-social-whatsapp-btn' : 'satsang-social-icon-btn'}
                      href={link.url}
                      key={link.platform}
                      rel="noopener noreferrer"
                      target="_blank"
                      title={link.actionLabel}
                    >
                      <AppIcon name={link.icon} size={18} />
                      {link.isPrimarySpecial ? <span>Join WhatsApp</span> : null}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="satsang-modal-footer">
              <button
                className="satsang-btn-primary"
                onClick={handleCloseDetailsModal}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Interest Form Modal */}
      {activeOpportunity ? (
        <div className="satsang-modal-backdrop" onClick={handleCloseModal}>
          <div
            aria-modal="true"
            className="satsang-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close modal"
              className="satsang-modal-close"
              onClick={handleCloseModal}
              type="button"
            >
              <AppIcon name="x" size={20} />
            </button>

            {isSuccess ? (
              <div className="satsang-success-view">
                <div className="satsang-success-icon">
                  <AppIcon name="check" size={32} />
                </div>
                <h2>Thank you!</h2>
                {getActiveSocialLinks(activeOpportunity?.socialLinks).length > 0 ? (
                  <>
                    <p>We have received your request.</p>
                    <p className="satsang-success-sub">Our devotee will contact you soon.</p>
                    <div className="satsang-connect-section">
                      <h4>Connect with us</h4>
                      <div className="satsang-social-actions-group">
                        {getActiveSocialLinks(activeOpportunity.socialLinks).map((link) => (
                          <a
                            aria-label={link.ariaLabel}
                            className={link.isPrimarySpecial ? 'satsang-social-whatsapp-btn' : 'satsang-social-icon-btn'}
                            href={link.url}
                            key={link.platform}
                            rel="noopener noreferrer"
                            target="_blank"
                            title={link.actionLabel}
                          >
                            <AppIcon name={link.icon} size={18} />
                            {link.isPrimarySpecial ? <span>Join WhatsApp</span> : null}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Your interest has been recorded.</p>
                    <p className="satsang-success-sub">We will connect with you soon.</p>
                  </>
                )}
                <button
                  className="satsang-btn-primary"
                  onClick={handleCloseModal}
                  type="button"
                >
                  Close
                </button>
              </div>
            ) : (
              <form className="satsang-interest-form" onSubmit={handleSubmitInterest}>
                <div className="satsang-modal-header">
                  <span className="satsang-modal-badge">{activeOpportunity.category}</span>
                  <h2>Express Interest</h2>
                  <p><strong>{activeOpportunity.title}</strong></p>
                </div>

                {formError ? <div className="satsang-form-alert">{formError}</div> : null}

                <div className="satsang-form-group">
                  <label htmlFor="interest-name">Name</label>
                  <input
                    id="interest-name"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    type="text"
                    value={formData.name}
                  />
                </div>

                <div className="satsang-form-group">
                  <label htmlFor="interest-email">Email</label>
                  <input
                    disabled
                    id="interest-email"
                    type="email"
                    value={formData.email}
                  />
                  <small className="satsang-input-help">Email cannot be changed.</small>
                </div>

                <div className="satsang-form-group">
                  <label htmlFor="interest-phone">
                    Phone Number {!hasPhoneInProfile ? <span className="satsang-required">*</span> : null}
                  </label>
                  <input
                    className={phoneError ? 'is-invalid' : ''}
                    id="interest-phone"
                    onChange={(e) => {
                      setFormData({ ...formData, phoneNumber: e.target.value });
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="10-digit mobile number"
                    required
                    type="tel"
                    value={formData.phoneNumber}
                  />
                  {phoneError ? (
                    <span className="satsang-field-error">{phoneError}</span>
                  ) : (
                    <small className="satsang-input-help">Required to connect with you regarding this activity.</small>
                  )}
                </div>

                <div className="satsang-form-group">
                  <label htmlFor="interest-desc">Description (Optional)</label>
                  <textarea
                    id="interest-desc"
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Share any questions or notes for the devotee lead..."
                    rows={3}
                    value={formData.description}
                  />
                </div>

                <div className="satsang-modal-footer">
                  <button
                    className="satsang-btn-secondary"
                    onClick={handleCloseModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="satsang-btn-primary"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Interest'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
