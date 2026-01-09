import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { useTickets, useMessages } from '../hooks/useTickets';
import {
  Plus,
  Search,
  Filter,
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
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { Ticket, Message as MessageType, TicketPriority, TicketStatus } from '../types';

const CustomerPortal: React.FC = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tickets, createTicket, loading: ticketsLoading } = useTickets({ 
    customerId: user?.uid 
  });
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (ticketId) {
    return <TicketDetail ticketId={ticketId} onBack={() => navigate('/portal')} />;
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage and track your support requests</p>
        </div>
        <button
          onClick={() => setShowNewTicketForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Tickets', value: tickets.filter(t => t.status !== 'closed').length, color: 'blue' },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'amber' },
          { label: 'Waiting on You', value: tickets.filter(t => t.status === 'waiting').length, color: 'purple' },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'closed').length, color: 'emerald' },
        ].map((stat, idx) => (
          <div key={idx} className="card p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600 mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button className="btn-secondary flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {ticketsLoading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="card p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tickets found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first support ticket to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowNewTicketForm(true)}
              className="btn-primary mt-4"
            >
              Create Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              to={`/portal/ticket/${ticket.id}`}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">{ticket.ticketNumber}</span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{ticket.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {ticket.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                </span>
                {ticket.agentName && (
                  <span className="flex items-center text-xs text-gray-500">
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    {ticket.agentName}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <NewTicketForm onClose={() => setShowNewTicketForm(false)} />
      )}
    </div>
  );
};

// Status Badge Component
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

// Priority Badge Component
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

// New Ticket Form Modal
const NewTicketForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuthStore();
  const { createTicket } = useTickets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as TicketPriority,
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await createTicket({
        customerId: user.uid,
        customerEmail: user.email,
        customerName: user.displayName,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        status: 'new',
        tags: [],
        agentId: undefined,
        agentName: undefined,
      });
      toast.success('Ticket created successfully! Check your email for confirmation.');
      onClose();
    } catch (error) {
      toast.error('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject *
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please describe your issue in detail..."
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${formData.priority === priority
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                      : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                    }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Attachments (optional)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-primary-300 transition-colors cursor-pointer">
              <Paperclip className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Images and PDFs up to 5MB
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments(Array.from(e.target.files));
                  }
                }}
              />
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Ticket Detail Component
const TicketDetail: React.FC<{ ticketId: string; onBack: () => void }> = ({ ticketId, onBack }) => {
  const { user } = useAuthStore();
  const { tickets, updateTicket, closeTicket } = useTickets({ customerId: user?.uid });
  const { messages, sendMessage } = useMessages(ticketId);
  const ticket = tickets.find(t => t.id === ticketId);
  const [replyContent, setReplyContent] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Ticket not found</h3>
        <button onClick={onBack} className="btn-secondary mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
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
        false
      );
      setReplyContent('');
      toast.success('Reply sent!');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleCloseTicket = async () => {
    if (ticket.status !== 'closed') {
      await closeTicket(ticketId);
      toast.success('Ticket closed');
    }
  };

  const handleSubmitRating = async () => {
    await closeTicket(ticketId, rating, feedback);
    setShowRating(false);
    toast.success('Thank you for your feedback!');
  };

  const publicMessages = messages.filter(m => !m.isInternalNote);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Tickets
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="card">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{ticket.ticketNumber}</p>
                  <h1 className="text-xl font-semibold text-gray-900">{ticket.subject}</h1>
                </div>
                {ticket.status !== 'closed' && (
                  <button
                    onClick={() => setShowRating(true)}
                    className="btn-secondary text-sm"
                  >
                    Close Ticket
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {/* Original ticket description */}
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

              {/* Replies */}
              {publicMessages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${message.senderRole === 'customer' ? 'bg-primary-100' : 'bg-accent-100'}`}>
                    <span className={`text-sm font-medium
                      ${message.senderRole === 'customer' ? 'text-primary-600' : 'text-accent-600'}`}>
                      {message.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{message.senderName}</span>
                      <span className="text-xs text-gray-500">
                        {format(message.createdAt, 'MMM d, yyyy h:mm a')}
                      </span>
                      {message.senderRole !== 'customer' && (
                        <span className="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">
                          {message.senderRole}
                        </span>
                      )}
                    </div>
                    <div className={`chat-bubble ${message.senderRole === 'customer' ? 'chat-bubble-customer' : 'chat-bubble-agent'}`}>
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
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 text-sm font-medium">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="input-field resize-none"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <button className="flex items-center text-gray-500 hover:text-gray-700 text-sm">
                        <Paperclip className="w-4 h-4 mr-1" />
                        Attach files
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={!replyContent.trim()}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Reply</span>
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
          {/* Ticket Details */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Ticket Details</h3>
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
                  <p className="text-sm text-gray-500">Assigned Agent</p>
                  <p className="font-medium text-gray-900">{ticket.agentName}</p>
                </div>
              )}
              {ticket.satisfactionRating && (
                <div>
                  <p className="text-sm text-gray-500">Your Rating</p>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= ticket.satisfactionRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SLA Info */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Support SLA</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {ticket.slaDeadline && ticket.status !== 'closed' ? (
                  ticket.slaDeadline > new Date() ? (
                    <span className="flex items-center text-sm text-emerald-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      On Track
                    </span>
                  ) : (
                    <span className="flex items-center text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      SLA Breached
                    </span>
                  )
                ) : (
                  <span className="text-sm text-gray-500">N/A</span>
                )}
              </div>
              {ticket.slaDeadline && ticket.status !== 'closed' && (
                <div className="text-xs text-gray-500">
                  Expected response within 24 hours
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Your Experience</h2>
            <p className="text-gray-600 mb-6">How would you rate the support you received?</p>
            
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
              placeholder="Optional: Share any additional feedback..."
              rows={3}
              className="input-field resize-none mb-6"
            />

            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowRating(false)} className="btn-secondary">
                Skip
              </button>
              <button
                onClick={handleSubmitRating}
                className="btn-primary"
              >
                Submit & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
