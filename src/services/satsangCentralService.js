import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  buildIdentityDocumentId,
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '../utils/identity';

import { normalizeSocialLinks } from '../constants/socialMedia';

const SATSANG_COLLECTION = 'satsangCentral';
const INTEREST_REQUESTS_COLLECTION = 'interestRequests';
const IDENTITY_LOCKS_COLLECTION = 'identityLocks';
const USERS_COLLECTION = 'users';
const AUDIT_LOGS_COLLECTION = 'auditLogs';

export async function loadActiveSatsangOpportunities() {
  const satsangRef = collection(db, SATSANG_COLLECTION);
  const activeQuery = query(satsangRef, where('status', '==', 'ACTIVE'));
  const querySnapshot = await getDocs(activeQuery);

  const opportunities = querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      socialLinks: normalizeSocialLinks(data.socialLinks),
    };
  });

  // Sort by startAt or createdAt desc
  return opportunities.sort((a, b) => {
    const timeA = a.startAt?.seconds || a.createdAt?.seconds || 0;
    const timeB = b.startAt?.seconds || b.createdAt?.seconds || 0;
    return timeB - timeA;
  });
}

export async function loadUserInterestRequests(userId) {
  if (!userId) return [];
  try {
    const requestsRef = collection(db, INTEREST_REQUESTS_COLLECTION);
    const userQuery = query(requestsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(userQuery);
    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    console.error('Failed to load user interest requests:', err);
    return [];
  }
}

export async function submitInterestRequest({
  user,
  opportunity,
  name,
  email,
  phoneNumber,
  age,
  passion,
  institutionName,
  mode,
  language,
  preferredDay,
  description = '',
}) {
  if (!user || !user.uid) {
    throw new Error('User authentication required.');
  }

  const cleanName = name?.trim() || '';
  const cleanEmail = email?.trim() || '';
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  const cleanDesc = description?.trim() || '';

  if (!cleanName) {
    throw new Error('Name is required.');
  }
  if (!cleanEmail) {
    throw new Error('Email is required.');
  }
  if (!cleanPhone || !isValidPhoneNumber(cleanPhone)) {
    throw new Error('Phone number must be exactly 10 digits.');
  }
  if (!opportunity || !opportunity.id) {
    throw new Error('Opportunity selection required.');
  }

  const parsedAge = parseInt(age, 10);
  if (Number.isNaN(parsedAge) || parsedAge <= 0) {
    throw new Error('Please enter a valid age.');
  }

  const normalizedPassion = (passion || '').toUpperCase().trim();
  if (!['STUDENT', 'PROFESSIONAL', 'OTHER'].includes(normalizedPassion)) {
    throw new Error('Please select a valid option for passion.');
  }

  const cleanInstitutionName = (institutionName || '').trim();
  if (!cleanInstitutionName) {
    if (normalizedPassion === 'STUDENT') {
      throw new Error('College / Institution Name is required.');
    }
    if (normalizedPassion === 'PROFESSIONAL') {
      throw new Error('Organization / Company Name is required.');
    }
    throw new Error('Please provide what best describes you.');
  }

  const normalizedMode = (mode || '').toUpperCase().trim();
  if (!['ONLINE', 'OFFLINE'].includes(normalizedMode)) {
    throw new Error('Please select a valid mode (Online or Offline).');
  }

  const normalizedLanguage = (language || '').toUpperCase().trim();
  if (!['ENGLISH', 'HINDI'].includes(normalizedLanguage)) {
    throw new Error('Please select a valid preferred language (English or Hindi).');
  }

  const normalizedDay = (preferredDay || '').toUpperCase().trim();
  if (!normalizedDay) {
    throw new Error('Please select your preferred day.');
  }

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const phoneLockId = buildIdentityDocumentId('PHONE', cleanPhone);
  const phoneLockRef = doc(db, IDENTITY_LOCKS_COLLECTION, phoneLockId);
  const interestRequestRef = doc(collection(db, INTEREST_REQUESTS_COLLECTION));
  const auditLogRef = doc(collection(db, AUDIT_LOGS_COLLECTION));

  // ─── Phase 1: Pre-checks outside the transaction ───────────────────────────
  // Reading the phone lock INSIDE a Firestore transaction causes the SDK to
  // issue a batchGet that includes identityLocks documents. Regular users don't
  // have list/read permission on arbitrary identity locks, which triggers 403.
  // Fix: read both docs with plain getDoc() BEFORE the transaction, validate
  // ownership, then perform only writes inside the transaction.
  const [userSnap, lockSnap] = await Promise.all([
    getDoc(userRef),
    getDoc(phoneLockRef),
  ]);

  if (!userSnap.exists()) {
    throw new Error('User profile not found.');
  }

  const userData = userSnap.data();
  const currentPhone = normalizePhoneNumber(userData.phoneNumber);
  const needsPhoneUpdate = !currentPhone || currentPhone !== cleanPhone;

  if (needsPhoneUpdate && lockSnap.exists()) {
    const lockData = lockSnap.data();
    if (lockData.status === 'LOCKED' && lockData.uid !== user.uid) {
      const error = new Error('This phone number is already registered to another account.');
      error.code = 'phone-registered';
      throw error;
    }
  }

  // ─── Phase 2: Write-only transaction ───────────────────────────────────────
  // Only the user document is re-read inside the transaction (to detect write
  // conflicts). No identityLocks read happens here — eliminating the 403.
  let updatedUser = null;

  await runTransaction(db, async (transaction) => {
    // Re-read user doc inside transaction so Firestore can detect conflicts
    // between Phase 1 and Phase 2.
    const freshUserSnap = await transaction.get(userRef);
    if (!freshUserSnap.exists()) {
      throw new Error('User profile not found.');
    }
    const freshUserData = freshUserSnap.data();
    const freshCurrentPhone = normalizePhoneNumber(freshUserData.phoneNumber);
    const stillNeedsUpdate = !freshCurrentPhone || freshCurrentPhone !== cleanPhone;

    if (stillNeedsUpdate) {
      // Update user's phone number in their profile
      transaction.update(userRef, {
        phoneNumber: cleanPhone,
        updatedAt: serverTimestamp(),
      });

      // Claim the identity lock (set or overwrite own lock)
      transaction.set(phoneLockRef, {
        type: 'PHONE',
        value: cleanPhone,
        valueNormalized: cleanPhone,
        uid: user.uid,
        role: freshUserData.role || 'USER',
        status: 'LOCKED',
        reason: 'ACTIVE_ACCOUNT',
        inviteId: null,
        lockedBy: user.uid,
        lockedAt: serverTimestamp(),
        releasedAt: null,
        releasedBy: null,
        updatedAt: serverTimestamp(),
      });

      updatedUser = {
        ...freshUserData,
        phoneNumber: cleanPhone,
      };
    }

    // Save the flat interest request document
    transaction.set(interestRequestRef, {
      userId: user.uid,
      satsangCentralId: opportunity.id,
      opportunityTitle: opportunity.title || '',
      category: opportunity.category || '',
      name: cleanName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      age: parsedAge,
      passion: normalizedPassion,
      institutionName: cleanInstitutionName,
      mode: normalizedMode,
      language: normalizedLanguage,
      preferredDay: normalizedDay,
      description: cleanDesc,
      status: 'NEW',
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Save the audit log
    transaction.set(auditLogRef, {
      action: 'EXPRESS_INTEREST',
      createdAt: serverTimestamp(),
      performedBy: user.uid,
      performedByRole: freshUserData.role || 'USER',
      status: 'SUCCESS',
      targetEmail: cleanEmail,
      targetId: opportunity.id,
      targetPhoneNumber: cleanPhone,
      targetRole: freshUserData.role || 'USER',
      targetTitle: opportunity.title || '',
    });
  });

  return updatedUser;
}
