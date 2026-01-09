import { Timestamp } from 'firebase/firestore';
import { Ticket, Message, KnowledgeArticle, User } from '../types';

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
export const timestampToDate = (timestamp: Timestamp | Date | string | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  return new Date(timestamp);
};

/**
 * Convert Date to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date | undefined): Timestamp | undefined => {
  if (!date) return undefined;
  return Timestamp.fromDate(date);
};

/**
 * Serialize ticket for Firestore
 */
export const serializeTicket = (ticket: Partial<Ticket>): Record<string, unknown> => {
  return {
    ...ticket,
    createdAt: ticket.createdAt ? Timestamp.fromDate(ticket.createdAt) : undefined,
    updatedAt: ticket.updatedAt ? Timestamp.fromDate(ticket.updatedAt) : undefined,
    resolvedAt: ticket.resolvedAt ? Timestamp.fromDate(ticket.resolvedAt) : undefined,
    firstResponseAt: ticket.firstResponseAt ? Timestamp.fromDate(ticket.firstResponseAt) : undefined,
    slaDeadline: ticket.slaDeadline ? Timestamp.fromDate(ticket.slaDeadline) : undefined,
  };
};

/**
 * Deserialize ticket from Firestore
 */
export const deserializeTicket = (data: Record<string, unknown>): Ticket => {
  return {
    ...data,
    id: data.id as string,
    ticketNumber: data.ticketNumber as string,
    customerId: data.customerId as string,
    customerEmail: data.customerEmail as string,
    customerName: data.customerName as string,
    agentId: data.agentId as string | undefined,
    agentName: data.agentName as string | undefined,
    subject: data.subject as string,
    description: data.description as string,
    status: data.status as 'new' | 'in_progress' | 'waiting' | 'closed',
    priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
    tags: data.tags as string[],
    timeSpent: data.timeSpent as number,
    attachments: data.attachments as string[],
    satisfactionRating: data.satisfactionRating as number | undefined,
    feedback: data.feedback as string | undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    updatedAt: timestampToDate(data.updatedAt as Timestamp),
    resolvedAt: timestampToDate(data.resolvedAt as Timestamp),
    firstResponseAt: timestampToDate(data.firstResponseAt as Timestamp),
    slaDeadline: timestampToDate(data.slaDeadline as Timestamp),
  };
};

/**
 * Serialize message for Firestore
 */
export const serializeMessage = (message: Partial<Message>): Record<string, unknown> => {
  return {
    ...message,
    createdAt: message.createdAt ? Timestamp.fromDate(message.createdAt) : undefined,
    readAt: message.readAt ? Timestamp.fromDate(message.readAt) : undefined,
  };
};

/**
 * Deserialize message from Firestore
 */
export const deserializeMessage = (data: Record<string, unknown>): Message => {
  return {
    ...data,
    id: data.id as string,
    ticketId: data.ticketId as string,
    senderId: data.senderId as string,
    senderName: data.senderName as string,
    senderRole: data.senderRole as 'customer' | 'agent' | 'manager',
    content: data.content as string,
    isInternalNote: data.isInternalNote as boolean,
    attachments: data.attachments as string[],
    createdAt: timestampToDate(data.createdAt as Timestamp),
    readAt: timestampToDate(data.readAt as Timestamp),
  };
};

/**
 * Serialize user for Firestore
 */
export const serializeUser = (user: Partial<User>): Record<string, unknown> => {
  return {
    ...user,
    createdAt: user.createdAt ? Timestamp.fromDate(user.createdAt) : undefined,
    updatedAt: user.updatedAt ? Timestamp.fromDate(user.updatedAt) : undefined,
  };
};

/**
 * Deserialize user from Firestore
 */
export const deserializeUser = (data: Record<string, unknown>): User => {
  return {
    ...data,
    uid: data.uid as string,
    email: data.email as string,
    displayName: data.displayName as string,
    photoURL: data.photoURL as string | undefined,
    role: data.role as 'customer' | 'agent' | 'manager',
    isActive: data.isActive as boolean,
    avatarUrl: data.avatarUrl as string | undefined,
    skills: data.skills as string[] | undefined,
    maxTickets: data.maxTickets as number | undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    updatedAt: timestampToDate(data.updatedAt as Timestamp),
  };
};

