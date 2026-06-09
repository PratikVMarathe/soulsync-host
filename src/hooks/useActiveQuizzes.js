import { startTransition, useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ACTIVE_QUIZ_STATUSES } from '../constants/auth';
import { db } from '../config/firebase';
import { resolveAppErrorState } from '../utils/resolveAppErrorState';

export function useActiveQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);

      try {
        const quizQuery = query(
          collection(db, 'quizzes'),
          where('status', 'in', ACTIVE_QUIZ_STATUSES),
        );
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
        setError(resolveAppErrorState(fetchError, fetchError.code === 'permission-denied'
          ? {
              message: 'Your account cannot read the active concepts. Please check the Firestore rules for quizzes.',
              statusCode: 403,
              title: 'Quiz Access Restricted',
            }
          : {
              message: 'We could not load the active concepts right now. Please try again.',
              title: 'Could Not Load Challenges',
            }));
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [reloadToken]);

  return {
    retry: () => setReloadToken((currentToken) => currentToken + 1),
    quizzes,
    loading,
    error,
  };
}
