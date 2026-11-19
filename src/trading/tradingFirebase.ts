import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import { firebaseConfig as defaultSiteFirebaseConfig } from '../firebase';

/**
 * Isolated Firebase Configuration for /trading.
 * Uses VITE_TRADING_FIREBASE_* environment variables if provided,
 * otherwise falls back cleanly to the project's configured Firebase project.
 * NEVER hardcode any user or admin passwords here.
 */
export const tradingFirebaseConfig = {
  apiKey: import.meta.env.VITE_TRADING_FIREBASE_API_KEY || defaultSiteFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_TRADING_FIREBASE_AUTH_DOMAIN || defaultSiteFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_TRADING_FIREBASE_PROJECT_ID || defaultSiteFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_TRADING_FIREBASE_STORAGE_BUCKET || defaultSiteFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_TRADING_FIREBASE_MESSAGING_SENDER_ID || defaultSiteFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_TRADING_FIREBASE_APP_ID || defaultSiteFirebaseConfig.appId,
};

export const TRADING_ADMIN_EMAIL = 'tafteshok@gmail.com';

export function isTradingAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === TRADING_ADMIN_EMAIL;
}

const TRADING_APP_NAME = 'trading-isolated-app';

let tradingApp: FirebaseApp;
const existing = getApps().find((a) => a.name === TRADING_APP_NAME);
if (existing) {
  tradingApp = existing;
} else {
  tradingApp = initializeApp(tradingFirebaseConfig, TRADING_APP_NAME);
}

export const tradingAuth: Auth = getAuth(tradingApp);
export const tradingDb: Firestore = getFirestore(tradingApp);

// ---------------- Types ----------------

export interface TradingUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  isBlocked: boolean;
  createdAt?: Timestamp | { seconds: number; toDate?: () => Date } | null;
  updatedAt?: Timestamp | { seconds: number; toDate?: () => Date } | null;
}

export type TradeDirection = 'BUY' | 'SELL' | 'BUY LIMIT' | 'SELL LIMIT';
export type TradeStatus = 'Pending' | 'Active' | 'Won' | 'Lost';

export interface TradeSignal {
  id: string;
  uid: string;
  pair: string;
  type: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2?: number | null;
  tp3?: number | null;
  lotSize: number;
  status: TradeStatus;
  pips: number;
  riskReward: number;
  notes?: string;
  createdAt?: Timestamp | { seconds: number; toDate?: () => Date } | null;
  updatedAt?: Timestamp | { seconds: number; toDate?: () => Date } | null;
}

export interface PublicFeedSignalPayload {
  pair: string;
  type: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  tp1: number;
  tp2?: number | null;
  tp3?: number | null;
}

export interface PublicFeedPost {
  id: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  postType: 'announcement' | 'signal' | 'media';
  title: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
  signal?: PublicFeedSignalPayload | null;
  createdAt?: Timestamp | { seconds: number; toDate?: () => Date } | null;
}

// ---------------- Auth Operations ----------------

export async function loginTradingUser(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(tradingAuth, email.trim(), password);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function registerTradingUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim() || cleanEmail.split('@')[0];
  const cred = await createUserWithEmailAndPassword(tradingAuth, cleanEmail, password);
  await updateProfile(cred.user, { displayName: cleanName });

  const role: 'admin' | 'user' = isTradingAdminEmail(cleanEmail) ? 'admin' : 'user';
  await setDoc(doc(tradingDb, 'users', cred.user.uid), {
    email: cleanEmail,
    displayName: cleanName,
    role,
    isBlocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred.user;
}

export async function resetTradingPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(tradingAuth, email.trim());
}

export async function logoutTradingUser(): Promise<void> {
  await signOut(tradingAuth);
}

export async function ensureUserProfile(user: User): Promise<TradingUserProfile> {
  const ref = doc(tradingDb, 'users', user.uid);
  const snap = await getDoc(ref);
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const role: 'admin' | 'user' = isTradingAdminEmail(cleanEmail) ? 'admin' : 'user';

  if (snap.exists()) {
    const data = snap.data() as Omit<TradingUserProfile, 'uid'>;
    return {
      uid: user.uid,
      email: data.email || cleanEmail,
      displayName: data.displayName || user.displayName || cleanEmail.split('@')[0] || 'Trader',
      role: isTradingAdminEmail(cleanEmail) ? 'admin' : data.role || 'user',
      isBlocked: Boolean(data.isBlocked),
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  }

  const newProfile = {
    email: cleanEmail,
    displayName: user.displayName || cleanEmail.split('@')[0] || 'Trader',
    role,
    isBlocked: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, newProfile);
  return {
    uid: user.uid,
    email: newProfile.email,
    displayName: newProfile.displayName,
    role,
    isBlocked: false,
    createdAt: null,
    updatedAt: null,
  };
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: TradingUserProfile | null) => void,
  onError?: (err: Error) => void
): () => void {
  const ref = doc(tradingDb, 'users', uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data() as Omit<TradingUserProfile, 'uid'>;
      onData({
        uid: snap.id,
        email: data.email || '',
        displayName: data.displayName || 'Trader',
        role: isTradingAdminEmail(data.email) ? 'admin' : data.role || 'user',
        isBlocked: Boolean(data.isBlocked),
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      });
    },
    (err) => {
      console.error('Profile listener error:', err);
      if (onError) onError(err);
    }
  );
}

