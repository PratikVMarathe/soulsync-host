import { signOut, updateProfile } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ADMIN_INVITE_STATUSES,
  IDENTITY_LOCK_REASONS,
  IDENTITY_LOCK_STATUSES,
  IDENTITY_TYPES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';
import { auth, db } from '../config/firebase';
import {
  buildIdentityDocumentId,
  isValidPhoneNumber,
  normalizeEmail,
  normalizePhoneNumber,
} from '../utils/identity';
import { toTitleCase } from '../utils/text';

const USERS_COLLECTION = 'users';
const ADMIN_INVITES_COLLECTION = 'adminInvites';
const IDENTITY_LOCKS_COLLECTION = 'identityLocks';
const AUDIT_LOGS_COLLECTION = 'auditLogs';

const ACCESS_DENIED_MESSAGES = {
  ADMIN_INVITE_INVALID: 'This admin invite is no longer active. Ask your Super Admin to create a fresh invite.',
  BLOCKED: 'Your SoulSync account has been blocked. Please contact support or your administrator.',
  EMAIL_IN_USE: 'This email is already registered or reserved inside SoulSync.',
  EMAIL_MISMATCH: 'Profile email must match the Google account you used to sign in.',
  MISSING_EMAIL: 'Your Google account did not provide an email address, so SoulSync could not complete sign in.',
  PHONE_IN_USE: 'This phone number is already locked for another SoulSync account or admin invite.',
  PHONE_INVALID: 'Phone number must be exactly 10 digits.',
  PERMISSION_DENIED: 'Google sign in worked, but Firestore blocked access to your SoulSync user profile. Update the rules for users/{uid}.',
  PHONE_LOCKED: 'Phone number can only be set once. Ask an administrator if it needs to be changed.',
  REGISTRATION_FAILED: 'We could not complete your registration right now. Please try again.',
  SOFT_DELETED: 'This SoulSync account was removed and cannot be used until an administrator restores it.',
};

const normalizeStatus = (status) => status?.toUpperCase() || '';

const normalizeRole = (role) => role?.toUpperCase() || USER_ROLES.USER;

const inviteExpired = (invite) => {
  if (!invite?.expiresAt) return false;

  if (typeof invite.expiresAt?.toMillis === 'function') {
    return invite.expiresAt.toMillis() <= Date.now();
  }

  if (typeof invite.expiresAt?.toDate === 'function') {
    return invite.expiresAt.toDate().getTime() <= Date.now();
  }

  const date = new Date(invite.expiresAt);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
};

class SessionAccessError extends Error {
  constructor(code, publicMessage, cause) {
    super(publicMessage);
    this.name = 'SessionAccessError';
    this.code = code;
    this.publicMessage = publicMessage;
    this.cause = cause;
  }
}

