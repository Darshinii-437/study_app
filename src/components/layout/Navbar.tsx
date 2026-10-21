import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Users, Shield, RefreshCw, LogOut, Sparkles, HelpCircle } from 'lucide-react';

interface NavbarProps {
  onOpenSetup: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSetup, isSyncing, onRefresh }) => {
  const { currentUser, partnerUser, logout, switchUser, isSupabaseConnected } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <BookOpen className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">StudySpace</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Private Duo
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Two-User Dedicated Study Chamber
            </p>
          </div>
        </div>

        {/* Center: Partner Status */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1.5 text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Study Partner:</span>
            {partnerUser ? (
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {partnerUser.display_name}
              </span>
            ) : (
              <span className="text-slate-500">Awaiting Partner</span>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Sync Button */}
          <button
            onClick={onRefresh}
            title="Refresh shared data"
            className={`p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ${
              isSyncing ? 'animate-spin text-emerald-400' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Setup / Instructions Modal Button */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Database & Privacy</span>
          </button>

          {/* Test Switcher (Convenient for local testing of both perspectives) */}
          {!isSupabaseConnected && currentUser && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 px-2 uppercase font-semibold">Test As:</span>
              <button
                onClick={() => switchUser('user-001')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  currentUser.id === 'user-001'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Alex
              </button>
              <button
                onClick={() => switchUser('user-002')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  currentUser.id === 'user-002'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sam
              </button>
            </div>
          )}

          {/* User Profile & Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow"
                style={{ backgroundColor: currentUser.avatar_color || '#10b981' }}
                title={currentUser.email}
              >
                {currentUser.display_name.charAt(0)}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-medium text-slate-200 leading-tight">
                  {currentUser.display_name}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {currentUser.email}
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign out of private study space"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
