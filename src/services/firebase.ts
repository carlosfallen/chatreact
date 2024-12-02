//firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported  } from 'firebase/messaging';

// Sua configuração do Firebase (copie do console Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDULf3XSwiiFQZ7q_M9YNieDbWZNLnO7Nw",
  authDomain: "myapp-415315.firebaseapp.com",
  databaseURL: "https://myapp-415315-default-rtdb.firebaseio.com",
  projectId: "myapp-415315",
  storageBucket: "myapp-415315.appspot.com",
  messagingSenderId: "103002319588",
  appId: "1:103002319588:web:a7caa54fec61d6054e1af1",
  measurementId: "G-MF8RWB6FGX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
  
// Exportar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
// Função para inicializar messaging
export const initMessaging = async () => {
  if (await isSupported()) {
    return getMessaging(app);
  }
  return null;
};