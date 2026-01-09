import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuthStore } from '../hooks/useAuth';
import { useTickets, useMessages, useAgents, useKnowledgeBase } from '../hooks/useTickets';
import {
  Search,
  Filter,
  Plus,
  Clock,
  Tag,
  Paperclip,
  Send,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  FileText,
  ArrowLeft,
  X,
  Eye,
  Star,
  BookOpen,
  Play,
  Pause,
  Save,
  InternalLink,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { Ticket, Message as MessageType, TicketPriority, TicketStatus } from '../types';

const AgentDashboard: React.FC = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeView, setActiveView] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'all'>('all');

  // Fetch tickets - agents see all open tickets or their assigned tickets
  const { tickets, updateTicket, assignTicket, closeTicket, loading: ticketsLoading } = useTickets({
    agentId: user?.role === 'agent' ? user.uid : undefined,
    status: user?.role === 'agent' ? ['new', 'in_progress', 'waiting'] : undefined,
  });

  if (ticketId) {
    return <TicketDetailView ticketId={ticketId} onBack={() => navigate('/agent')} />;
  }

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, selectedStatus, selectedPriority]);

  // Group tickets by status for Kanban
  const columns = useMemo(() => ({
    new: filteredTickets.filter(t => t.status === 'new'),
    in_progress: filteredTickets.filter(t => t.status === 'in_progress'),
    waiting: filteredTickets.filter(t => t.status === 'waiting'),
    closed: filteredTickets.filter(t => t.status === 'closed'),
  }), [filteredTickets]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const ticketId = result.draggableId;
    const newStatus = result.destination.droppableId as TicketStatus;

    try {
      await updateTicket(ticketId, { status: newStatus });
      toast.success(`Ticket moved to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and resolve customer tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('board')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'board' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets by subject, number, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TicketStatus | 'all')}
              className="input-field w-40"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as TicketPriority | 'all')}
              className="input-field w-40"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'New', value: columns.new.length, color: 'blue' },
          { label: 'In Progress', value: columns.in_progress.length, color: 'amber' },
          { label: 'Waiting', value: columns.waiting.length, color: 'purple' },
          { label: 'Closed Today', value: columns.closed.length, color: 'emerald' },
          { label: 'Total Open', value: columns.new.length + columns.in_progress.length + columns.waiting.length, color: 'gray' },
        ].map((stat, idx) => (
          <div key={idx} className="card p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600 mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {ticketsLoading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading tickets...</p>
        </div>
      ) : activeView === 'board' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['new', 'in_progress', 'waiting', 'closed'] as const).map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tickets={columns[status]}
                onTicketClick={(id) => navigate(`/agent/ticket/${id}`)}
              />
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="mt-4 text-gray-500">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/agent/ticket/${ticket.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">{ticket.ticketNumber}</span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {ticket.customerName} • {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Kanban Column Component
const KanbanColumn: React.FC<{
  status: TicketStatus;
  tickets: Ticket[];
  onTicketClick: (id: string) => void;
}> = ({ status, tickets, onTicketClick }) => {
  const statusConfig = {
    new: { title: 'New', color: 'blue', bg: 'bg-blue-50' },
    in_progress: { title: 'In Progress', color: 'amber', bg: 'bg-amber-50' },
    waiting: { title: 'Waiting', color: 'purple', bg: 'bg-purple-50' },
    closed: { title: 'Closed', color: 'emerald', bg: 'bg-emerald-50' },
  };

  const config = statusConfig[status];

  return (
    <div className="kanban-column">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${config.color}-500`} />
          <h3 className="font-semibold text-gray-900">{config.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
            {tickets.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[200px] transition-colors rounded-lg ${
              snapshot.isDraggingOver ? `${config.bg}` : ''
            }`}
          >
            {tickets.map((ticket, index) => (
              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onTicketClick(ticket.id)}
                    className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <PriorityBadge priority={ticket.priority} />
                      <span className="text-xs text-gray-500">{ticket.ticketNumber}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{ticket.subject}</h4>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">{ticket.customerName}</span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    {ticket.satisfactionRating && (
                      <div className="flex items-center mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= ticket.satisfactionRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Status Badge
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const styles = {
    new: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    waiting: 'bg-purple-100 text-purple-700',
    closed: 'bg-emerald-100 text-emerald-700',
  };

  const labels = {
    new: 'Open',
    in_progress: 'In Progress',
    waiting: 'Waiting',
    closed: 'Closed',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// Priority Badge
const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const styles = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Ticket Detail View
const TicketDetailView: React.FC<{ ticketId: string; onBack: () => void }> = ({ ticketId, onBack }) => {
  const { user } = useAuthStore();
  const { tickets, updateTicket, assignTicket, closeTicket } = useTickets({});
  const { messages, sendMessage } = useMessages(ticketId);
  const { agents, getAgentWithLeastTickets } = useAgents();
  const { articles, searchArticles, loading: kbLoading } = useKnowledgeBase();
  
  const ticket = tickets.find(t => t.id === ticketId);
  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showKB, setShowKB] = useState(false);
  const [kbSearch, setKbSearch] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Ticket not found</h3>
        <button onClick={onBack} className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSendReply = async () => {
    if (!replyContent.trim() || !user) return;
    
    try {
      await sendMessage(
        user.uid,
        user.displayName,
        user.role,
        replyContent,
        [],
        isInternalNote
      );
      setReplyContent('');
      setIsInternalNote(false);
      toast.success(isInternalNote ? 'Internal note added' : 'Reply sent!');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateTicket(ticketId, { status });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignToMe = async () => {
    if (!user) return;
    try {
      await assignTicket(ticketId, user.uid, user.displayName);
      toast.success('Ticket assigned to you');
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleAutoAssign = async () => {
    const { tickets } = useTickets.getState();
    const agent = getAgentWithLeastTickets(tickets);
    if (agent) {
      try {
        await assignTicket(ticketId, agent.uid, agent.displayName);
        toast.success(`Ticket assigned to ${agent.displayName}`);
      } catch (error) {
        toast.error('Failed to assign ticket');
      }
    }
  };

  const handleCloseTicket = async () => {
    setShowRating(true);
  };

  const handleSubmitRating = async () => {
    await closeTicket(ticketId, rating, feedback);
    setShowRating(false);
    toast.success('Ticket closed. Thank you for your feedback!');
  };

  const handleSaveTime = async () => {
    try {
      await updateTicket(ticketId, { 
        timeSpent: ticket.timeSpent + elapsedTime 
      });
      setTimerRunning(false);
      setElapsedTime(0);
      toast.success('Time logged successfully');
    } catch (error) {
      toast.error('Failed to save time');
    }
  };

  const kbResults = useMemo(() => {
    if (!kbSearch.trim()) return [];
    return searchArticles(kbSearch).slice(0, 5);
  }, [kbSearch, searchArticles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
            <h1 className="text-xl font-semibold text-gray-900">{ticket.subject}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">From {ticket.customerName}</p>
                  <p className="text-sm text-gray-500">{ticket.customerEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {ticket.status === 'new' && (
                    <button onClick={handleAssignToMe} className="btn-secondary text-sm">
                      Assign to Me
                    </button>
                  )}
                  {ticket.status === 'new' && user?.role === 'manager' && (
                    <button onClick={handleAutoAssign} className="btn-secondary text-sm">
                      Auto-assign
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {/* Original description */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 text-sm font-medium">
                    {ticket.customerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{ticket.customerName}</span>
                    <span className="text-xs text-gray-500">
                      {format(ticket.createdAt, 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="chat-bubble chat-bubble-customer">
                    {ticket.description}
                  </div>
                </div>
              </div>

              {/* All messages */}
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${message.isInternalNote 
                      ? 'bg-yellow-100' 
                      : message.senderRole === 'customer' 
                        ? 'bg-primary-100' 
                        : 'bg-accent-100'
                    }`}>
                    <span className={`text-sm font-medium
                      ${message.isInternalNote 
                        ? 'text-yellow-600' 
                        : message.senderRole === 'customer' 
                          ? 'text-primary-600' 
                          : 'text-accent-600'
                      }`}>
                      {message.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{message.senderName}</span>
                      {message.isInternalNote && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center">
                          <InternalLink className="w-3 h-3 mr-1" />
                          Internal Note
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(message.createdAt, 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className={`chat-bubble ${message.isInternalNote ? 'chat-bubble-internal' : message.senderRole === 'customer' ? 'chat-bubble-customer' : 'chat-bubble-agent'}`}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {ticket.status !== 'closed' && (
              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-600 text-sm font-medium">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setIsInternalNote(!isInternalNote)}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isInternalNote 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <InternalLink className="w-4 h-4 mr-1" />
                        Internal Note
                      </button>
                      <button
                        onClick={() => setShowKB(!showKB)}
                        className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          showKB 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Knowledge Base
                      </button>
                    </div>
                    
                    {showKB && (
                      <div className="mb-3 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          value={kbSearch}
                          onChange={(e) => setKbSearch(e.target.value)}
                          placeholder="Search knowledge base..."
                          className="input-field mb-3"
                        />
                        {kbResults.length > 0 && (
                          <div className="space-y-2">
                            {kbResults.map((article) => (
                              <div
                                key={article.id}
                                onClick={() => {
                                  setReplyContent(replyContent + '\n\n' + article.content);
                                  setShowKB(false);
                                }}
                                className="p-3 bg-white rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                              >
                                <p className="font-medium text-gray-900 text-sm">{article.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{article.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={isInternalNote ? "Add an internal note (not visible to customer)..." : "Type your reply..."}
                      rows={3}
                      className={`input-field resize-none ${isInternalNote ? 'border-yellow-300 bg-yellow-50' : ''}`}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <button className="flex items-center text-gray-500 hover:text-gray-700 text-sm">
                        <Paperclip className="w-4 h-4 mr-1" />
                        Attach files
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={!replyContent.trim()}
                        className={`btn-primary flex items-center space-x-2 ${isInternalNote ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
                      >
                        <Send className="w-4 h-4" />
                        <span>{isInternalNote ? 'Add Note' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Actions */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block">Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="input-field"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting">Waiting for Customer</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              {/* Time Tracker */}
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block">Time Tracked</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono text-gray-900">
                    {formatTime(elapsedTime + ticket.timeSpent)}
                  </span>
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className={`p-2 rounded-lg transition-colors ${
                      timerRunning 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  {elapsedTime > 0 && (
                    <button
                      onClick={handleSaveTime}
                      className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {ticket.status !== 'closed' && (
                <button
                  onClick={handleCloseTicket}
                  className="w-full btn-secondary text-red-600 hover:bg-red-50"
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {format(ticket.createdAt, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {formatDistanceToNow(ticket.updatedAt, { addSuffix: true })}
                </p>
              </div>
              {ticket.agentName && (
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium text-gray-900">{ticket.agentName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{ticket.customerName}</p>
                <p className="text-sm text-gray-500">{ticket.customerEmail}</p>
              </div>
              {ticket.firstResponseAt && (
                <div>
                  <p className="text-sm text-gray-500">First Response</p>
                  <p className="font-medium text-gray-900">
                    {formatDistanceToNow(ticket.firstResponseAt, { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SLA Info */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">SLA Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                {ticket.slaDeadline ? (
                  ticket.firstResponseAt ? (
                    <span className="flex items-center text-sm text-emerald-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Met
                    </span>
                  ) : ticket.slaDeadline > new Date() ? (
                    <span className="flex items-center text-sm text-yellow-600">
                      <Clock className="w-4 h-4 mr-1" />
                      In Progress
                    </span>
                  ) : (
                    <span className="flex items-center text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Breached
                    </span>
                  )
                ) : (
                  <span className="text-sm text-gray-500">N/A</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Close Ticket</h2>
            <p className="text-gray-600 mb-6">How would you rate this resolution?</p>
            
            <div className="flex justify-center space-x-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional: Add resolution notes..."
              rows={3}
              className="input-field resize-none mb-6"
            />

            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowRating(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="btn-primary"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
