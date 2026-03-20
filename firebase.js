// Shared Firebase initialization and helpers (Modular v9+)
// Replace the config below with your Firebase project settings.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_AnGX-RO7zfM_rCBopJmdv3BOVE4V-_o",
  authDomain: "media-app-a702b.firebaseapp.com",
  projectId: "media-app-a702b",
  storageBucket: "media-app-a702b.firebasestorage.app",
  messagingSenderId: "60484045851",
  appId: "1:60484045851:web:f1bb588c2d5edc177ffcbe",
  measurementId: "G-LPBXF7MLWF",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Optional: enable offline persistence (ignore failure on multi-tab)
enableIndexedDbPersistence(db).catch(() => {});

export {
  app,
  db,
  storage,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
};
