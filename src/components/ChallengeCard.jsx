import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { FEATURE_MESSAGES } from '../constants/featureMessages';
import { useAppNotice } from '../hooks/useAppNotice';
import { formatLevelLabel } from '../utils/identity';
import AppIcon from './AppIcon';

const themeMap = {
  anger: 'is-earth',
  calm: 'is-sky',
  focus: 'is-forest',
  purpose: 'is-sand',
};

function formatEstimatedTime(seconds) {
  const minutes = Math.max(1, Math.ceil(Number(seconds || 0) / 60));
  return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
}

function getDisplayTitle(title) {
  return (title || 'Concept').replace(/^Concept\s+\d+\s*:\s*/i, '');
}

function getImageUrl(quiz) {
  return quiz?.imageUrl || '/images/home_page_meditation.png';
}

export default function ChallengeCard({ onSignIn, quiz, user = null }) {
  const navigate = useNavigate();
  const { showNotice } = useAppNotice();
  const themeClass = themeMap[quiz?.slug] || themeMap[quiz?.category] || 'is-forest';
  const displayTitle = getDisplayTitle(quiz?.title);
  const questionCount = quiz?.totalQuestions || quiz?.questions?.length || 0;
  const quizPathKey = quiz?.slug || quiz?.id;
  const timeLabel = quiz?.timeLimitLabel
    || quiz?.time
    || (quiz?.estimatedTime ? formatEstimatedTime(quiz.estimatedTime) : null)
    || (quiz?.estimatedMinutes ? `${quiz.estimatedMinutes} min` : '1 min');

  const attemptStatus = quiz?.userAttempt?.status || 'NOT_STARTED';
  const isResume = attemptStatus === 'IN_PROGRESS';
  const isCompletedNoRetake = attemptStatus === 'COMPLETED_NO_RETAKE';
  const isCompleted = attemptStatus === 'COMPLETED' || isCompletedNoRetake;

  let buttonLabel = 'Start Concept';
  if (isResume) buttonLabel = 'Resume Concept';
  else if (isCompletedNoRetake) buttonLabel = 'Completed';
  else if (isCompleted) buttonLabel = 'Retake Concept';

  const handleStartConcept = async () => {
    if (user) {
      navigate(`/quiz/${quizPathKey}`);
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('pendingQuizSlug', quizPathKey);
      }
      showNotice(FEATURE_MESSAGES.QUIZ_SIGN_IN_REQUIRED, 'info');

      if (onSignIn) {
        await onSignIn();
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        showNotice(FEATURE_MESSAGES.LOGIN_CANCELLED, 'info');
      } else {
        console.error('Google sign in failed from concept card:', error);
        showNotice('We could not start Google sign in. Please try again.', 'error');
      }
    }
  };

  return (
    <article className={`challenge-card ${themeClass}`}>
      <div className="challenge-card-image">
        <img alt={quiz?.imageAlt || `${displayTitle} concept visual`} src={getImageUrl(quiz)} />
      </div>

      <div className="challenge-card-header">
        <span className="challenge-card-chip" style={{ border: '1px solid' }}>{formatLevelLabel(quiz?.level)}</span>
        {isResume && (
          <span className="challenge-card-chip" style={{ backgroundColor: '#ff9800', color: '#ffffff' }}>
            In Progress
          </span>
        )}
        {isCompleted && (
          <span className="challenge-card-chip" style={{ backgroundColor: '#4caf50', color: '#ffffff' }}>
            Completed
          </span>
        )}
        <span className="challenge-card-time" style={{ border: '1px solid' }}>
          <AppIcon name="question" size={14} />
          {questionCount} Ques
        </span>
      </div>

      <div className="challenge-card-body">
        <h3>{displayTitle}</h3>
        <p>{quiz?.description}</p>
      </div>

      <div className="challenge-card-meta">
        <span className="challenge-card-meta-icon">
          <AppIcon name="lotus" size={15} />
          {quiz?.category || 'Wisdom'}
        </span>
        <span className="challenge-card-meta-icon">
          <AppIcon name="fire" size={15} />
          {timeLabel}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <button
          className="challenge-card-action"
          disabled={isCompletedNoRetake}
          onClick={handleStartConcept}
          type="button"
          style={{ flex: 1 }}
        >
          <span>{buttonLabel}</span>
          <AppIcon name={isCompletedNoRetake ? 'check' : 'arrow'} size={16} />
        </button>

        <button
          className="challenge-card-action"
          disabled={!isCompleted}
          onClick={() => navigate(`/quiz/${quizPathKey}?view=history`)}
          type="button"
          style={{ 
            flex: 1, 
            backgroundColor: 'transparent', 
            color: 'inherit', 
            border: '1px solid currentColor',
            opacity: isCompleted ? 1 : 0.5,
          }}
          title={isCompleted ? "View History" : "No history available"}
        >
          <span>History</span>
          <AppIcon name="clock" size={16} />
        </button>
      </div>
    </article>
  );
}

