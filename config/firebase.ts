// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; 


// Your web app's Firebase configuration
// Get this from Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyCimKADk_GWjW0uM0K7PLn_ZXcXoU7yW3I",
  authDomain: "convergent-3fd2a.firebaseapp.com",
  databaseURL: "https://convergent-3fd2a-default-rtdb.firebaseio.com",
  projectId: "convergent-3fd2a",
  storageBucket: "convergent-3fd2a.firebasestorage.app",
  messagingSenderId: "164106811953",
  appId: "1:164106811953:web:6887f7effc50c605f87310",
  measurementId: "G-02HH61FRSP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export const database = getDatabase(app);

export default app;