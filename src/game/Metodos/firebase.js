// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnCuU4vovraHKrcaVHzLIGwBsExcYObqM",
  authDomain: "metal-goal.firebaseapp.com",
  projectId: "metal-goal",
  storageBucket: "metal-goal.firebasestorage.app",
  messagingSenderId: "368988259606",
  appId: "1:368988259606:web:0bf8cfcab5105ac20b3c37"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const googleProvider = new GoogleAuthProvider();

// Servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

// Login anónimo (ideal para juegos)
export function initAuth() {
  return signInAnonymously(auth);
}

export function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}