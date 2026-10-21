import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Lock, Shield, AlertCircle, ArrowRight, UserCheck, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onOpenSetup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenSetup }) => {
  const { login, error, clearError, isSupabaseConnected } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setIsSubmitting(true);
    await login(userEmail, 'password123');
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-emerald-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* App Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-xl shadow-emerald-500/20">
            <BookOpen className="w-7 h-7 text-slate-950" />
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          StudySpace Private Room
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-400">
          Dedicated study sanctuary for two authorized study partners.
        </p>

        {/* Private Access Notice */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40 py-1.5 px-3 rounded-full mx-auto w-fit">
          <Shield className="w-3.5 h-3.5" />
          <span>Restricted Access • Public Registration Disabled</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
              <button
                type="button"
                onClick={clearError}
                className="text-red-400 hover:text-red-300 font-bold text-sm"
              >
                ×
              </button>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Authorized Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user1@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Verifying Access...</span>
              ) : (
                <>
                  <span>Enter Study Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Testing Shortcuts for the two configured accounts */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium mb-2.5 flex items-center justify-between">
              <span>Quick Test Authorized Accounts:</span>
              <span className="text-[10px] text-emerald-400">2-User Chamber</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('user1@example.com')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Partner 1 (Alex)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('user2@example.com')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Partner 2 (Sam)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Trying any other email will trigger access rejection by server-side authorization.
            </p>
          </div>

          {/* Setup / Database Configuration link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onOpenSetup}
              className="text-xs text-slate-400 hover:text-emerald-400 transition underline underline-offset-4"
            >
              How are credentials & Supabase RLS configured?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
