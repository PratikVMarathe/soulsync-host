import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

function toMillis(value) {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export function isQuizAvailableNow(quiz, now = Date.now()) {
  const publishAt = toMillis(quiz?.publishAt);
  const expireAt = toMillis(quiz?.expireAt);

  return quiz?.status === 'ACTIVE'
    && (publishAt === null || publishAt <= now)
    && (expireAt === null || expireAt > now);
}

export async function loadUserAttemptsSummary(userId) {
  if (!userId) return {};

  const attemptsQuery = collection(db, 'users', userId, 'quizAttempts');
  const querySnapshot = await getDocs(attemptsQuery);
  const summary = {};

  querySnapshot.docs.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    const slug = data.quizSlug;
    if (!slug) return;

    if (!summary[slug]) {
      summary[slug] = {
        hasActive: false,
        hasCompleted: false,
        resumeQuestionIndex: 0,
      };
    }

    if (data.status === 'IN_PROGRESS') {
      summary[slug].hasActive = true;
      summary[slug].resumeQuestionIndex = data.runtime?.currentQuestionIndex ?? data.currentQuestionIndex ?? 0;
    } else if (data.status === 'COMPLETED') {
      summary[slug].hasCompleted = true;
    }
  });

  return summary;
}

export async function loadAvailableQuizzes(userId = null) {
  const quizQuery = query(
    collection(db, 'quizzes'),
    where('status', '==', 'ACTIVE'),
  );
  const querySnapshot = await getDocs(quizQuery);
  const now = Date.now();
  const attemptsSummary = await loadUserAttemptsSummary(userId);

  return querySnapshot.docs
    .map((documentSnapshot) => {
      const data = documentSnapshot.data();
      const slug = data.slug || documentSnapshot.id;
      const attemptInfo = attemptsSummary[slug] || { hasActive: false, hasCompleted: false, resumeQuestionIndex: 0 };

      let attemptStatus = 'NOT_STARTED';
      if (attemptInfo.hasActive) {
        attemptStatus = 'IN_PROGRESS';
      } else if (attemptInfo.hasCompleted) {
        attemptStatus = data.allowRetake === false ? 'COMPLETED_NO_RETAKE' : 'COMPLETED';
      }

      return {
        id: documentSnapshot.id,
        ...data,
        userAttempt: {
          resumeQuestionIndex: attemptInfo.resumeQuestionIndex,
          status: attemptStatus,
        },
      };
    })
    .filter((quiz) => isQuizAvailableNow(quiz, now))
    .sort((left, right) => {
      const seqLeft = typeof left.sequence === 'number' ? left.sequence : Number.MAX_SAFE_INTEGER;
      const seqRight = typeof right.sequence === 'number' ? right.sequence : Number.MAX_SAFE_INTEGER;
      if (seqLeft !== seqRight) return seqLeft - seqRight;
      return (left.title || '').localeCompare(right.title || '');
    });
}


export function getQuizFilterOptions(quizzes) {
  const categories = [...new Set(
    quizzes
      .map((quiz) => quiz.category)
      .filter(Boolean)
      .map((category) => String(category).trim()),
  )].sort((left, right) => left.localeCompare(right));

  const levels = [...new Set(
    quizzes
      .map((quiz) => quiz.level)
      .filter(Boolean)
      .map((level) => String(level).trim().toUpperCase()),
  )].sort((left, right) => left.localeCompare(right));

  return {
    categories,
    levels,
  };
}

export function filterQuizzes(quizzes, filters) {
  const searchText = String(filters?.search || '').trim().toLowerCase();
  const category = String(filters?.category || '').trim().toLowerCase();
  const level = String(filters?.level || '').trim().toUpperCase();

  return quizzes.filter((quiz) => {
    const matchesSearch = !searchText || [
      quiz.title,
      quiz.description,
      quiz.category,
      quiz.level,
    ].some((value) => String(value || '').toLowerCase().includes(searchText));
    const matchesCategory = !category || String(quiz.category || '').toLowerCase() === category;
    const matchesLevel = !level || String(quiz.level || '').toUpperCase() === level;

    return matchesSearch && matchesCategory && matchesLevel;
  });
}
