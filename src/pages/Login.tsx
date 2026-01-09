import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { HelpCircle, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { signInWithGoogle, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      toast.success('Welcome back!');
      // Navigation will happen automatically via App.tsx routing
    } catch (err) {
      toast.error('Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-accent-500 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">HelpDesk Pro</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Support your customers<br />
              <span className="text-accent-200">like never before</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              A modern, collaborative ticketing system built for growing SaaS teams.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '⚡', title: 'Real-time Updates', desc: 'Instant notifications and live ticket tracking' },
              { icon: '🎯', title: 'Smart Automation', desc: 'Auto-assignment and SLA tracking' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Team performance insights and metrics' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-primary-100">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4 text-primary-100 text-sm">
          <Shield className="w-4 h-4" />
          <span>Enterprise-grade security with Google OAuth</span>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">HelpDesk Pro</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-600">Sign in to access your support dashboard</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3.5 
                       bg-white border border-gray-200 rounded-xl text-gray-700 
                       font-medium hover:bg-gray-50 hover:border-gray-300
                       transition-all duration-200 shadow-sm hover:shadow-md
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">or</span>
            </div>
          </div>

          {/* Email login (for demo purposes) */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           placeholder-gray-400"
                  disabled
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           placeholder-gray-400"
                  disabled
                />
              </div>
            </div>
            <button
              className="w-full btn-primary flex items-center justify-center space-x-2"
              disabled
            >
              <span>Sign In with Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
          </p>

          {/* Demo accounts info */}
          <div className="mt-6 p-4 bg-primary-50 rounded-xl">
            <p className="text-sm text-primary-800 font-medium mb-2">Demo Accounts:</p>
            <div className="text-xs text-primary-600 space-y-1">
              <p>• Customer: Use any Google account</p>
              <p>• Agent: Contact admin for agent access</p>
              <p>• Manager: Contact admin for manager access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
