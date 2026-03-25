// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAGBEe-L1ih8Mra0VyMuPPfRK0fOKAIbcc",
    authDomain: "store-69c0e.firebaseapp.com",
    projectId: "store-69c0e",
    storageBucket: "store-69c0e.firebasestorage.app",
    messagingSenderId: "12468603299",
    appId: "1:12468603299:web:15630803170bf761caf216",
    measurementId: "G-525JWZ5XDK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, signInWithEmailAndPassword, signOut, onAuthStateChanged };
