import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ensureUserProfile } from './userService';

const googleProvider = new GoogleAuthProvider();

export async function registerWithEmail({ name, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (name?.trim()) {
    await updateProfile(credential.user, {
      displayName: name.trim(),
    });

    await credential.user.reload();
  }

  const user = auth.currentUser || credential.user;
  await ensureUserProfile(user);

  return user;
}

export async function loginWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);

  return credential.user;
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(credential.user);

  return credential.user;
}

export async function logout() {
  await signOut(auth);
}