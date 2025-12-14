// scores.js
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";

// Guardar puntaje
export async function saveScore(score) {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, "scores"), {
    uid: user.uid,
    score,
    createdAt: serverTimestamp()
  });
}

// Obtener top scores
export async function getTopScores() {
  const q = query(
    collection(db, "scores"),
    orderBy("score", "desc"),
    limit(10)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
