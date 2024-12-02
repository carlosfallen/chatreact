// Carregar as dependências do Firebase
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Inicializar o Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDULf3XSwiiFQZ7q_M9YNieDbWZNLnO7Nw",
  authDomain: "myapp-415315.firebaseapp.com",
  databaseURL: "https://myapp-415315-default-rtdb.firebaseio.com",
  projectId: "myapp-415315",
  storageBucket: "myapp-415315.appspot.com",
  messagingSenderId: "103002319588",
  appId: "1:103002319588:web:a7caa54fec61d6054e1af1",
  measurementId: "G-MF8RWB6FGX"
});

// Configurar o Firebase Messaging
const messaging = firebase.messaging();

// Adicionar listeners para o Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker Instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker Ativado');
});

// Listener para mensagens em segundo plano
messaging.onBackgroundMessage((payload) => {

});