const createUserProfile = ({
  authUser,
  createdBy = null,
  phoneNumber = normalizePhoneNumber(authUser.phoneNumber) || null,
  role = USER_ROLES.USER,
}) => ({
  uid: authUser.uid,
  name: toTitleCase(authUser.displayName) || authUser.email || 'SoulSync User',
  email: authUser.email || '',
  emailLower: normalizeEmail(authUser.email),
  phoneNumber,
  role,
  status: USER_STATUSES.ACTIVE,
  isRootSuperAdmin: false,
  isDeleted: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy,
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
const getIdentityLockReference = (documentId) => doc(db, IDENTITY_LOCKS_COLLECTION, documentId);
const getAdminInviteReference = (inviteId) => doc(db, ADMIN_INVITES_COLLECTION, inviteId);

const buildIdentityLockPayload = ({
  existingLock,
  inviteId = existingLock?.inviteId || null,
  lockedBy,
  reason = IDENTITY_LOCK_REASONS.ACTIVE_ACCOUNT,
  role,
  type,
  uid,
  value,
}) => ({
  type,
  value,
  valueNormalized: value,
  uid,
  role,
  status: IDENTITY_LOCK_STATUSES.LOCKED,
  reason,
  inviteId,
  lockedBy: existingLock?.lockedBy || lockedBy || 'system',
  lockedAt: existingLock?.lockedAt || serverTimestamp(),
  releasedAt: null,
  releasedBy: null,
  updatedAt: serverTimestamp(),
});

const buildAuditLogPayload = ({
  action,
  invitedBy = null,
  performedBy,
  performedByRole,
  targetEmail,
  targetPhoneNumber = null,
  targetRole,
}) => ({
  action,
  createdAt: serverTimestamp(),
  invitedBy,
  performedBy,
  performedByRole,
  status: 'SUCCESS',
  targetEmail,
  targetPhoneNumber,
  targetRole,
});

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
  const normalizedAuthPhone = normalizePhoneNumber(authUser?.phoneNumber);

  if (!emailLower) {
    throw new SessionAccessError('MISSING_EMAIL', ACCESS_DENIED_MESSAGES.MISSING_EMAIL);
  }

  const existingProfile = await getUserProfileDocument(authUser.uid);
  if (existingProfile) {
    return validateUserAccess(existingProfile);
  }

  const userReference = getUserReference(authUser.uid);
  const emailLockReference = getIdentityLockReference(
    buildIdentityDocumentId(IDENTITY_TYPES.EMAIL, emailLower),
  );
  const phoneLockReference = normalizedAuthPhone
    ? getIdentityLockReference(buildIdentityDocumentId(IDENTITY_TYPES.PHONE, normalizedAuthPhone))
    : null;
  const auditLogsCollection = collection(db, AUDIT_LOGS_COLLECTION);

  await runTransaction(db, async (transaction) => {
    const existingUserSnapshot = await transaction.get(userReference);
    if (existingUserSnapshot.exists()) {
      validateUserAccess(existingUserSnapshot.data());
      return;
    }

    const emailLockSnapshot = await transaction.get(emailLockReference);
    const emailLock = emailLockSnapshot.exists() ? emailLockSnapshot.data() : null;

    if (
      emailLock
      && emailLock.status === IDENTITY_LOCK_STATUSES.LOCKED
      && emailLock.reason === IDENTITY_LOCK_REASONS.ADMIN_INVITE
      && emailLock.role === USER_ROLES.ADMIN
      && !emailLock.uid
      && emailLock.inviteId
    ) {
      const inviteReference = getAdminInviteReference(emailLock.inviteId);
      const inviteSnapshot = await transaction.get(inviteReference);

      if (!inviteSnapshot.exists()) {
        throw new SessionAccessError(
          'ADMIN_INVITE_INVALID',
          ACCESS_DENIED_MESSAGES.ADMIN_INVITE_INVALID,
        );
      }

      const invite = inviteSnapshot.data();

      if (
        invite.status !== ADMIN_INVITE_STATUSES.PENDING
        || inviteExpired(invite)
        || normalizeEmail(invite.emailLower || invite.email) !== emailLower
      ) {
        throw new SessionAccessError(
          'ADMIN_INVITE_INVALID',
          ACCESS_DENIED_MESSAGES.ADMIN_INVITE_INVALID,
        );
      }

      const invitePhone = normalizePhoneNumber(invite.phoneNumber);
      const invitedPhoneLockReference = invitePhone
        ? getIdentityLockReference(buildIdentityDocumentId(IDENTITY_TYPES.PHONE, invitePhone))
        : null;
      const invitedPhoneLockSnapshot = invitedPhoneLockReference
        ? await transaction.get(invitedPhoneLockReference)
        : null;
      const invitedPhoneLock = invitedPhoneLockSnapshot?.exists()
        ? invitedPhoneLockSnapshot.data()
        : null;

      if (
        invitedPhoneLock
        && invitedPhoneLock.uid
        && invitedPhoneLock.uid !== authUser.uid
      ) {
        throw new SessionAccessError('PHONE_IN_USE', ACCESS_DENIED_MESSAGES.PHONE_IN_USE);
      }

      transaction.set(userReference, createUserProfile({
        authUser,
        createdBy: invite.invitedBy || null,
        phoneNumber: invitePhone || null,
        role: USER_ROLES.ADMIN,
      }));

      transaction.set(emailLockReference, buildIdentityLockPayload({
        existingLock: emailLock,
        inviteId: emailLock.inviteId,
        lockedBy: invite.invitedBy || 'system',
        reason: IDENTITY_LOCK_REASONS.ACTIVE_ACCOUNT,
        role: USER_ROLES.ADMIN,
        type: IDENTITY_TYPES.EMAIL,
        uid: authUser.uid,
        value: emailLower,
      }), { merge: true });

      if (invitePhone && invitedPhoneLockReference) {
        transaction.set(invitedPhoneLockReference, buildIdentityLockPayload({
          existingLock: invitedPhoneLock,
          inviteId: emailLock.inviteId,
          lockedBy: invite.invitedBy || 'system',
          reason: IDENTITY_LOCK_REASONS.ACTIVE_ACCOUNT,
          role: USER_ROLES.ADMIN,
          type: IDENTITY_TYPES.PHONE,
          uid: authUser.uid,
          value: invitePhone,
        }), { merge: true });
      }

      transaction.update(inviteReference, {
        acceptedAt: serverTimestamp(),
        acceptedByUid: authUser.uid,
        status: ADMIN_INVITE_STATUSES.ACCEPTED,
        updatedAt: serverTimestamp(),
      });

      transaction.set(doc(auditLogsCollection), buildAuditLogPayload({
        action: 'ADMIN_INVITE_ACCEPTED',
        invitedBy: invite.invitedBy || null,
        performedBy: authUser.uid,
        performedByRole: USER_ROLES.ADMIN,
        targetEmail: emailLower,
        targetPhoneNumber: invitePhone || null,
        targetRole: USER_ROLES.ADMIN,
      }));
      return;
    }

    if (emailLock && emailLock.status === IDENTITY_LOCK_STATUSES.LOCKED && emailLock.uid !== authUser.uid) {
      throw new SessionAccessError('EMAIL_IN_USE', ACCESS_DENIED_MESSAGES.EMAIL_IN_USE);
    }

    let phoneLock = null;
    if (phoneLockReference) {
      const phoneLockSnapshot = await transaction.get(phoneLockReference);
      phoneLock = phoneLockSnapshot.exists() ? phoneLockSnapshot.data() : null;
    }

    if (phoneLock && phoneLock.status === IDENTITY_LOCK_STATUSES.LOCKED && phoneLock.uid !== authUser.uid) {
      throw new SessionAccessError('PHONE_IN_USE', ACCESS_DENIED_MESSAGES.PHONE_IN_USE);
    }

    transaction.set(userReference, createUserProfile({ authUser }));
    transaction.set(emailLockReference, buildIdentityLockPayload({
      existingLock: emailLock,
      lockedBy: 'system',
      role: USER_ROLES.USER,
      type: IDENTITY_TYPES.EMAIL,
      uid: authUser.uid,
      value: emailLower,
    }), { merge: true });

    if (normalizedAuthPhone && phoneLockReference) {
      transaction.set(phoneLockReference, buildIdentityLockPayload({
        existingLock: phoneLock,
        lockedBy: 'system',
        role: USER_ROLES.USER,
        type: IDENTITY_TYPES.PHONE,
        uid: authUser.uid,
        value: normalizedAuthPhone,
      }), { merge: true });
    }
  });

  const createdProfile = await getUserProfileDocument(authUser.uid);
  return validateUserAccess(createdProfile);
};

export const resolveAuthSession = async (authUser) => {
  const userProfile = await ensureUserSession(authUser);
  return buildSessionViewer(authUser, userProfile);
};

export const updateCurrentUserProfile = async ({ name, phoneNumber }) => {
  const authUser = auth.currentUser;

  if (!authUser) {
    throw new SessionAccessError(
      'REGISTRATION_FAILED',
      ACCESS_DENIED_MESSAGES.REGISTRATION_FAILED,
    );
  }

  const existingProfile = validateUserAccess(await getUserProfileDocument(authUser.uid));
  const trimmedName = toTitleCase(name)
    || toTitleCase(existingProfile.name)
    || toTitleCase(authUser.displayName)
    || authUser.email
    || 'SoulSync User';
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const currentPhone = existingProfile.phoneNumber || '';
  const wantsToSetPhone = !currentPhone && Boolean(phoneNumber?.trim());

  if (wantsToSetPhone && !isValidPhoneNumber(phoneNumber)) {
    throw new SessionAccessError('PHONE_INVALID', ACCESS_DENIED_MESSAGES.PHONE_INVALID);
  }

  if (currentPhone && normalizedPhone && normalizedPhone !== currentPhone) {
    throw new SessionAccessError('PHONE_LOCKED', ACCESS_DENIED_MESSAGES.PHONE_LOCKED);
  }

  if (currentPhone && !normalizedPhone) {
    throw new SessionAccessError('PHONE_LOCKED', ACCESS_DENIED_MESSAGES.PHONE_LOCKED);
  }

  const nextPhone = currentPhone || normalizedPhone || null;
  const userReference = getUserReference(authUser.uid);
  const phoneLockDocumentId = nextPhone
    ? buildIdentityDocumentId(IDENTITY_TYPES.PHONE, nextPhone)
    : null;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userReference);
    if (!snapshot.exists()) {
      throw new SessionAccessError(
        'REGISTRATION_FAILED',
        ACCESS_DENIED_MESSAGES.REGISTRATION_FAILED,
      );
    }

    validateUserAccess(snapshot.data());

    if (phoneLockDocumentId) {
      const phoneLockReference = getIdentityLockReference(phoneLockDocumentId);
      const phoneLockSnapshot = await transaction.get(phoneLockReference);
      const existingLock = phoneLockSnapshot.exists() ? phoneLockSnapshot.data() : null;

      if (existingLock && existingLock.uid && existingLock.uid !== authUser.uid) {
        throw new SessionAccessError('PHONE_IN_USE', ACCESS_DENIED_MESSAGES.PHONE_IN_USE);
      }

      if (existingLock && !existingLock.uid) {
        throw new SessionAccessError('PHONE_IN_USE', ACCESS_DENIED_MESSAGES.PHONE_IN_USE);
      }

      transaction.set(
        phoneLockReference,
        buildIdentityLockPayload({
          existingLock,
          lockedBy: 'system',
          role: existingProfile.role,
          type: IDENTITY_TYPES.PHONE,
          uid: authUser.uid,
          value: nextPhone,
        }),
        { merge: true },
      );
    }

    transaction.update(userReference, {
      name: trimmedName,
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
