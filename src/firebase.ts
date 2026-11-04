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
  'https://script.google.com/macros/s/AKfycbyZemTXs24vWzkQRmZY3VDLCFBPiHVHIqlNfWBQ-YrjvWAQxwykjfV6621v8Vy7PqFBzw/exec';

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
    return `https://lh3.googleusercontent.com/d/${fileId}=s1200`;
  }
  return url;
}

export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadToGoogleDrive(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; fileId?: string; backupUrl?: string }> {
  if (onProgress) onProgress(15);

  // Images are stored inside the database itself (compressed). This always works for every
  // visitor, unlike Drive links that need public sharing and are often blocked as hotlinks.
  if (file.type.startsWith('image/')) {
    let inline: string | null = null;
    const steps: Array<[number, number]> = [[1280, 0.8], [1100, 0.72], [900, 0.65], [720, 0.55], [560, 0.5]];
    for (const [w, q] of steps) {
      try {
        inline = await compressImage(file, w, q);
      } catch (err) {
        console.debug('Compression notice:', err);
      }
      if (inline && inline.length <= 640000) break;
    }
    if (inline && inline.startsWith('data:image/jpeg') && inline.length <= 900000) {
      if (onProgress) onProgress(100);
      return { url: inline };
    }
    if (onProgress) onProgress(100);
    throw new Error('وێنەکەت زۆر گەورەیە یان جۆرەکەی پشتگیری ناکرێت، تکایە وێنەیەکی تر (JPG یان PNG) هەڵبژێرە');
  }

  // Other files (video): Google Drive Apps Script
  try {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.includes(',') ? res.split(',')[1] : res);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    if (onProgress) onProgress(70);

    const res = await fetch(GOOGLE_DRIVE_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (onProgress) onProgress(88);

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      if (text.startsWith('http')) data = { url: text.trim() };
    }

    const fileId = (data.fileId || data.id || data.file_id || '') as string;
    let driveUrl = (data.url || data.fileUrl || data.downloadUrl || data.viewUrl || '') as string;
    if (!driveUrl && fileId) driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    if (driveUrl) {
      if (onProgress) onProgress(100);
      return { url: driveUrl, fileId: fileId || undefined };
    }
  } catch (driveErr) {
    console.warn('Google Drive Apps Script upload warning:', driveErr);
  }

  if (onProgress) onProgress(100);
  throw new Error('نەتوانرا فایلەکە باربکرێت بۆ گووگڵ درایڤ. تکایە دووبارە هەوڵبدەرەوە.');
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
  backupUrl?: string;
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

export const safeStorage = {
  get: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },
  getSession: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setSession: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch {}
  },
  removeSession: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {}
  },
};

export function formatPostDate(t: unknown): string {
  if (!t) return '';
  try {
    let date: Date | null = null;
    if (typeof t === 'object' && t !== null) {
      if ('toDate' in t && typeof (t as { toDate?: () => Date }).toDate === 'function') {
        date = (t as { toDate: () => Date }).toDate();
      } else if ('seconds' in t && typeof (t as { seconds?: number }).seconds === 'number') {
        date = new Date((t as { seconds: number }).seconds * 1000);
      }
    } else if (typeof t === 'number') {
      date = new Date(t);
    } else if (typeof t === 'string') {
      date = new Date(t);
    }

    if (!date || isNaN(date.getTime())) return '';

    try {
      return date.toLocaleDateString('ckb-IQ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      try {
        return date.toLocaleDateString('ar-IQ', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      }
    }
  } catch {
    return '';
  }
}

export function subscribeSiteSettings(onUpdate: (settings: SiteSettings) => void): () => void {
  const localSaved = safeStorage.get('ayoubi_site_settings');
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
        safeStorage.set('ayoubi_site_settings', JSON.stringify(data));
        onUpdate(data);
      }
    },
    () => {}
  );
}

export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  safeStorage.set('ayoubi_site_settings', JSON.stringify(settings));
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
    const n = !safeStorage.get('v');
    const d = safeStorage.get('d') !== day;
    const o = !safeStorage.getSession('o');

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

    safeStorage.set('v', '1');
    safeStorage.set('d', day);
    safeStorage.setSession('o', '1');
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

// Create new post with optional file, title, category, and directUrl
export async function createPost(
  type: 'text' | 'image' | 'video' | 'code',
  text: string,
  title: string = '',
  category: 'general' | 'programming' | 'posts' | 'electronics' = 'general',
  file?: File | null,
  onProgress?: (pct: number) => void,
  directUrl?: string,
  preloadedData?: { url: string; fileId?: string; backupUrl?: string } | null
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  let downloadUrl: string | undefined = directUrl?.trim();
  let filePath: string | undefined;
  let backupUrl: string | undefined;

  if (preloadedData && preloadedData.url) {
    downloadUrl = preloadedData.url;
    filePath = preloadedData.fileId;
    backupUrl = preloadedData.backupUrl;
  } else if (file && (type === 'image' || type === 'video')) {
    const uploadRes = await uploadToGoogleDrive(file, onProgress);
    downloadUrl = uploadRes.url;
    filePath = uploadRes.fileId;
    backupUrl = uploadRes.backupUrl;
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
  if (backupUrl) docData.backupUrl = backupUrl;

  await addDoc(collection(db, 'posts'), docData);
}

// Delete post
export async function deletePost(post: Post): Promise<void> {
  if (!db) throw new Error('سیستەمی داتابەیس دەستپێنەکراوە');

  if (auth) {
    if (auth.authStateReady) {
      await auth.authStateReady();
    }
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.debug('Anon auth note during delete:', err);
      }
    }
  }

  await deleteDoc(doc(db, 'posts', post.id));
}

// Auth helpers
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