/**
 * Serialize knowledge article for Firestore
 */
export const serializeKnowledgeArticle = (article: Partial<KnowledgeArticle>): Record<string, unknown> => {
  return {
    ...article,
    createdAt: article.createdAt ? Timestamp.fromDate(article.createdAt) : undefined,
    updatedAt: article.updatedAt ? Timestamp.fromDate(article.updatedAt) : undefined,
  };
};

/**
 * Deserialize knowledge article from Firestore
 */
export const deserializeKnowledgeArticle = (data: Record<string, unknown>): KnowledgeArticle => {
  return {
    ...data,
    id: data.id as string,
    title: data.title as string,
    content: data.content as string,
    category: data.category as string,
    tags: data.tags as string[],
    viewCount: data.viewCount as number,
    helpfulCount: data.helpfulCount as number,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    updatedAt: timestampToDate(data.updatedAt as Timestamp),
  };
};

/**
 * Create a new ticket with defaults
 */
export const createNewTicket = (data: {
  customerId: string;
  customerEmail: string;
  customerName: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}): Ticket => {
  const now = new Date();
  const slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  
  return {
    id: '', // Will be assigned by Firestore
    ticketNumber: `TKT-${Date.now().toString(36).toUpperCase()}`,
    customerId: data.customerId,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    subject: data.subject,
    description: data.description,
    priority: data.priority,
    status: 'new',
    tags: [],
    timeSpent: 0,
    attachments: [],
    createdAt: now,
    updatedAt: now,
    slaDeadline,
  };
};

/**
 * Create a new message
 */
export const createNewMessage = (data: {
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'agent' | 'manager';
  content: string;
  isInternalNote?: boolean;
}): Message => {
  return {
    id: '', // Will be assigned by Firestore
    ticketId: data.ticketId,
    senderId: data.senderId,
    senderName: data.senderName,
    senderRole: data.senderRole,
    content: data.content,
    isInternalNote: data.isInternalNote || false,
    attachments: [],
    createdAt: new Date(),
  };
};

/**
 * Create a new user profile
 */
export const createNewUser = (data: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: 'customer' | 'agent' | 'manager';
}): User => {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role || 'customer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Create a new knowledge article
 */
export const createNewArticle = (data: {
  title: string;
  content: string;
  category: string;
  tags: string[];
}): KnowledgeArticle => {
  const now = new Date();
  return {
    id: '', // Will be assigned by Firestore
    title: data.title,
    content: data.content,
    category: data.category,
    tags: data.tags,
    viewCount: 0,
    helpfulCount: 0,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Calculate time spent on ticket
 */
export const calculateTimeSpent = (timerEntries: { startTime: Date; endTime?: Date }[]): number => {
  return timerEntries.reduce((total, entry) => {
    const endTime = entry.endTime || new Date();
    return total + (endTime.getTime() - entry.startTime.getTime()) / 1000;
  }, 0);
};

/**
 * Check if SLA is met
 */
export const isSlaMet = (firstResponseAt: Date | undefined, slaDeadline: Date | undefined): boolean => {
  if (!firstResponseAt || !slaDeadline) return true;
  return firstResponseAt <= slaDeadline;
};

/**
 * Get time remaining until SLA breach
 */
export const getSlaTimeRemaining = (slaDeadline: Date | undefined): number | null => {
  if (!slaDeadline) return null;
  return Math.max(0, slaDeadline.getTime() - Date.now());
};

/**
 * Format SLA time remaining
 */
export const formatSlaTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Breached';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
};

/**
 * Create metric data for aggregation
 */
export const createMetricData = (data: {
  date: string;
  ticketsOpened: number;
  ticketsClosed: number;
  avgResponseTime: number;
  csatScore: number;
  slaCompliance: number;
}) => {
  return {
    ...data,
    createdAt: new Date(),
  };
};
