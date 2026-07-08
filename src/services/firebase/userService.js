import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function getUserRef(uid) {
  return doc(db, 'users', uid);
}

export function getUserLookupRef(email) {
  return doc(db, 'userLookup', normalizeEmail(email));
}

export function buildUserProfileFromAuth(user) {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    displayName: user.displayName || '',
    email: normalizeEmail(user.email || ''),
    photoURL: user.photoURL || '',
  };
}

export async function ensureUserProfile(user) {
  const profile = buildUserProfileFromAuth(user);

  if (!profile?.uid) {
    return null;
  }

  const userRef = getUserRef(profile.uid);
  const userLookupRef = getUserLookupRef(profile.email);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const newProfile = {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, newProfile);

    await setDoc(userLookupRef, {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      updatedAt: serverTimestamp(),
    });

    return {
      ...newProfile,
      createdAt: null,
      updatedAt: null,
    };
  }

  const currentData = snapshot.data();

  const shouldUpdate =
    currentData.displayName !== profile.displayName ||
    currentData.email !== profile.email ||
    currentData.photoURL !== profile.photoURL;

  if (shouldUpdate) {
    await setDoc(
      userRef,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  await setDoc(
    userLookupRef,
    {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {
    id: snapshot.id,
    ...currentData,
    ...profile,
  };
}

export async function findUserLookupByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error('El email es obligatorio.');
  }

  const snapshot = await getDoc(getUserLookupRef(normalizedEmail));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}