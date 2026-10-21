import React from 'react';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  CheckSquare,
  Calendar,
  BarChart3,
  Timer,
} from 'lucide-react';

export type NavTab = 'room' | 'notes' | 'doubts' | 'tasks' | 'calendar' | 'progress' | 'timer';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unsolvedDoubtsCount: number;
  pendingTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unsolvedDoubtsCount,
  pendingTasksCount,
}) => {
  const navItems = [
    { id: 'room' as NavTab, label: 'Study Room', icon: LayoutDashboard },
    { id: 'notes' as NavTab, label: 'Shared Notes', icon: FileText },
    {
      id: 'doubts' as NavTab,
      label: 'Doubts',
      icon: HelpCircle,
      badge: unsolvedDoubtsCount > 0 ? unsolvedDoubtsCount : undefined,
    },
    {
      id: 'tasks' as NavTab,
      label: 'Shared Tasks',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    { id: 'calendar' as NavTab, label: 'Deadlines', icon: Calendar },
    { id: 'progress' as NavTab, label: 'Progress', icon: BarChart3 },
    { id: 'timer' as NavTab, label: 'Pomodoro', icon: Timer },
  ];

  return (
    <>
      {/* Desktop Sidebar (Left side, permanent) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 min-h-[calc(100vh-65px)]">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Study Chambers
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Room Privacy Notice */}
        <div className="mt-auto pt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Private 2-User Scope
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Only configured partner accounts have cryptographic RLS authorization.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Optimized for Android / Mobile screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition relative ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[50px]">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
