import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const messaging = getMessaging();

      // Tenta obter o token de notificação existente
      const existingToken = await getToken(messaging, {
        vapidKey: 'BE_ELaaoKuBN-zU9fTTE63RpEvIaS1_z1NMJycGez2nfa18Dm00nIMdctLVbgdjHWtUx3KJ0HSk1pCTO8jHxNp0'
      });

      if (existingToken) {
        // Se o token já existir, apenas salva no Firestore
        await saveNotificationToken(existingToken);
        return existingToken;
      } else {
        // Caso não haja token, gera e salva um novo
        const token = await getToken(messaging, {
          vapidKey: 'BE_ELaaoKuBN-zU9fTTE63RpEvIaS1_z1NMJycGez2nfa18Dm00nIMdctLVbgdjHWtUx3KJ0HSk1pCTO8jHxNp0'
        });
        await saveNotificationToken(token);
        return token;
      }
    } else {
      console.warn('Permissão de notificação negada');
      return false;
    }
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return false;
  }
};

export const setupMessageListener = () => {
  try {
    const messaging = getMessaging();
    console.log('DEBUG: Messaging inicializado:', messaging);

    // Listener para mensagens em primeiro plano
    onMessage(messaging, (payload) => {
      console.log('DEBUG: Mensagem recebida em primeiro plano:', payload);
    
      if (Notification.permission === 'granted') {
        console.log('Permissão para notificações não concedida.');
        new Notification(payload.notification?.title || 'Nova Mensagem', {
          body: payload.notification?.body || 'Você tem uma nova mensagem',
          icon: payload.notification?.icon || '/path/to/icon.png'
        });
      } else {
        console.log('Permissão para notificações não concedida.');
      }
    });    

    console.log('DEBUG: Listener de mensagens configurado com sucesso');
  } catch (error) {
    console.error('ERRO CRÍTICO ao configurar listener de mensagens:', error);
  }
};

export const saveNotificationToken = async (token: string) => {
  try {
    if (auth.currentUser) {
      console.log('DEBUG: Salvando token para usuário:', auth.currentUser.uid);

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      // Atualiza ou cria o documento do usuário com o token
      if (userSnap.exists()) {
        // Atualiza o token se o usuário já existir
        await setDoc(userRef, {
          notificationToken: token,
          lastTokenUpdate: new Date()
        }, { merge: true });
        console.log('DEBUG: Token atualizado no Firestore');
      } else {
        // Cria o documento se não existir
        await setDoc(userRef, {
          notificationToken: token,
          lastTokenUpdate: new Date()
        });
        console.log('DEBUG: Token salvo com sucesso no Firestore');
      }
    } else {
      console.warn('DEBUG: Nenhum usuário autenticado para salvar o token');
    }
  } catch (error) {
    console.error('DEBUG: Erro ao salvar token:', error);
  }
};
