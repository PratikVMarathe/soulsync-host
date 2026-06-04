import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import AppIcon from '../components/AppIcon';
import Brand from '../components/Brand';

const navigationItems = ['Courses', 'Wisdom', 'Quiz', 'AI Guide', 'About'];
const valuePoints = ['Reduce Stress', 'Improve Focus', 'Live with Purpose'];
const partnerLogos = ['Google', 'Microsoft', 'pwc', 'Deloitte.', 'Infosys'];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
      window.alert('Failed to log in. Check the console for details.');
    }
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
                <button className="marketing-link" key={item} type="button">
                  {item}
                </button>
              ))}

              <button className="marketing-signin mobile-only" onClick={handleGoogleLogin} type="button">
                Sign in
              </button>
            </nav>

            <button className="marketing-signin desktop-only" onClick={handleGoogleLogin} type="button">
              Sign in
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
                <button className="primary-cta" onClick={handleGoogleLogin} type="button">
                  Start Your Journey
                </button>

                <button className="secondary-cta" onClick={scrollToPartners} type="button">
                  <AppIcon name="play" size={16} />
                  <span>Watch Demo</span>
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

          <footer className="landing-trust" id="landing-partners">
            <span>Trusted by learners seeking clarity</span>

            <div className="landing-logo-row">
              {partnerLogos.map((logo) => (
                <strong key={logo}>{logo}</strong>
              ))}
            </div>
          </footer>
      </div>
    </section>
  );
}
