import { useEffect, useState } from 'react';
import AppStatusView from '../components/AppStatusView';
import ChallengeCard from '../components/ChallengeCard';
import { useActiveQuizzes } from '../hooks/useActiveQuizzes';
import { filterQuizzes, getQuizFilterOptions } from '../services/quizCatalogService';
import { formatLevelLabel } from '../utils/identity';

const QUIZZES_PER_PAGE = 6;

export default function QuizLibraryPage({ onSignIn, user = null }) {
  const { quizzes, loading, error, retry } = useActiveQuizzes(user);
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const filterOptions = getQuizFilterOptions(quizzes);
  const filteredQuizzes = filterQuizzes(quizzes, filters);
  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / QUIZZES_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.level, filters.search]);

  const updateFilter = (field, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const startIndex = (page - 1) * QUIZZES_PER_PAGE;
  const visibleQuizzes = filteredQuizzes.slice(startIndex, startIndex + QUIZZES_PER_PAGE);

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
            <strong>{filteredQuizzes.length}</strong>
            <span>Visible quizzes</span>
          </div>
        </div>

        <div className="quiz-library-filters" aria-label="Quiz filters">
          <label className="quiz-library-search">
            <span>Search</span>
            <input
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Search by title, category, or level"
              type="search"
              value={filters.search}
            />
          </label>

          <label>
            <span>Category</span>
            <select
              onChange={(event) => updateFilter('category', event.target.value)}
              value={filters.category}
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Level</span>
            <select
              onChange={(event) => updateFilter('level', event.target.value)}
              value={filters.level}
            >
              <option value="">All Levels</option>
              {filterOptions.levels.map((level) => (
                <option key={level} value={level}>{formatLevelLabel(level)}</option>
              ))}
            </select>
          </label>
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
          <div className="dashboard-state-card">No active concepts match these filters right now.</div>
        )}
      </section>
    </div>
  );
}
