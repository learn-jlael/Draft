// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJHGhlZptKnE_um5l9KOjcZHcq6U0iIQE",
  authDomain: "draft-sls.firebaseapp.com",
  databaseURL: "https://draft-sls-default-rtdb.firebaseio.com",
  projectId: "draft-sls",
  storageBucket: "draft-sls.firebasestorage.app",
  messagingSenderId: "721078818051",
  appId: "1:721078818051:web:be9461a00a95b6f1e30536",
  measurementId: "G-596730GMNJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);