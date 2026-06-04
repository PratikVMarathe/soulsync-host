import { startTransition, useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ChallengeCard from '../components/ChallengeCard';
import AppIcon from '../components/AppIcon';
import { db } from '../config/firebase';

const continueLearning = [
  {
    title: 'Bhagavad Gita',
    subtitle: 'Chapter 2',
    progressLabel: '5 of 18 lessons',
    progressValue: 30,
    tone: 'is-gold',
  },
  {
    title: 'Srimad Bhagavatam',
    subtitle: 'Canto 1',
    progressLabel: '2 of 12 lessons',
    progressValue: 18,
    tone: 'is-indigo',
  },
  {
    title: 'Living with Purpose',
    subtitle: 'Course',
    progressLabel: '60% complete',
    progressValue: 60,
    tone: 'is-sage',
  },
  {
    title: 'Mindful Living',
    subtitle: 'Course',
    progressLabel: '25% complete',
    progressValue: 25,
    tone: 'is-rose',
  },
];

function getFirstName(user) {
  return user?.displayName?.split(' ')[0] || 'Friend';
}

export default function Dashboard({ user }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const quizQuery = query(collection(db, 'quizzes'), where('status', '==', 'Active'));
        const querySnapshot = await getDocs(quizQuery);
        const quizData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((left, right) => (left.title || '').localeCompare(right.title || ''));

        startTransition(() => {
          setQuizzes(quizData);
          setError(null);
        });
      } catch (fetchError) {
        console.error('Error fetching quizzes:', fetchError);
        setError(
          fetchError.code === 'permission-denied'
            ? 'Your account cannot read the active concepts. Please check the Firestore rules for quizzes.'
            : 'We could not load the active concepts. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  useEffect(() => {
    const targetId = window.sessionStorage.getItem('soulsync-scroll-target');

    if (!targetId) return;

    window.sessionStorage.removeItem('soulsync-scroll-target');

    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [loading]);

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero" id="dashboard-top">
        <div className="dashboard-heading">
          <div>
            <h1>Welcome back, {getFirstName(user)}.</h1>
            <p>Continue your journey of self-discovery with one calm step at a time.</p>
          </div>

          <div className="dashboard-chip-row" id="profile-anchor">
            <div className="app-chip">
              <AppIcon name="fire" size={16} />
              <span>7 Day Streak</span>
            </div>
          </div>
        </div>

        <article className="daily-spark-card">
          <div className="daily-spark-copy">
            <span>Daily Spark</span>
            <h2>Focus on the action, not the outcome.</h2>
            <p>Established in yoga, perform your action, abandoning attachment, and remain balanced in success and failure.</p>
            <button className="daily-spark-button" type="button">
              Reflect on this
            </button>
          </div>

          <div className="daily-spark-glow" aria-hidden="true" />
        </article>
      </section>

      <section className="dashboard-section" id="continue-learning">
        <div className="section-heading">
          <div>
            <h2>Continue Learning</h2>
            <p>Return to the lessons you already started.</p>
          </div>
          <button className="section-link" type="button">
            See all
          </button>
        </div>

        <div className="learning-grid">
          {continueLearning.map((item) => (
            <article className={`learning-card ${item.tone}`} key={item.title}>
              <div className="learning-card-copy">
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </div>
              <small>{item.progressLabel}</small>
              <div className="learning-progress">
                <span style={{ width: `${item.progressValue}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section" id="active-challenges">
        <div className="section-heading">
          <div>
            <h2>Active Challenges</h2>
            <p>Pick a concept and test your understanding.</p>
          </div>
          <button className="section-link" type="button">
            See all
          </button>
        </div>

        {loading ? (
          <div className="dashboard-state-card">Loading your concepts...</div>
        ) : error ? (
          <div className="dashboard-state-card is-error">{error}</div>
        ) : quizzes.length ? (
          <div className="challenge-grid">
            {quizzes.map((quiz) => (
              <ChallengeCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        ) : (
          <div className="dashboard-state-card">No active concepts found right now.</div>
        )}
      </section>

      <section className="dashboard-section" id="ai-guide-panel">
        <div className="section-heading">
          <div>
            <h2>AI Guide</h2>
            <p>Ask SoulGuide for a deeper explanation whenever you want to sit with a concept longer.</p>
          </div>
        </div>

        <article className="ai-guide-panel">
          <div className="ai-guide-copy">
            <AppIcon name="message" size={20} />
            <p>Ask SoulGuide anything about focus, anger, detachment, or how to apply a verse in daily life.</p>
          </div>
          <button className="ai-guide-input" type="button">
            <span>Ask anything...</span>
            <AppIcon name="arrow" size={18} />
          </button>
        </article>
      </section>

      <section className="dashboard-section" id="progress-overview">
        <div className="section-heading">
          <div>
            <h2>Progress</h2>
            <p>Your practice is building consistency. Keep the rhythm gentle and steady.</p>
          </div>
        </div>

        <div className="progress-strip">
          <article>
            <strong>{quizzes.length}</strong>
            <span>Active concepts</span>
          </article>
          <article>
            <strong>7</strong>
            <span>Day streak</span>
          </article>
          <article>
            <strong>4</strong>
            <span>Courses in progress</span>
          </article>
        </div>
      </section>
    </div>
  );
}
