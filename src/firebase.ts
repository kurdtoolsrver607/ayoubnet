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
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAfL6z1wyRAmI07-cDb11cLf1s-6hCSIvM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "myapp-59c7a.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://myapp-59c7a-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "myapp-59c7a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "myapp-59c7a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "367383957201",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:367383957201:web:3d87ce87ffe814dcfffff0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-06Z7472FD7"
};

const _EM_B64 = "YWJkdWxsYS5yZW5nYXIzQGdtYWlsLmNvbQ==";

const decodeSecureStr = (encoded: string): string => {
  try {
    return atob(encoded);
  } catch {
    return '';
  }
};

export const ADMIN_EMAIL = decodeSecureStr(_EM_B64);

export const GOOGLE_DRIVE_WEBAPP_URL =
  import.meta.env.VITE_DRIVE_UPLOAD_URL ||
  'https://script.google.com/macros/s/AKfycbwD2sFfTxFThD7iNBx5CgDlK2HBkJBa9sNNN5yCoUXoEnz2ZWikuBYlzrTuCmlHvwv2HA/exec';

export function extractDriveFileId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getDirectDriveImageUrl(url: string): string {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}

export async function uploadToGoogleDrive(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; fileId?: string }> {
  if (onProgress) onProgress(20);

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const cleanBase64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(cleanBase64);
    };
    reader.onerror = () => reject(new Error('نەتوانرا فایلەکە بخوێندرێتەوە'));
    reader.readAsDataURL(file);
  });

  if (onProgress) onProgress(50);

  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const payload = {
    file: base64,
    base64: base64,
    name: safeName,
    filename: safeName,
    type: file.type || 'application/octet-stream',
    mimeType: file.type || 'application/octet-stream',
  };

  if (onProgress) onProgress(75);

  try {
    const res = await fetch(GOOGLE_DRIVE_WEBAPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (onProgress) onProgress(90);

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (text.startsWith('http')) {
        data = { url: text.trim() };
      }
    }

    if (data.error) {
      throw new Error(String(data.error));
    }

    const fileId = (data.fileId || data.id || data.file_id || '') as string;
    let url = (data.url || data.fileUrl || data.downloadUrl || data.viewUrl || '') as string;

    if (!url && fileId) {
      url = `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    if (!url && text.includes('drive.google.com')) {
      const match = text.match(/https:\/\/[^\s"']+/);
      if (match) url = match[0];
    }

    if (!url) {
      if (text.includes('You need permission') || text.includes('accounts.google.com')) {
        throw new Error('ڕێگەپێدانی گووگڵ درایڤ پێنەدراوە. تکایە لە پڕۆژەی Google Apps Script بەشی (Who has access) بکە بە (Anyone).');
      }
      throw new Error('نەتوانرا لینکی درایڤ لە سێرڤەرەکە وەربگیرێت.');
    }

    if (onProgress) onProgress(100);
    return { url, fileId: fileId || undefined };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      throw new Error('نەتوانرا پەیوەندی بە گووگڵ درایڤ بکرێت. تکایە دڵنیابە لە Google Apps Script کە بەشی (Who has access) کراوە بە (Anyone).');
    }
    throw new Error(msg);
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const storage = null;
let analytics: Analytics | null = null;
let initError: string | null = null;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof window !== 'undefined' && app) {
    isSupported().then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});
  }
} catch (err: unknown) {
  initError = err instanceof Error ? err.message : String(err);
  console.warn('Firebase initialization note:', initError);
}

export { app, auth, db, storage, analytics, initError };

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
    const uploadRes = await uploadToGoogleDrive(file, onProgress);
    downloadUrl = uploadRes.url;
    filePath = uploadRes.fileId;
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
}

// Auth helpers
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
