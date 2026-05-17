/**
 * Smoke test: anonymous auth + write/delete under rooms/{id} (matches game paths).
 * Run: node scripts/verify-firestore.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { deleteDoc, doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const path = join(root, ".env");
  if (!existsSync(path)) {
    console.error("Missing .env in project root.");
    process.exit(1);
  }
  const raw = readFileSync(path, "utf8");
  const kv = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    kv[k] = v;
  }
  const required = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
  ];
  for (const k of required) {
    if (!kv[k]) {
      console.error(`Missing ${k} in .env`);
      process.exit(1);
    }
  }
  return {
    apiKey: kv.VITE_FIREBASE_API_KEY,
    authDomain: kv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: kv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: kv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: kv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: kv.VITE_FIREBASE_APP_ID,
  };
}

const firebaseConfig = loadEnv();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const testRoomId = "_verify_skyfall";

try {
  await signInAnonymously(auth);
  const roomRef = doc(db, "rooms", testRoomId);
  await setDoc(roomRef, {
    ok: true,
    at: serverTimestamp(),
  });
  await deleteDoc(roomRef);
  console.log("OK — Firestore rules allow authenticated read/write on rooms/{roomId}.");
  process.exit(0);
} catch (e) {
  const msg = e && typeof e === "object" && "code" in e ? `${e.code}: ${e.message}` : String(e);
  console.error("FAILED:", msg);
  if (String(msg).includes("permission")) {
    console.error(
      "\nHint: Publish Firestore rules that allow access for request.auth != null on rooms and subcollections.",
    );
  }
  process.exit(1);
}
