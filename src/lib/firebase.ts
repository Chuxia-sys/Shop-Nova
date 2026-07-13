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
  apiKey: "AIzaSyCjp57qy9edq4CbZv_o7lysP5rVd2imT7I",
  authDomain: "shopnova-408ee.firebaseapp.com",
  projectId: "shopnova-408ee",
  storageBucket: "shopnova-408ee.firebasestorage.app",
  messagingSenderId: "731311210896",
  appId: "1:731311210896:web:897be354639db8351ef315",
  measurementId: "G-HNKQXYPTDB",
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