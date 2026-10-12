import { useState, useEffect } from 'react';
import AppIcon from './AppIcon';
import { getActiveSocialLinks } from '../constants/socialMedia';
import { submitInterestRequest } from '../services/satsangCentralService';
import { normalizePhoneNumber } from '../utils/identity';

const ALL_MODES_MAP = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
};

const ALL_LANGUAGES_MAP = {
  ENGLISH: 'English',
  HINDI: 'Hindi',
};

const ALL_DAYS_MAP = {
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
};

function formatModesList(modes) {
  if (!modes || !modes.length) return '';
  return modes.map((m) => ALL_MODES_MAP[m] || m).join(', ');
}

function formatLanguagesList(languages) {
  if (!languages || !languages.length) return '';
  return languages.map((l) => ALL_LANGUAGES_MAP[l] || l).join(', ');
}

function formatDaysFullList(days) {
  if (!days || !days.length) return '';
  return days.map((d) => ALL_DAYS_MAP[d] || d).join(', ');
}

const DEFAULT_GITA_OPPORTUNITY = {
  id: 'opp_gita_class',
  title: 'Bhagavad Gita Wisdom Class',
  category: 'CLASS',
  classDetails: {
    availableModes: ['ONLINE', 'OFFLINE'],
    availableLanguages: ['ENGLISH', 'HINDI'],
    availableDays: ['SATURDAY', 'SUNDAY'],
  },
};

