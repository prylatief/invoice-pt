import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC7Op6FZ73iJE_KRhhndjpLuQu--mltoHU",
  authDomain: "pt-lafi.firebaseapp.com",
  databaseURL: "https://pt-lafi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pt-lafi",
  storageBucket: "pt-lafi.firebasestorage.app",
  messagingSenderId: "420846987592",
  appId: "1:420846987592:web:500f157e65dd0b60f16b7d",
  measurementId: "G-CVKL5EDBBG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
