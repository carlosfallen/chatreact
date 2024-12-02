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

        const newMessage = snap.data() as { sender: string; text: string };
        const chatRoom = event.params.unique_chat_room;

        try {
            const recipientTokens = await getRecipientTokens(newMessage.sender);

            if (recipientTokens.length === 0) {
                console.warn('Nenhum token válido encontrado para destinatários.');
                return;
            }

            const messaging = getMessaging();
            const payload = {
                notification: {
                    title: 'Nova Mensagem',
                    body: `${newMessage.text}`,
                },
                data: {
                    senderId: newMessage.sender,
                    chatRoom: chatRoom,
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

// Função para buscar tokens de todos os usuários, exceto o remetente
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