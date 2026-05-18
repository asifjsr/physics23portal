import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAiC7aLG5i91Jk7xQag8AHFmPctzQr66g4",
  authDomain: "physics-23-portal.firebaseapp.com",
  projectId: "physics-23-portal",
  storageBucket: "physics-23-portal.firebasestorage.app",
  messagingSenderId: "612698409872",
  appId: "1:612698409872:web:0693968258b338f1ccc115",
  measurementId: "G-3GED52HYE5"
};

// Initialize Firebase App only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize modular services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
