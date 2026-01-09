import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Ticket, Message, TicketStatus, TicketPriority } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UseTicketsOptions {
  customerId?: string;
  agentId?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  limitCount?: number;
}

export const useTickets = (options: UseTicketsOptions = {}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const conditions = [];
    
    if (options.customerId) {
      conditions.push(where('customerId', '==', options.customerId));
    }
    
    if (options.agentId) {
      conditions.push(where('agentId', '==', options.agentId));
    }
    
    if (options.status && options.status.length > 0) {
      conditions.push(where('status', 'in', options.status));
    }
    
    if (options.priority && options.priority.length > 0) {
      conditions.push(where('priority', 'in', options.priority));
    }

    conditions.push(orderBy('createdAt', 'desc'));

    if (options.limitCount) {
      conditions.push(limit(options.limitCount));
    }

    const q = query(collection(db, 'tickets'), ...conditions);

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ticketData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          resolvedAt: doc.data().resolvedAt?.toDate() || undefined,
          firstResponseAt: doc.data().firstResponseAt?.toDate() || undefined,
          slaDeadline: doc.data().slaDeadline?.toDate() || undefined,
        })) as Ticket[];
        
        setTickets(ticketData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [options.customerId, options.agentId, options.status?.join(','), options.priority?.join(',')]);

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'timeSpent' | 'attachments'>) => {
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const docRef = await addDoc(collection(db, 'tickets'), {
      ...ticketData,
      ticketNumber,
      timeSpent: 0,
      attachments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      slaDeadline,
    });

    return docRef.id;
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    await updateDoc(doc(db, 'tickets', ticketId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };

  const assignTicket = async (ticketId: string, agentId: string, agentName: string) => {
    await updateTicket(ticketId, {
      agentId,
      agentName,
      status: 'in_progress',
    });
  };

  const closeTicket = async (ticketId: string, rating?: number, feedback?: string) => {
    await updateTicket(ticketId, {
      status: 'closed',
      resolvedAt: new Date(),
      satisfactionRating: rating,
      feedback,
    });
  };

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    assignTicket,
    closeTicket,
  };
};

export const useMessages = (ticketId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate() || undefined,
      })) as Message[];
      
      setMessages(messageData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ticketId]);

  const sendMessage = async (
    senderId: string,
    senderName: string,
    senderRole: 'customer' | 'agent' | 'manager',
    content: string,
    attachments: string[] = [],
    isInternalNote: boolean = false
  ) => {
    if (!ticketId) return;

    await addDoc(collection(db, 'messages'), {
      ticketId,
      senderId,
      senderName,
      senderRole,
      content,
      attachments,
      isInternalNote,
      createdAt: serverTimestamp(),
    });

    // Update ticket's updatedAt timestamp
    await updateDoc(doc(db, 'tickets', ticketId), {
      updatedAt: serverTimestamp(),
    });
  };

  return {
    messages,
    loading,
    sendMessage,
  };
};

export const useKnowledgeBase = () => {
  const [articles, setArticles] = useState<{id: string; title: string; content: string; category: string; tags: string[]}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'knowledgeBase'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articleData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as {id: string; title: string; content: string; category: string; tags: string[]}[];
      
      setArticles(articleData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const searchArticles = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return articles.filter(article => 
      article.title.toLowerCase().includes(term) ||
      article.content.toLowerCase().includes(term) ||
      article.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }, [articles]);

  return {
    articles,
    loading,
    searchArticles,
  };
};

export const useAgents = () => {
  const [agents, setAgents] = useState<{uid: string; displayName: string; email: string; role: string; skills?: string[]}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['agent', 'manager']),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agentData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as {uid: string; displayName: string; email: string; role: string; skills?: string[]}[];
      
      setAgents(agentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAgentWithLeastTickets = useCallback((currentTickets: Ticket[]) => {
    if (agents.length === 0) return null;
    
    const agentTicketCounts = agents.map(agent => ({
      ...agent,
      count: currentTickets.filter(t => t.agentId === agent.uid && t.status !== 'closed').length,
    }));
    
    return agentTicketCounts.sort((a, b) => a.count - b.count)[0];
  }, [agents]);

  return {
    agents,
    loading,
    getAgentWithLeastTickets,
  };
};
