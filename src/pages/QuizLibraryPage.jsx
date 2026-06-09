import { useEffect, useState } from 'react';
import AppStatusView from '../components/AppStatusView';
import ChallengeCard from '../components/ChallengeCard';
import { useActiveQuizzes } from '../hooks/useActiveQuizzes';

const QUIZZES_PER_PAGE = 6;

export default function QuizLibraryPage() {
  const { quizzes, loading, error, retry } = useActiveQuizzes();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(quizzes.length / QUIZZES_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * QUIZZES_PER_PAGE;
  const visibleQuizzes = quizzes.slice(startIndex, startIndex + QUIZZES_PER_PAGE);

  return (
    <div className="quiz-library-page">
      <section className="dashboard-section quiz-library-shell">
        <div className="quiz-library-header">
          <div>
            <span className="quiz-library-eyebrow">Quiz Library</span>
            <h1>All Active Challenges</h1>
            <p>Explore every live concept quiz and move through them at your own pace.</p>
          </div>
          <div className="quiz-library-summary">
            <strong>{quizzes.length}</strong>
            <span>Active quizzes</span>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-state-card">Loading your concepts...</div>
        ) : error ? (
          <AppStatusView
            compact
            state={error}
            actions={[
              { label: 'Try Again', onClick: retry },
            ]}
          />
        ) : visibleQuizzes.length ? (
          <>
            <div className="quiz-library-grid">
              {visibleQuizzes.map((quiz) => (
                <ChallengeCard key={quiz.id} quiz={quiz} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="quiz-library-pagination">
                <button
                  className="quiz-pagination-button"
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  type="button"
                >
                  Previous
                </button>

                <div className="quiz-pagination-pages">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      aria-current={pageNumber === page ? 'page' : undefined}
                      className={`quiz-page-chip${pageNumber === page ? ' is-active' : ''}`}
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  className="quiz-pagination-button"
                  disabled={page === totalPages}
                  onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="dashboard-state-card">No active concepts found right now.</div>
        )}
      </section>
    </div>
  );
}
