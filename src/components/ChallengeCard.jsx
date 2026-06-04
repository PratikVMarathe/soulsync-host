import { useNavigate } from 'react-router-dom';
import AppIcon from './AppIcon';

const themeMap = {
  anger: 'is-earth',
  calm: 'is-sky',
  focus: 'is-forest',
  purpose: 'is-sand',
};

function getDisplayTitle(title) {
  return (title || 'Concept').replace(/^Concept\s+\d+\s*:\s*/i, '');
}

export default function ChallengeCard({ quiz }) {
  const navigate = useNavigate();
  const themeClass = themeMap[quiz?.slug] || themeMap[quiz?.category] || 'is-forest';
  const questionCount = quiz?.questions?.length || 0;

  return (
    <article className={`challenge-card ${themeClass}`}>
      <div className="challenge-card-header">
        <span className="challenge-card-chip">{quiz?.level || 'Beginner'}</span>
        <span className="challenge-card-time">
          <AppIcon name="question" size={14} />
          {questionCount} Questions
        </span>
      </div>

      <div className="challenge-card-body">
        <h3>{getDisplayTitle(quiz?.title)}</h3>
        <p>{quiz?.description}</p>
      </div>

      <div className="challenge-card-meta">
        <span>
          <AppIcon name="lotus" size={15} />
          {quiz?.category || 'Wisdom'}
        </span>
        <span>
          <AppIcon name="fire" size={15} />
          {quiz?.time || '1 min'}
        </span>
      </div>

      <button
        className="challenge-card-action"
        onClick={() => navigate(`/quiz/${quiz.id}`)}
        type="button"
      >
        <span>Start Concept</span>
        <AppIcon name="arrow" size={16} />
      </button>
    </article>
  );
}
