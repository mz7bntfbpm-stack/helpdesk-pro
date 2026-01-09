import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, setupAuthListener } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import CustomerPortal from './pages/CustomerPortal';
import AgentDashboard from './pages/AgentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import LoadingScreen from './components/LoadingScreen';

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  allowedRoles?: ('customer' | 'agent' | 'manager')[] 
}> = ({ allowedRoles }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on role
    if (user.role === 'manager') {
      return <Navigate to="/manager" replace />;
    }
    return <Navigate to="/agent" replace />;
  }

  return <Outlet />;
};

// Public Route (redirect if authenticated)
const PublicRoute: React.FC = () => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    // Redirect based on role
    if (user.role === 'manager') {
      return <Navigate to="/manager" replace />;
    }
    if (user.role === 'agent') {
      return <Navigate to="/agent" replace />;
    }
    return <Navigate to="/portal" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  const { loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = setupAuthListener();
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Customer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['customer']}><Layout /></ProtectedRoute>}>
        <Route path="/portal" element={<CustomerPortal />} />
        <Route path="/portal/ticket/:ticketId" element={<CustomerPortal />} />
      </Route>

      {/* Agent Routes */}
      <Route element={<ProtectedRoute allowedRoles={['agent', 'manager']}><Layout showSidebar /></ProtectedRoute>}>
        <Route path="/agent" element={<AgentDashboard />} />
        <Route path="/agent/ticket/:ticketId" element={<AgentDashboard />} />
      </Route>

      {/* Manager Routes */}
      <Route element={<ProtectedRoute allowedRoles={['manager']}><Layout showSidebar /></ProtectedRoute>}>
        <Route path="/manager" element={<ManagerDashboard />} />
      </Route>

      {/* Redirect root to appropriate page */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
