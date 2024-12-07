import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Send } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  limit,
  serverTimestamp, 
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { requestNotificationPermission } from '../services/notifications';

interface User {
  id: string;
  displayName: string;
  email?: string;
  notificationToken?: string;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  recipient?: string;
  timestamp: any;
}

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]); // Lista de usuários
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const currentUser = auth.currentUser;
  const CHAT_ID = 'unique_chat_room';
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp: any) => {
    const date = timestamp?.toDate();
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as User));

      setUsers(usersList);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  useEffect(() => {
    fetchUsers();

    const initNotifications = async () => {
      try {
        const token = await requestNotificationPermission();
      } catch (error) {
        console.error('Erro na inicialização de notificações:', error);
      }
    };

    initNotifications();
    
    const messagesRef = collection(db, 'chats', CHAT_ID, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Message));
      
      setMessages(fetchedMessages.reverse());
    });
    
    return () => unsubscribe();
  }, []);

  useLayoutEffect(() => {
    scrollToBottom(); // Rolagem após a renderização
  }, [messages]); // Atualiza ao mudar a lista de mensagens

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    // Determina o destinatário automaticamente
    const recipient = users.find(user => user.id !== currentUser.uid);

    if (!recipient) {
      console.error('Erro: Não foi possível determinar o destinatário.');
      return;
    }

    const messagesRef = collection(db, 'chats', CHAT_ID, 'messages');
    await addDoc(messagesRef, {
      text: newMessage.trim(),
      sender: currentUser.uid,
      recipient: recipient.id,
      timestamp: serverTimestamp(),
    });
    scrollToBottom();
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5] max-w-md mx-auto shadow-lg">
      <div className="bg-[#2B5278] text-white p-4 text-center font-semibold">Chat</div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
  <div key={msg.id} className={`flex flex-col ${msg.sender === currentUser?.uid ? 'items-end' : 'items-start'}`}>
    <div 
      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
        msg.sender === currentUser?.uid 
          ? 'bg-[#4CA3FF] text-white' 
          : 'bg-white text-black shadow-sm'
      }`}
    >
      {msg.text}
    </div>
    <div className="text-xs text-gray-500 mt-1">
      {formatTimestamp(msg.timestamp)}
    </div>
  </div>
))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="bg-white p-4 border-t flex items-center space-x-2">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Digite uma mensagem..." 
          className="flex-grow p-2 bg-[#F0F2F5] rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300" 
        />
        <button 
          type="submit" 
          className="bg-[#4CA3FF] text-white p-2 rounded-full hover:bg-[#3A8DDE]"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatScreen;
