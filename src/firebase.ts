import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
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

const firebaseConfig = {
  apiKey: "AIzaSyAfL6z1wyRAmI07-cDb11cLf1s-6hCSIvM",
  authDomain: "myapp-59c7a.firebaseapp.com",
  databaseURL: "https://myapp-59c7a-default-rtdb.firebaseio.com",
  projectId: "myapp-59c7a",
  storageBucket: "myapp-59c7a.firebasestorage.app",
  messagingSenderId: "367383957201",
  appId: "1:367383957201:web:3d87ce87ffe814dcfffff0",
  measurementId: "G-06Z7472FD7"
};

export const ADMIN_EMAIL = 'admin@ayoub-social.com';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let initError: string | null = null;

try {
  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
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
  text?: string;
  url?: string;
  path?: string;
  t?: Timestamp | { toDate?: () => Date } | null;
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

// Create new post with optional file
export async function createPost(
  type: 'text' | 'image' | 'video' | 'code',
  text: string,
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
