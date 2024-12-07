import * as functions from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

admin.initializeApp();

export const sendNotificationOnNewMessage = functions.onDocumentCreated(
    'chats/{unique_chat_room}/messages/{messageId}',
    async (event) => {
        console.log('--- Evento disparado: Novo documento criado em mensagens ---');
        
        const snap = event.data;
        if (!snap) {
            console.error('Nenhum dado encontrado no snapshot.');
            return;
        }

        const newMessage = snap.data() as { sender: string; text: string; senderName?: string };
        const chatRoom = event.params.unique_chat_room;

        // Buscar o nome do usuário caso não esteja na mensagem
        const senderName = newMessage.senderName || await getSenderName(newMessage.sender);

        try {
            const recipientTokens = await getRecipientTokens(newMessage.sender);

            if (recipientTokens.length === 0) {
                console.warn('Nenhum token válido encontrado para destinatários.');
                return;
            }

            const messaging = getMessaging();
            const payload = {
                notification: {
                    title: senderName || 'Usuário',
                    body: newMessage.text,
                },
                data: {
                    sender: newMessage.sender || '',
                    chatRoom: chatRoom || '',
                    senderName: senderName || 'Usuário',
                    text: newMessage.text || '',
                    timestamp: Date.now().toString()
                },
            };

            const sendPromises = recipientTokens.map(token => 
                messaging.send({ ...payload, token })
            );

            const responses = await Promise.all(sendPromises);
            console.log('Notificações enviadas com sucesso:', responses);
        } catch (error) {
            console.error('Erro ao enviar notificações:', error);
        }
    }
);

// Função para buscar o nome do usuário no Firestore
async function getSenderName(senderId: string): Promise<string> {
    try {
        const userDoc = await admin.firestore().collection('users').doc(senderId).get();
        return userDoc.data()?.displayName || 'Usuário';
    } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
        return 'Usuário';
    }
}

async function getRecipientTokens(senderId: string): Promise<string[]> {
    const usersCollection = admin.firestore().collection('users');
    const querySnapshot = await usersCollection.get();

    const tokens: string[] = [];
    querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.notificationToken && doc.id !== senderId) {
            tokens.push(data.notificationToken);
        }
    });

    return tokens;
}