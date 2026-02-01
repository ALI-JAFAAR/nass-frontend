import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";

// Placeholder: put your Web Push public VAPID key here if you are not using .env
// Go to Firebase Console → Project settings → Cloud Messaging → Web Push certificates
// and copy the "Public key" value, then replace the string below.
const DEFAULT_VAPID_KEY = "BJQ4BTRj6GZEjTf48ZTmGfbCCAzg8MIyjccTF2ft3gpA2HFVPFfX9uhAxefDMhrWUE6VMR_Uhbi4JBKfxZ88lOc";

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || "AIzaSyCRVvZCAF_msHP6i7SS27gzRL9--JRsoUk",
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || "deeratna-market.firebaseapp.com",
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || "deeratna-market",
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || "deeratna-market.firebasestorage.app",
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "243995563526",
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || "1:243995563526:web:ad5f4bf54f8f070dabd587",
};

let messagingInstance: Messaging | null = null;

export async function ensureFirebase(): Promise<Messaging | null> {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const app = initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

export async function getFcmToken(vapidKey?: string): Promise<string | null> {
  const messaging = await ensureFirebase();
  if (!messaging) return null;
  try {
    // Register service worker if not already
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      // Request permission before token
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission !== "granted") return null;
      const token = await getToken(messaging, {
        vapidKey:
          vapidKey ||
          ((import.meta.env as any).VITE_FIREBASE_VAPID_KEY as string) ||
          DEFAULT_VAPID_KEY ||
          undefined,
        serviceWorkerRegistration: reg,
      });
      return token || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function subscribeForeground(handler: (payload: any) => void) {
  // no-op; replaced by async version below
}

export async function subscribeForegroundAsync(handler: (payload: any) => void) {
  const messaging = await ensureFirebase();
  if (!messaging) return;
  onMessage(messaging, (payload) => handler(payload));
}

export default { ensureFirebase, getFcmToken, subscribeForeground };