export async function updateUserDisplayName(uid: string, displayName: string): Promise<void> {
  const trimmed = displayName.trim().slice(0, 80);
  if (!trimmed) return;
  await updateDoc(doc(tradingDb, 'users', uid), {
    displayName: trimmed,
    updatedAt: serverTimestamp(),
  });
  if (tradingAuth.currentUser && tradingAuth.currentUser.uid === uid) {
    await updateProfile(tradingAuth.currentUser, { displayName: trimmed });
  }
}

// ---------------- Admin User Management ----------------

export function subscribeAllUsers(
  onData: (users: TradingUserProfile[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(tradingDb, 'users'), orderBy('createdAt', 'desc'), limit(200));
  let fallbackUnsub: (() => void) | null = null;

  const parseDocs = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const list: TradingUserProfile[] = docs.map((d) => {
      const data = d.data();
      const email = String(data.email || '');
      return {
        uid: d.id,
        email,
        displayName: String(data.displayName || email.split('@')[0] || 'Trader'),
        role: isTradingAdminEmail(email) ? 'admin' : data.role === 'admin' ? 'admin' : 'user',
        isBlocked: Boolean(data.isBlocked),
        createdAt: (data.createdAt as Timestamp) || null,
        updatedAt: (data.updatedAt as Timestamp) || null,
      };
    });
    onData(list);
  };

  const unsub = onSnapshot(
    q,
    (snap) => parseDocs(snap.docs),
    (err) => {
      console.warn('All users ordered query fallback:', err);
      fallbackUnsub = onSnapshot(
        query(collection(tradingDb, 'users'), limit(200)),
        (fbSnap) => parseDocs(fbSnap.docs),
        (fbErr) => {
          console.error('All users list error:', fbErr);
          if (onError) onError(fbErr);
        }
      );
    }
  );

  return () => {
    unsub();
    if (fallbackUnsub) fallbackUnsub();
  };
}

export async function setUserBlockedStatus(targetUid: string, isBlocked: boolean): Promise<void> {
  await updateDoc(doc(tradingDb, 'users', targetUid), {
    isBlocked,
    updatedAt: serverTimestamp(),
  });
}

// ---------------- Private Trades (users/{uid}/trades) ----------------

export function subscribeUserTrades(
  uid: string,
  onData: (trades: TradeSignal[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(tradingDb, 'users', uid, 'trades');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(250));
  let fallbackUnsub: (() => void) | null = null;

  const parseTrades = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const list: TradeSignal[] = docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: String(data.uid || uid),
        pair: String(data.pair || 'XAUUSD'),
        type: (data.type as TradeDirection) || 'BUY',
        entryPrice: Number(data.entryPrice || 0),
        stopLoss: Number(data.stopLoss || 0),
        tp1: Number(data.tp1 || 0),
        tp2: data.tp2 !== undefined && data.tp2 !== null && data.tp2 !== '' ? Number(data.tp2) : null,
        tp3: data.tp3 !== undefined && data.tp3 !== null && data.tp3 !== '' ? Number(data.tp3) : null,
        lotSize: Number(data.lotSize || 0.01),
        status: (data.status as TradeStatus) || 'Pending',
        pips: Number(data.pips || 0),
        riskReward: Number(data.riskReward || 0),
        notes: typeof data.notes === 'string' ? data.notes : '',
        createdAt: (data.createdAt as Timestamp) || null,
        updatedAt: (data.updatedAt as Timestamp) || null,
      };
    });

    list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
    onData(list);
  };

  const unsub = onSnapshot(
    q,
    (snap) => parseTrades(snap.docs),
    (err) => {
      console.warn('Trades ordered query fallback:', err);
      fallbackUnsub = onSnapshot(
        query(colRef, limit(250)),
        (fbSnap) => parseTrades(fbSnap.docs),
        (fbErr) => {
          console.error('Trades subscription error:', fbErr);
          if (onError) onError(fbErr);
        }
      );
    }
  );

  return () => {
    unsub();
    if (fallbackUnsub) fallbackUnsub();
  };
}

