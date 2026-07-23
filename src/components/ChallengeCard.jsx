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

  return (
    <article className={`challenge-card ${themeClass}`}>
      {/* <div className="challenge-card-image">
        <img alt={quiz?.imageAlt || `${displayTitle} concept visual`} src={getImageUrl(quiz)} />
      </div> */}

      <div className="challenge-card-header">
        <span className="challenge-card-chip">{formatLevelLabel(quiz?.level)}</span>
        <span className="challenge-card-time">
          <AppIcon name="question" size={14} />
          {questionCount} Questions
        </span>
      </div>

      <div className="challenge-card-body">
        <h3>{displayTitle}</h3>
        <p>{quiz?.description}</p>
      </div>

      <div className="challenge-card-meta">
        <span>
          <AppIcon name="lotus" size={15} />
          {quiz?.category || 'Wisdom'}
        </span>
        <span>
          <AppIcon name="fire" size={15} />
          {timeLabel}
        </span>
      </div>

      <button
        className="challenge-card-action"
        onClick={() => navigate(`/quiz/${quizPathKey}`)}
        type="button"
      >
        <span>Start Concept</span>
        <AppIcon name="arrow" size={16} />
      </button>
    </article>
  );
}
