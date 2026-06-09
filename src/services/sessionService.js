import { signOut, updateProfile } from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { USER_ROLES, USER_STATUSES } from '../constants/auth';
import { auth, db } from '../config/firebase';
import { normalizeEmail, normalizePhoneNumber } from '../utils/identity';

const USERS_COLLECTION = 'users';

const ACCESS_DENIED_MESSAGES = {
  BLOCKED: 'Your SoulSync account has been blocked. Please contact support or your administrator.',
  EMAIL_MISMATCH: 'Profile email must match the Google account you used to sign in.',
  MISSING_EMAIL: 'Your Google account did not provide an email address, so SoulSync could not complete sign in.',
  PERMISSION_DENIED: 'Google sign in worked, but Firestore blocked access to your SoulSync user profile. Update the rules for users/{uid}.',
  PHONE_LOCKED: 'Phone number can only be set once. Ask an administrator if it needs to be changed.',
  REGISTRATION_FAILED: 'We could not complete your registration right now. Please try again.',
  SOFT_DELETED: 'This SoulSync account was removed and cannot be used until an administrator restores it.',
};

const normalizeStatus = (status) => status?.toUpperCase() || '';

const normalizeRole = (role) => role?.toUpperCase() || USER_ROLES.USER;

class SessionAccessError extends Error {
  constructor(code, publicMessage, cause) {
    super(publicMessage);
    this.name = 'SessionAccessError';
    this.code = code;
    this.publicMessage = publicMessage;
    this.cause = cause;
  }
}

const createUserProfile = ({ authUser }) => ({
  uid: authUser.uid,
  name: authUser.displayName || authUser.email || 'SoulSync User',
  email: authUser.email || '',
  emailLower: normalizeEmail(authUser.email),
  phoneNumber: normalizePhoneNumber(authUser.phoneNumber) || null,
  role: USER_ROLES.USER,
  status: USER_STATUSES.ACTIVE,
  isRootSuperAdmin: false,
  isDeleted: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: null,
});

const validateUserAccess = (userProfile) => {
  if (!userProfile) {
    throw new SessionAccessError(
      'REGISTRATION_FAILED',
      ACCESS_DENIED_MESSAGES.REGISTRATION_FAILED,
    );
  }

  const status = normalizeStatus(userProfile.status);

  if (status === USER_STATUSES.BLOCKED) {
    throw new SessionAccessError('BLOCKED', ACCESS_DENIED_MESSAGES.BLOCKED);
  }

  if (status === USER_STATUSES.SOFT_DELETED || userProfile.isDeleted) {
    throw new SessionAccessError('SOFT_DELETED', ACCESS_DENIED_MESSAGES.SOFT_DELETED);
  }

  return {
    ...userProfile,
    role: normalizeRole(userProfile.role),
    status: status || USER_STATUSES.ACTIVE,
    isRootSuperAdmin: Boolean(userProfile.isRootSuperAdmin),
    isDeleted: Boolean(userProfile.isDeleted),
  };
};

const getUserReference = (uid) => doc(db, USERS_COLLECTION, uid);

const getUserProfileDocument = async (uid) => {
  const userSnapshot = await getDoc(getUserReference(uid));
  return userSnapshot.exists() ? userSnapshot.data() : null;
};

export const buildSessionViewer = (authUser, userProfile) => ({
  uid: authUser.uid,
  displayName: userProfile.name || authUser.displayName || authUser.email || 'SoulSync User',
  email: userProfile.email || authUser.email || '',
  photoURL: authUser.photoURL || '',
  phoneNumber: userProfile.phoneNumber || normalizePhoneNumber(authUser.phoneNumber) || '',
  role: userProfile.role,
  status: userProfile.status,
  isRootSuperAdmin: Boolean(userProfile.isRootSuperAdmin),
  isDeleted: Boolean(userProfile.isDeleted),
  profile: userProfile,
});