export async function addTradeSignal(
  uid: string,
  payload: Omit<TradeSignal, 'id' | 'uid' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docData: Record<string, unknown> = {
    uid,
    pair: payload.pair.trim().toUpperCase().slice(0, 20),
    type: payload.type,
    entryPrice: Number(payload.entryPrice),
    stopLoss: Number(payload.stopLoss),
    tp1: Number(payload.tp1),
    tp2: payload.tp2 !== null && payload.tp2 !== undefined ? Number(payload.tp2) : null,
    tp3: payload.tp3 !== null && payload.tp3 !== undefined ? Number(payload.tp3) : null,
    lotSize: Number(payload.lotSize),
    status: payload.status,
    pips: Number(payload.pips || 0),
    riskReward: Number(payload.riskReward || 0),
    notes: (payload.notes || '').trim().slice(0, 1000),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(tradingDb, 'users', uid, 'trades'), docData);
  return ref.id;
}

export async function updateTradeSignal(
  uid: string,
  tradeId: string,
  updates: Partial<Omit<TradeSignal, 'id' | 'uid' | 'createdAt'>>
): Promise<void> {
  const cleanUpdates: Record<string, unknown> = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  if (typeof cleanUpdates.notes === 'string') {
    cleanUpdates.notes = cleanUpdates.notes.trim().slice(0, 1000);
  }
  await updateDoc(doc(tradingDb, 'users', uid, 'trades', tradeId), cleanUpdates);
}

export async function deleteTradeSignal(uid: string, tradeId: string): Promise<void> {
  await deleteDoc(doc(tradingDb, 'users', uid, 'trades', tradeId));
}

// ---------------- Public Feed (public_posts) ----------------

export function subscribePublicPosts(
  onData: (posts: PublicFeedPost[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(tradingDb, 'public_posts');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
  let fallbackUnsub: (() => void) | null = null;

  const parsePosts = (docs: { id: string; data: () => Record<string, unknown> }[]) => {
    const list: PublicFeedPost[] = docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        authorUid: String(data.authorUid || ''),
        authorEmail: String(data.authorEmail || TRADING_ADMIN_EMAIL),
        authorName: String(data.authorName || 'Desk Admin'),
        postType: (data.postType as PublicFeedPost['postType']) || 'announcement',
        title: String(data.title || ''),
        body: String(data.body || ''),
        imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
        videoUrl: typeof data.videoUrl === 'string' ? data.videoUrl : '',
        signal: (data.signal as PublicFeedSignalPayload) || null,
        createdAt: (data.createdAt as Timestamp) || null,
      };
    });
    list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
    onData(list);
  };

  const unsub = onSnapshot(
    q,
    (snap) => parsePosts(snap.docs),
    (err) => {
      console.warn('Public posts ordered query fallback:', err);
      fallbackUnsub = onSnapshot(
        query(colRef, limit(100)),
        (fbSnap) => parsePosts(fbSnap.docs),
        (fbErr) => {
          console.error('Public posts error:', fbErr);
          if (onError) onError(fbErr);
        }
      );
    }
  );

  return () => {
    unsub();
    if (fallbackUnsub) fallbackUnsub();
  };
}

export async function createPublicPost(
  payload: Omit<PublicFeedPost, 'id' | 'createdAt'>
): Promise<string> {
  const docData: Record<string, unknown> = {
    authorUid: payload.authorUid,
    authorEmail: payload.authorEmail,
    authorName: payload.authorName.trim().slice(0, 80),
    postType: payload.postType,
    title: payload.title.trim().slice(0, 180),
    body: payload.body.trim().slice(0, 4000),
    imageUrl: (payload.imageUrl || '').trim(),
    videoUrl: (payload.videoUrl || '').trim(),
    signal: payload.signal || null,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(tradingDb, 'public_posts'), docData);
  return ref.id;
}

export async function deletePublicPost(postId: string): Promise<void> {
  await deleteDoc(doc(tradingDb, 'public_posts', postId));
}

// ---------------- Utility Helpers ----------------

export function getTimestampMs(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') return new Date(ts).getTime() || 0;
  if (typeof ts === 'object' && ts !== null) {
    if ('toDate' in ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate().getTime();
    }
    if ('seconds' in ts && typeof (ts as { seconds?: number }).seconds === 'number') {
      return (ts as { seconds: number }).seconds * 1000;
    }
  }
  return 0;
}

export function formatShortTimestamp(ts: unknown): string {
  const ms = getTimestampMs(ts);
  if (!ms) return 'Just now';
  const d = new Date(ms);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function compressTradingImage(file: File): Promise<string> {
  const steps: Array<[number, number]> = [
    [1200, 0.8],
    [960, 0.72],
    [760, 0.62],
    [600, 0.55],
  ];

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);

  for (const [maxDim, quality] of steps) {
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL('image/jpeg', quality);
    if (out.length <= 600000) return out;
  }

  throw new Error('Image is too large even after compression. Please choose a smaller image.');
}

export function mapAuthErrorMessage(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

export { onAuthStateChanged };
export type { User };