export default function GitaInterestModal({
  isOpen,
  onClose,
  onSuccess,
  onUserChange,
  opportunity = DEFAULT_GITA_OPPORTUNITY,
  user,
}) {
  const activeOpp = opportunity || DEFAULT_GITA_OPPORTUNITY;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    age: '',
    passion: 'STUDENT',
    institutionName: '',
    mode: 'ONLINE',
    language: 'ENGLISH',
    dayOption: 'SATURDAY',
    customDay: '',
    description: '',
  });

  const [phoneError, setPhoneError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const availableModes = activeOpp?.classDetails?.availableModes?.length
      ? activeOpp.classDetails.availableModes
      : ['ONLINE', 'OFFLINE'];
    const availableLanguages = activeOpp?.classDetails?.availableLanguages?.length
      ? activeOpp.classDetails.availableLanguages
      : ['ENGLISH', 'HINDI'];
    const availableDays = activeOpp?.classDetails?.availableDays?.length
      ? activeOpp.classDetails.availableDays
      : ['SATURDAY', 'SUNDAY'];

    setFormData({
      name: user?.displayName || user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      age: '',
      passion: 'STUDENT',
      institutionName: '',
      mode: availableModes[0] || 'ONLINE',
      language: availableLanguages[0] || 'ENGLISH',
      dayOption: availableDays[0] || 'SATURDAY',
      customDay: '',
      description: '',
    });
    setPhoneError('');
    setFormError('');
    setIsSuccess(false);
  }, [activeOpp, isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setFormError('');

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setFormError('Name is required.');
      return;
    }

    const cleanPhone = normalizePhoneNumber(formData.phoneNumber);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.');
      return;
    }

    const parsedAge = parseInt(formData.age, 10);
    if (Number.isNaN(parsedAge) || parsedAge <= 0) {
      setFormError('Please enter a valid positive age.');
      return;
    }

    const cleanInstitution = formData.institutionName.trim();
    if (!cleanInstitution) {
      if (formData.passion === 'STUDENT') {
        setFormError('College / Institution Name is required.');
      } else if (formData.passion === 'PROFESSIONAL') {
        setFormError('Organization / Company Name is required.');
      } else {
        setFormError('Please provide what best describes you.');
      }
      return;
    }

    const preferredDay = formData.dayOption || formData.customDay;
    if (!preferredDay) {
      setFormError('Please select a preferred day.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await submitInterestRequest({
        user,
        opportunity: activeOpp,
        name: cleanName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        age: parsedAge,
        passion: formData.passion,
        institutionName: cleanInstitution,
        mode: formData.mode,
        language: formData.language,
        preferredDay,
        description: formData.description,
      });

      if (updatedUser && typeof onUserChange === 'function') {
        onUserChange(updatedUser);
      }

      setIsSuccess(true);
      // Registration Storage: Record registration in localStorage for guest/unauthenticated users
      try {
        localStorage.setItem('hasRegisteredGitaClass', 'true');
      } catch (storageError) {
        console.warn('Failed to save hasRegisteredGitaClass to localStorage:', storageError);
      }

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
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

  return (
    <div className="satsang-modal-backdrop" onClick={onClose}>
      <div
        aria-modal="true"
        className="satsang-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close modal"
          className="satsang-modal-close"
          onClick={onClose}
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
            {getActiveSocialLinks(activeOpp?.socialLinks).length > 0 ? (
              <>
                <p>We have received your request.</p>
                <p className="satsang-success-sub">Our devotee will contact you soon.</p>
                <div className="satsang-connect-section">
                  <h4>Connect with us</h4>
                  <div className="satsang-social-actions-group">
                    {getActiveSocialLinks(activeOpp.socialLinks).map((link) => (
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
                <p className="satsang-success-sub">Our devotee will contact you soon.</p>
              </>
            )}
            <button
              className="satsang-btn-primary"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        ) : (
          <form className="satsang-interest-form" onSubmit={handleSubmit}>
            <div className="satsang-modal-header">
              <span className="satsang-modal-badge">{activeOpp.category || 'CLASS'}</span>
              <h2>Express Interest</h2>
              <p><strong>{activeOpp.title}</strong></p>
            </div>

            {activeOpp.classDetails ? (
              <div className="satsang-modal-availability-summary">
                {activeOpp.classDetails.availableModes?.length ? (
                  <div className="satsang-modal-availability-item">
                    <span className="satsang-availability-label">Available Modes:</span>
                    <span className="satsang-availability-val">{formatModesList(activeOpp.classDetails.availableModes)}</span>
                  </div>
                ) : null}
                {activeOpp.classDetails.availableLanguages?.length ? (
                  <div className="satsang-modal-availability-item">
                    <span className="satsang-availability-label">Available Languages:</span>
                    <span className="satsang-availability-val">{formatLanguagesList(activeOpp.classDetails.availableLanguages)}</span>
                  </div>
                ) : null}
                {activeOpp.classDetails.availableDays?.length ? (
                  <div className="satsang-modal-availability-item">
                    <span className="satsang-availability-label">Available Days:</span>
                    <span className="satsang-availability-val">{formatDaysFullList(activeOpp.classDetails.availableDays)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {formError ? <div className="satsang-form-alert">{formError}</div> : null}

            {/* 1. Name */}
            <div className="satsang-form-group">
              <label htmlFor="interest-name">
                Name / नाम <span className="satsang-required">*</span>
              </label>
              <input
                id="interest-name"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                type="text"
                value={formData.name}
              />
            </div>

            {/* 2. Email (Optional) */}
            <div className="satsang-form-group">
              <label htmlFor="interest-email">
                Email (Optional)
              </label>
              <input
                id="interest-email"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. name@example.com (optional)"
                type="email"
                value={formData.email}
              />
              <small className="satsang-input-help">Optional. Used to send you details and updates regarding this class.</small>
            </div>

            {/* 3. Phone Number */}
            <div className="satsang-form-group">
              <label htmlFor="interest-phone">
                Phone Number <span className="satsang-required">*</span>
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
                <small className="satsang-input-help">Required to connect with you regarding this class.</small>
              )}
            </div>

            {/* 4. Age */}
            <div className="satsang-form-group">
              <label htmlFor="interest-age">
                Age / आयु / उम्र <span className="satsang-required">*</span>
              </label>
              <input
                id="interest-age"
                max="120"
                min="1"
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g. 24"
                required
                type="number"
                value={formData.age}
              />
            </div>

            {/* 5. Passion */}
            <div className="satsang-form-group">
              <label htmlFor="interest-passion">
                Passion / आप क्या करते हैं <span className="satsang-required">*</span>
              </label>
              <select
                id="interest-passion"
                onChange={(e) => setFormData({ ...formData, passion: e.target.value })}
                required
                value={formData.passion}
              >
                <option value="STUDENT">Student</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* 6. Institution / Company */}
            <div className="satsang-form-group">
              <label htmlFor="interest-institution">
                {formData.passion === 'STUDENT'
                  ? 'College / Institution Name *'
                  : formData.passion === 'PROFESSIONAL'
                    ? 'Organization / Company Name *'
                    : 'What best describes you? / कौन सा विकल्प आपका सबसे अच्छा वर्णन करता है? *'}
              </label>
              <input
                id="interest-institution"
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                placeholder={
                  formData.passion === 'STUDENT'
                    ? 'e.g. Pune University, IIT, COEP'
                    : formData.passion === 'PROFESSIONAL'
                      ? 'e.g. Infosys, TCS, Freelancer'
                      : 'e.g. Retired teacher, Artist, Homemaker'
                }
                required
                type="text"
                value={formData.institutionName}
              />
            </div>

            {/* 7. Mode */}
            <div className="satsang-form-group">
              <label htmlFor="interest-mode">
                Mode / माध्यम <span className="satsang-required">*</span>
              </label>
              <select
                id="interest-mode"
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                required
                value={formData.mode}
              >
                {(activeOpp?.classDetails?.availableModes?.length
                  ? activeOpp.classDetails.availableModes
                  : ['ONLINE', 'OFFLINE']).map((m) => (
                    <option key={m} value={m}>
                      {ALL_MODES_MAP[m] || m}
                    </option>
                  ))}
              </select>
            </div>

            {/* 8. Preferred Language */}
            <div className="satsang-form-group">
              <label htmlFor="interest-language">
                Preferred Language <span className="satsang-required">*</span>
              </label>
              <select
                id="interest-language"
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                required
                value={formData.language}
              >
                {(activeOpp?.classDetails?.availableLanguages?.length
                  ? activeOpp.classDetails.availableLanguages
                  : ['ENGLISH', 'HINDI']).map((l) => (
                    <option key={l} value={l}>
                      {ALL_LANGUAGES_MAP[l] || l}
                    </option>
                  ))}
              </select>
            </div>

            {/* 9. Preferred Day */}
            <div className="satsang-form-group">
              <label htmlFor="interest-day-option">
                Preferred Day <span className="satsang-required">*</span>
              </label>
              <select
                id="interest-day-option"
                onChange={(e) => setFormData({ ...formData, dayOption: e.target.value })}
                required
                value={formData.dayOption}
              >
                {(activeOpp?.classDetails?.availableDays?.length
                  ? activeOpp.classDetails.availableDays
                  : ['SATURDAY', 'SUNDAY']).map((d) => (
                    <option key={d} value={d}>
                      {ALL_DAYS_MAP[d] || d}
                    </option>
                  ))}
              </select>
            </div>

            {/* 10. Description (Optional) */}
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
                onClick={onClose}
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
  );
}
