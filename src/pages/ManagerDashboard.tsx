import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useAuthStore } from '../hooks/useAuth';
import { useTickets, useAgents } from '../hooks/useTickets';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Star,
  Calendar,
  Target,
  Award,
  Activity,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { TicketStatus, TicketPriority } from '../types';

// Mock data for demonstration - in production, this would come from Firestore
const generateMockData = () => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, 'MMM d'),
      opened: Math.floor(Math.random() * 30) + 10,
      closed: Math.floor(Math.random() * 25) + 5,
    };
  });

  const agents = [
    { name: 'Sarah Johnson', tickets: 45, responseTime: 15, rating: 4.8 },
    { name: 'Mike Chen', tickets: 38, responseTime: 22, rating: 4.5 },
    { name: 'Emily Davis', tickets: 42, responseTime: 18, rating: 4.7 },
    { name: 'James Wilson', tickets: 35, responseTime: 25, rating: 4.3 },
    { name: 'Lisa Anderson', tickets: 40, responseTime: 20, rating: 4.6 },
  ];

  const priorityDistribution = [
    { name: 'Low', value: 45, color: '#9ca3af' },
    { name: 'Medium', value: 120, color: '#3b82f6' },
    { name: 'High', value: 65, color: '#f97316' },
    { name: 'Urgent', value: 20, color: '#ef4444' },
  ];

  const statusDistribution = [
    { name: 'Open', value: 35, color: '#3b82f6' },
    { name: 'In Progress', value: 50, color: '#f59e0b' },
    { name: 'Waiting', value: 25, color: '#8b5cf6' },
    { name: 'Closed', value: 180, color: '#10b981' },
  ];

  return { last7Days, agents, priorityDistribution, statusDistribution };
};

const ManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { tickets, loading: ticketsLoading } = useTickets({});
  const { agents, loading: agentsLoading } = useAgents();

  // Generate or fetch real data
  const data = useMemo(() => generateMockData(), []);

  // Calculate real metrics from tickets
  const metrics = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));

    const openTickets = tickets.filter(t => t.status !== 'closed');
    const closedToday = tickets.filter(t => 
      t.resolvedAt && startOfDay(t.resolvedAt) >= today
    );
    const closedYesterday = tickets.filter(t => 
      t.resolvedAt && startOfDay(t.resolvedAt) >= yesterday && startOfDay(t.resolvedAt) < today
    );

    const slaBreached = tickets.filter(t => 
      t.status !== 'closed' && t.slaDeadline && t.slaDeadline < now
    );

    const avgResponseTime = tickets
      .filter(t => t.firstResponseAt)
      .reduce((acc, t) => {
        const responseTime = (t.firstResponseAt!.getTime() - t.createdAt.getTime()) / 60000; // in minutes
        return acc + responseTime;
      }, 0) / (tickets.filter(t => t.firstResponseAt).length || 1);

    const avgRating = tickets
      .filter(t => t.satisfactionRating)
      .reduce((acc, t) => acc + (t.satisfactionRating || 0), 0) / 
      (tickets.filter(t => t.satisfactionRating).length || 1);

    return {
      openTickets: openTickets.length,
      closedToday: closedToday.length,
      closedYesterday: closedYesterday.length,
      slaBreached: slaBreached.length,
      avgResponseTime,
      avgRating,
      totalTickets: tickets.length,
    };
  }, [tickets]);

  // Calculate trend percentages
  const closedTrend = metrics.closedYesterday > 0 
    ? ((metrics.closedToday - metrics.closedYesterday) / metrics.closedYesterday) * 100 
    : 0;

  const slaCompliance = metrics.totalTickets > 0 
    ? ((metrics.totalTickets - metrics.slaBreached) / metrics.totalTickets) * 100 
    : 100;

  if (ticketsLoading || agentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Team performance and analytics overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field w-40">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="btn-secondary flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Open Tickets"
          value={metrics.openTickets}
          icon={Ticket}
          color="blue"
          trend={null}
          subtitle="Currently active"
        />
        <MetricCard
          title="Closed Today"
          value={metrics.closedToday}
          icon={CheckCircle}
          color="emerald"
          trend={closedTrend}
          trendLabel="vs yesterday"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${Math.round(metrics.avgResponseTime)}m`}
          icon={Clock}
          color="amber"
          trend={-5}
          trendLabel="improvement"
          positive
        />
        <MetricCard
          title="SLA Compliance"
          value={`${Math.round(slaCompliance)}%`}
          icon={Target}
          color={slaCompliance >= 90 ? 'emerald' : slaCompliance >= 70 ? 'amber' : 'red'}
          trend={slaCompliance >= 90 ? 2 : -3}
          trendLabel="vs last week"
          positive={slaCompliance >= 90}
        />
      </div>

      {/* CSAT and Secondary Metrics */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* CSAT Score */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">CSAT Score</h3>
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {metrics.avgRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 mb-1">/ 5.0</span>
          </div>
          <div className="flex mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(metrics.avgRating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Based on {tickets.filter(t => t.satisfactionRating).length} ratings</p>
        </div>

        {/* SLA Breached */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">SLA Breached</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-3xl font-bold text-red-600">{metrics.slaBreached}</span>
          <p className="text-sm text-gray-500 mt-2">
            {Math.round((metrics.slaBreached / (metrics.openTickets || 1)) * 100)}% of open tickets
          </p>
          {metrics.slaBreached > 0 && (
            <button className="text-sm text-primary-600 hover:underline mt-2">
              View tickets →
            </button>
          )}
        </div>

        {/* Team Size */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Active Agents</h3>
            <Users className="w-5 h-5 text-primary-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{agents.length}</span>
          <p className="text-sm text-gray-500 mt-2">
            {Math.round(metrics.openTickets / (agents.length || 1))} tickets per agent avg
          </p>
        </div>

        {/* Total Tickets */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Total Tickets</h3>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">{metrics.totalTickets}</span>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ticket Volume Trend */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ticket Volume Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.last7Days}>
              <defs>
                <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="opened" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorOpened)" 
                name="Opened"
              />
              <Area 
                type="monotone" 
                dataKey="closed" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorClosed)" 
                name="Closed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={300}>
              <PieChart>
                <Pie
                  data={data.priorityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {data.priorityDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Team Performance</h3>
            <button className="text-sm text-primary-600 hover:underline flex items-center">
              View Full Report
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets Closed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CSAT Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.agents.map((agent, idx) => {
                const performance = (agent.rating / 5) * 100;
                const isTopPerformer = idx === 0;
                
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isTopPerformer ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isTopPerformer ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {agent.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {agent.name}
                            {isTopPerformer && (
                              <Award className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{agent.tickets}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        agent.responseTime <= 20 ? 'text-emerald-600' : 
                        agent.responseTime <= 25 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {agent.responseTime} min
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-gray-900">{agent.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2 max-w-[100px]">
                          <div 
                            className={`h-full rounded-full ${
                              performance >= 90 ? 'bg-emerald-500' : 
                              performance >= 70 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${performance}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(performance)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Overview */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Status Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {data.statusDistribution.map((status, idx) => {
            const percentage = Math.round((status.value / data.statusDistribution.reduce((a, b) => a + b.value, 0)) * 100);
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{status.name}</span>
                  <span className="font-medium text-gray-900">{status.value} ({percentage}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: status.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  trend: number | null;
  trendLabel?: string;
  positive?: boolean;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, trend, trendLabel, positive, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== null && (
          <div className={`flex items-center text-sm ${
            (positive && trend > 0) || (!positive && trend < 0) 
              ? 'text-emerald-600' 
              : 'text-red-600'
          }`}>
            {trend > 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(Math.round(trend))}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend !== null && trendLabel && (
          <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
