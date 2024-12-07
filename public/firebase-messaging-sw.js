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

// No service worker (sw.js ou service-worker.js)
self.addEventListener('push', function(event) {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/logo192.png',
    badge: '/icons/badge.png',
    tag: 'chat-messages', // Para agrupar notificações
    renotify: false,
    requireInteraction: false, // No PC, mantém a notificação até ser fechada
    vibrate: [100, 50, 100], // Padrão de vibração (Android)
    sound: true // Tenta adicionar som (suporte varia)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Lidar com clique na notificação
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Fecha a notificação
  
  // Abre ou foca na janela do aplicativo
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Gerenciar mensagens recebidas em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em segundo plano:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
  };

  // Verificar se o app está ativo
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    if (clients.length === 0) {
      // Se o app não está ativo, exibir a notificação
      self.registration.showNotification(notificationTitle, notificationOptions);
    } else {
      console.log('App ativo - Ignorando notificação.');
    }
  });
});
