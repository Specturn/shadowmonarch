import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAK5DS4dixAQWwJ8kms2JiKr738PPKFdA4",
    authDomain: "shadowmonarch-f4a17.firebaseapp.com",
    projectId: "shadowmonarch-f4a17",
    storageBucket: "shadowmonarch-f4a17.appspot.com",
    messagingSenderId: "524012291883",
    appId: "1:524012291883:web:be243162b1c0912090276e",
    measurementId: "G-6EVHJ6EDPJ"
};

const fbApp = initializeApp(firebaseConfig);
export const auth = getAuth(fbApp);
export const db = getFirestore(fbApp);
export const provider = new GoogleAuthProvider();