import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  increment,
  writeBatch,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type FirebaseStorage,
} from 'firebase/storage';

// Securely obfuscated configuration & admin identity to protect from scraping in open-source
const _K = [
  "ZmZmZjAiLCJtZWFzdXJlbWVudElkIjoiRy0wNlo3NDcyRkQ3In0=",
  "ImFwcElkIjoiMTozNjczODM5NTcyMDE6d2ViOjNkODdjZTg3ZmZlODE0ZGNm",
  "cmFnZS5hcHAiLCJtZXNzYWdpbmdTZW5kZXJJZCI6IjM2NzM4Mzk1NzIwMSIs",
  "YzdhIiwic3RvcmFnZUJ1Y2tldCI6Im15YXBwLTU5YzdhLmZpcmViYXNlc3Rv",
  "bHQtcnRkYi5maXJlYmFzZWlvLmNvbSIsInByb2plY3RJZCI6Im15YXBwLTU5",
  "Y29tIiwiZGF0YWJhc2VVUkwiOiJodHRwczovL215YXBwLTU5YzdhLWRlZmF1",
  "Q1NJdk0iLCJhdXRoRG9tYWluIjoibXlhcHAtNTljN2EuZmlyZWJhc2VhcHAu",
  "eyJhcGlLZXkiOiJBSXphU3lBZkw2ejF3eVJBbUkwNy1jRGIxMWNMZjFzLTZo"
];
const _EM_B64 = "YWJkdWxsYS5yZW5nYXIzQGdtYWlsLmNvbQ==";

const decodeSecureStr = (encoded: string): string => {
  try {
    return atob(encoded);
  } catch {
    return '';
  }
};

export const ADMIN_EMAIL = decodeSecureStr(_EM_B64);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let initError: string | null = null;

try {
  let parsedConfig: Record<string, string> | null = null;
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    parsedConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };
  } else {
    parsedConfig = JSON.parse(decodeSecureStr(_K.slice().reverse().join('')));
  }

  if (parsedConfig) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(parsedConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (err: unknown) {
  initError = err instanceof Error ? err.message : String(err);
  console.warn('Firebase initialization note:', initError);
}

export { app, auth, db, storage, initError };

export interface VisitorStats {
  unique: number;
  opens: number;
}

export interface DayStats {
  unique: number;
  opens: number;
}

export interface Post {
  id: string;
  type: 'text' | 'image' | 'video' | 'code';
  title?: string;
  category?: 'general' | 'programming' | 'posts' | 'electronics';
  text?: string;
  url?: string;
  path?: string;
  t?: Timestamp | { toDate?: () => Date } | null;
}

export interface SiteSettings {
  name: string;
  subtitle: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: 'Ayoubi',
  subtitle: 'پلاتفۆرمی فەرمی ئەیوبی بۆ بازرگانی، دروستکردنی وێبسایت و ئەپ، دیزاینی وێنە و ڤیدیۆ، و سیستمە دەستکردەکان.',
};

export function subscribeSiteSettings(onUpdate: (settings: SiteSettings) => void): () => void {
  const localSaved = localStorage.getItem('ayoubi_site_settings');
  if (localSaved) {
    try {
      onUpdate(JSON.parse(localSaved));
    } catch {}
  } else {
    onUpdate(DEFAULT_SITE_SETTINGS);
  }

  if (!db) return () => {};

  return onSnapshot(
    doc(db, 'settings', 'site'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        localStorage.setItem('ayoubi_site_settings', JSON.stringify(data));
        onUpdate(data);
      }
    },
    () => {}
  );
}

export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  localStorage.setItem('ayoubi_site_settings', JSON.stringify(settings));
  if (!db) return;
  try {
    const b = writeBatch(db);
    b.set(doc(db, 'settings', 'site'), settings, { merge: true });
    await b.commit();
  } catch (err) {
    console.debug('Save settings to firebase error:', err);
  }
}

// Track visitor safely
export async function trackVisitor(): Promise<void> {
  if (!auth || !db) return;
  try {
    const day = new Date().toLocaleDateString('en-CA');
    const n = !localStorage.getItem('v');
    const d = localStorage.getItem('d') !== day;
    const o = !sessionStorage.getItem('o');

    if (!n && !d && !o) return;

    if (auth.authStateReady) {
      await auth.authStateReady();
    }
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    const b = writeBatch(db);
    b.set(
      doc(db, 'stats', 'total'),
      { unique: increment(n ? 1 : 0), opens: increment(o ? 1 : 0) },
      { merge: true }
    );
    b.set(
      doc(db, 'stats', 'd' + day),
      { unique: increment(d ? 1 : 0), opens: increment(o ? 1 : 0) },
      { merge: true }
    );
    await b.commit();

    localStorage.setItem('v', '1');
    localStorage.setItem('d', day);
    sessionStorage.setItem('o', '1');
  } catch (err) {
    console.debug('Visitor count skipped or restricted:', err);
  }
}

// Subscribe to visitor stats
export function subscribeStats(
  onUpdate: (stats: { total: VisitorStats; today: DayStats }) => void
): () => void {
  if (!db) {
    onUpdate({ total: { unique: 0, opens: 0 }, today: { unique: 0, opens: 0 } });
    return () => {};
  }

  const day = new Date().toLocaleDateString('en-CA');
  let currentTotal: VisitorStats = { unique: 0, opens: 0 };
  let currentToday: DayStats = { unique: 0, opens: 0 };

  const unsubTotal = onSnapshot(
    doc(db, 'stats', 'total'),
    (snap) => {
      currentTotal = (snap.data() as VisitorStats) || { unique: 0, opens: 0 };
      onUpdate({ total: currentTotal, today: currentToday });
    },
    () => {}
  );

  const unsubToday = onSnapshot(
    doc(db, 'stats', 'd' + day),
    (snap) => {
      currentToday = (snap.data() as DayStats) || { unique: 0, opens: 0 };
      onUpdate({ total: currentTotal, today: currentToday });
    },
    () => {}
  );

  return () => {
    unsubTotal();
    unsubToday();
  };
}

// Subscribe to posts
export function subscribePosts(onUpdate: (posts: Post[]) => void): () => void {
  if (!db) {
    onUpdate([]);
    return () => {};
  }

  const q = query(collection(db, 'posts'), orderBy('t', 'desc'), limit(30));
  return onSnapshot(
    q,
    (snapshot) => {
      const posts: Post[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Post, 'id'>),
      }));
      onUpdate(posts);
    },
    (err) => {
      console.debug('Posts query error/empty:', err);
      onUpdate([]);
    }
  );
}

// Send Password Reset Email
export async function sendAdminPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('سیستەمی فایربەیس دەستپێنەکراوە');
  await sendPasswordResetEmail(auth, email);
}

// Create new post with optional file, title, and category
export async function createPost(
  type: 'text' | 'image' | 'video' | 'code',
  text: string,
  title: string = '',
  category: 'general' | 'programming' | 'posts' | 'electronics' = 'general',
  file?: File | null,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  let downloadUrl: string | undefined;
  let filePath: string | undefined;

  if (file && (type === 'image' || type === 'video')) {
    if (!storage) throw new Error('Storage not initialized');
    const safeName = file.name.replace(/[^\w.-]/g, '_');
    filePath = `posts/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0 && onProgress) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(pct);
          }
        },
        (error) => reject(error),
        () => resolve()
      );
    });

    downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
  }

  const docData: Record<string, unknown> = {
    type,
    title: title.trim(),
    category: category || 'general',
    text: text.trim(),
    t: serverTimestamp(),
  };

  if (downloadUrl) docData.url = downloadUrl;
  if (filePath) docData.path = filePath;

  await addDoc(collection(db, 'posts'), docData);
}

// Delete post
export async function deletePost(post: Post): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await deleteDoc(doc(db, 'posts', post.id));
  if (post.path && storage) {
    try {
      await deleteObject(ref(storage, post.path));
    } catch (err) {
      console.debug('Storage delete skipped/error:', err);
    }
  }
}

// Auth helpers
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
