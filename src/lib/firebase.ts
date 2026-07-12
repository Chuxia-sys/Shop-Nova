import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAJ5_StcpKWUARQ1C2oZQGymwl_WKEwU_w",
  authDomain: "shopnova-9aae0.firebaseapp.com",
  projectId: "shopnova-9aae0",
  storageBucket: "shopnova-9aae0.firebasestorage.app",
  messagingSenderId: "835638988070",
  appId: "1:835638988070:web:fea65d58025d19cc6d85e7",
  measurementId: "G-S617T6X3YQ",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const analytics = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;