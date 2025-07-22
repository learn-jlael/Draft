// ==========================================
// CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDJHGhlZptKnE_um5l9KOjcZHcq6U0iIQE",
    authDomain: "draft-sls.firebaseapp.com",
    databaseURL: "https://draft-sls-default-rtdb.firebaseio.com",
    projectId: "draft-sls",
    storageBucket: "draft-sls.firebasestorage.app",
    messagingSenderId: "721078818051",
    appId: "1:721078818051:web:be9461a00a95b6f1e30536"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();