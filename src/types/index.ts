export type UserRole = 'customer' | 'agent' | 'manager';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  avatarUrl?: string;
  // Agent-specific fields
  skills?: string[];
  maxTickets?: number;
}

export type TicketStatus = 'new' | 'in_progress' | 'waiting' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  agentId?: string;
  agentName?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  timeSpent: number; // in seconds
  firstResponseAt?: Date;
  slaDeadline?: Date;
  attachments: string[]; // URLs
  satisfactionRating?: number;
  feedback?: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  isInternalNote: boolean;
  attachments: string[];
  createdAt: Date;
  readAt?: Date;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  helpfulCount: number;
}

export interface MetricData {
  date: string;
  agentId?: string;
  ticketsOpened: number;
  ticketsClosed: number;
  avgResponseTime: number; // in minutes
  csatScore: number; // 1-5
  slaCompliance: number; // percentage
}

export interface DashboardMetrics {
  totalOpenTickets: number;
  totalClosedToday: number;
  avgResponseTime: number;
  csatScore: number;
  slaCompliance: number;
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByPriority: Record<TicketPriority, number>;
  recentTrends: {
    date: string;
    opened: number;
    closed: number;
  }[];
  agentPerformance: {
    agentId: string;
    agentName: string;
    ticketsClosed: number;
    avgResponseTime: number;
    csatScore: number;
  }[];
}

export interface TimeEntry {
  id: string;
  ticketId: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  type: 'auto_assign' | 'auto_close' | 'sla_warning' | 'slack_notification';
  enabled: boolean;
  config: Record<string, unknown>;
}
