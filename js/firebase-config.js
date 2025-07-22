// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDJHGhlZptKnE_um51...",
    authDomain: "draft-sls.firebaseapp.com",
    databaseURL: "https://draft-sls-default-rtdb.firebaseio.com",
    projectId: "draft-sls",
    storageBucket: "draft-sls.appspot.com",
    messagingSenderId: "721078818051",
    appId: "1:721078818051:web:be9461a00a95b6f1e30536",
    measurementId: "G-596730GMNJ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();