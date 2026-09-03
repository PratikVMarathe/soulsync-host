import { useNavigate } from 'react-router-dom';
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

export default function ChallengeCard({ quiz }) {
  const navigate = useNavigate();
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

      <button
        className="challenge-card-action"
        disabled={isCompletedNoRetake}
        onClick={() => navigate(`/quiz/${quizPathKey}`)}
        style={{ width: '100%' }}
        type="button"
      >
        <span>{buttonLabel}</span>
        <AppIcon name={isCompletedNoRetake ? 'check' : 'arrow'} size={16} />
      </button>
    </article>
  );
}

