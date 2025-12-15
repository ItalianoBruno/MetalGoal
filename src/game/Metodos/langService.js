import { db, auth } from "./firebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function saveUserLang(lang) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, "users", user.uid), {
    lang
  }, { merge: true });
}

export async function loadUserLang() {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? snap.data().lang : null;
}