export const ensureUserSession = async (authUser) => {
  const emailLower = normalizeEmail(authUser?.email);

  if (!emailLower) {
    throw new SessionAccessError('MISSING_EMAIL', ACCESS_DENIED_MESSAGES.MISSING_EMAIL);
  }

  const existingProfile = await getUserProfileDocument(authUser.uid);
  if (existingProfile) {
    return validateUserAccess(existingProfile);
  }

  const userReference = getUserReference(authUser.uid);

  // Phase 1 keeps the client-side bootstrap limited to the authenticated
  // user's own profile. Invite and identity-lock enforcement should move to a
  // privileged backend step so regular users do not need read access to those collections.
  await runTransaction(db, async (transaction) => {
    const existingUserSnapshot = await transaction.get(userReference);
    if (existingUserSnapshot.exists()) {
      validateUserAccess(existingUserSnapshot.data());
      return;
    }

    transaction.set(userReference, createUserProfile({ authUser }));
  });

  const createdProfile = await getUserProfileDocument(authUser.uid);
  return validateUserAccess(createdProfile);
};

export const resolveAuthSession = async (authUser) => {
  const userProfile = await ensureUserSession(authUser);
  return buildSessionViewer(authUser, userProfile);
};

export const updateCurrentUserProfile = async ({ email, name, phoneNumber }) => {
  const authUser = auth.currentUser;

  if (!authUser) {
    throw new SessionAccessError(
      'REGISTRATION_FAILED',
      ACCESS_DENIED_MESSAGES.REGISTRATION_FAILED,
    );
  }

  const existingProfile = validateUserAccess(await getUserProfileDocument(authUser.uid));
  const trimmedName = name?.trim() || existingProfile.name || authUser.displayName || 'SoulSync User';
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const currentPhone = existingProfile.phoneNumber || '';
  const currentEmail = existingProfile.email || '';
  const authEmail = authUser.email || '';

  if (currentPhone && normalizedPhone && normalizedPhone !== currentPhone) {
    throw new SessionAccessError('PHONE_LOCKED', ACCESS_DENIED_MESSAGES.PHONE_LOCKED);
  }

  if (currentPhone && !normalizedPhone) {
    throw new SessionAccessError('PHONE_LOCKED', ACCESS_DENIED_MESSAGES.PHONE_LOCKED);
  }

  if (currentEmail && email?.trim() && email.trim() !== currentEmail) {
    throw new SessionAccessError('EMAIL_MISMATCH', ACCESS_DENIED_MESSAGES.EMAIL_MISMATCH);
  }

  const nextEmail = currentEmail || email?.trim() || authEmail;
  if (nextEmail && authEmail && normalizeEmail(nextEmail) !== normalizeEmail(authEmail)) {
    throw new SessionAccessError('EMAIL_MISMATCH', ACCESS_DENIED_MESSAGES.EMAIL_MISMATCH);
  }

  const nextPhone = currentPhone || normalizedPhone || null;
  const userReference = getUserReference(authUser.uid);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userReference);
    if (!snapshot.exists()) {
      throw new SessionAccessError(
        'REGISTRATION_FAILED',
        ACCESS_DENIED_MESSAGES.REGISTRATION_FAILED,
      );
    }

    validateUserAccess(snapshot.data());

    transaction.update(userReference, {
      name: trimmedName,
      email: nextEmail,
      emailLower: normalizeEmail(nextEmail),
      phoneNumber: nextPhone,
      updatedAt: serverTimestamp(),
    });
  });

  if (trimmedName && authUser.displayName !== trimmedName) {
    await updateProfile(authUser, { displayName: trimmedName });
  }

  return resolveAuthSession(authUser);
};

export const safeSignOut = async () => {
  await signOut(auth);
};

export const getAuthErrorMessage = (error) => {
  if (error instanceof SessionAccessError) {
    return error.publicMessage;
  }

  if (error?.code === 'permission-denied') {
    return ACCESS_DENIED_MESSAGES.PERMISSION_DENIED;
  }

  return 'We could not complete your SoulSync sign in. Please try again.';
};
