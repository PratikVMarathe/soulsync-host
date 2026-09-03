import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import AppIcon from '../components/AppIcon';
import Brand from '../components/Brand';
import { FEATURE_MESSAGES } from '../constants/featureMessages';
import { useAppNotice } from '../hooks/useAppNotice';

// const navigationItems = ['Courses', 'Wisdom', 'Quiz', 'AI Guide', 'About'];
const navigationItems = ['Quiz', 'AI Guide'];
const valuePoints = ['Reduce Stress', 'Improve Focus', 'Live with Purpose'];
const authFlow = import.meta.env.VITE_FIREBASE_AUTH_FLOW?.trim().toLowerCase() === 'redirect'
  ? 'redirect'
  : 'popup';

function getLoginErrorMessage(error) {
  if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
    return 'Google sign in was cancelled before it finished.';
  }

  return 'We could not start Google sign in. Please try again.';
}

export default function LandingPage({ authError = '', onSignIn }) {
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const { showNotice } = useAppNotice();

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setLoginError('');

    try {
      if (onSignIn) {
        await onSignIn();
        return;
      }

      if (authFlow === 'redirect') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(getLoginErrorMessage(error));
      setIsSigningIn(false);
    }
  };

  const handleNavClick = (item) => {
    if (item === 'Quiz') {
      navigate('/quiz');
      return;
    }
    showNotice(FEATURE_MESSAGES.MARKETING_SECTION);
  };

  const scrollToPartners = () => {
    document.getElementById('landing-partners')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  return (
    <section className="landing-page">
      <div className="landing-shell">
        {(authError || loginError) && (
          <div className="landing-auth-error" role="alert">
            {authError || loginError}
          </div>
        )}

        <header className="marketing-nav">
          <Brand />

          <button
            aria-expanded={menuOpen}
            className="marketing-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <AppIcon name="menu" size={18} />
          </button>

          <nav className={`marketing-links${menuOpen ? ' is-open' : ''}`}>
            {navigationItems.map((item) => (
              <button
                className="marketing-link"
                key={item}
                onClick={() => handleNavClick(item)}
                type="button"
              >
                {item}
              </button>
            ))}

            <button
              className="marketing-signin mobile-only"
              disabled={isSigningIn}
              onClick={handleGoogleLogin}
              type="button"
            >
              {isSigningIn ? 'Signing in...' : 'Sign in'}
            </button>
          </nav>

          <button
            className="marketing-signin desktop-only"
            disabled={isSigningIn}
            onClick={handleGoogleLogin}
            type="button"
          >
            {isSigningIn ? 'Signing in...' : 'Sign in'}
          </button>
        </header>

        <div className="landing-hero">
          <div className="landing-copy">
            <div className="landing-badge">
              <AppIcon name="lotus" size={14} />
              <span>Ancient Wisdom. Modern You.</span>
            </div>

            <h1>
              Ancient Wisdom.
              <br />
              Modern <span>Clarity.</span>
            </h1>

            <p>
              Practical life lessons from the Bhagavad Gita and Srimad Bhagavatam for a calmer,
              more focused you.
            </p>

            <div className="landing-value-row">
              {valuePoints.map((point) => (
                <span className="landing-value-pill" key={point}>
                  <AppIcon name="lotus" size={14} />
                  {point}
                </span>
              ))}
            </div>

            <div className="landing-actions">
              <button
                className="primary-cta"
                disabled={isSigningIn}
                onClick={handleGoogleLogin}
                type="button"
              >
                {isSigningIn ? 'Signing in...' : 'Start Your Journey'}
              </button>

              <button
                className="secondary-cta"
                onClick={() => navigate('/quiz')}
                type="button"
              >
                <AppIcon name="question" size={16} />
                <span>Find Your Quiz</span>
              </button>
            </div>
          </div>

          <div className="landing-visual">
            <div className="landing-image-wrap">
              <img
                alt="Meditative landscape representing modern clarity through ancient wisdom"
                src="/images/home_page_meditation.png"
              />
            </div>

            <article className="landing-quote-card">
              <p>You have a right to perform your actions, but never to the fruits.</p>
              <strong>Bhagavad Gita 2.47</strong>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
