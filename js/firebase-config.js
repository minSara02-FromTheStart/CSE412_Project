import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJOWu8ZYEyUms8nF1uVBw2m9v4ApNaT4s",
  authDomain: "nutrinest-408d4.firebaseapp.com",
  projectId: "nutrinest-408d4",
  storageBucket: "nutrinest-408d4.firebasestorage.app",
  messagingSenderId: "44196278510",
  appId: "1:44196278510:web:11acb64840e2d536c843ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };