import React, { useState, useEffect, useRef } from 'react';
import { StudySession, SessionType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, triggerConfetti } from '../../lib/utils';
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  History,
  CheckCircle2,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface PomodoroTimerProps {
  sessions: StudySession[];
  onLogSession: (durationMinutes: number, subject: string, sessionType: SessionType) => Promise<void>;
}

const DURATIONS: Record<SessionType, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  free_focus: 45 * 60,
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ sessions, onLogSession }) => {
  const { currentUser, partnerUser } = useAuth();
  const [sessionType, setSessionType] = useState<SessionType>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState('Operating Systems');
  const [completedRounds, setCompletedRounds] = useState(0);

  const initialDuration = DURATIONS[sessionType];

  // Play audio chime using Web Audio API (Zero external assets needed)
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked by browser:', e);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsRunning(false);
            playChime();
            triggerConfetti();

            const minutesFinished = Math.round(initialDuration / 60);
            if (sessionType === 'pomodoro' || sessionType === 'free_focus') {
              onLogSession(minutesFinished, subject, sessionType);
              setCompletedRounds((r) => r + 1);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, initialDuration, sessionType, subject, onLogSession]);

  const handleSwitchType = (type: SessionType) => {
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(DURATIONS[type]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[sessionType]);
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((initialDuration - timeLeft) / initialDuration) * 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <TimerIcon className="w-5 h-5 text-emerald-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pomodoro Focus Sanctuary
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Lock in distraction-free intervals. Every completed session syncs to your personal & partner history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timer Interface */}
        <div className="lg:col-span-2 p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-8 text-xs">
            <button
              onClick={() => handleSwitchType('pomodoro')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition ${
                sessionType === 'pomodoro'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Focus (25m)</span>
            </button>
            <button
              onClick={() => handleSwitchType('short_break')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition ${
                sessionType === 'short_break'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Short Break (5m)</span>
            </button>
            <button
              onClick={() => handleSwitchType('long_break')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold transition ${
                sessionType === 'long_break'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Long Break (15m)</span>
            </button>
          </div>

          {/* Subject Selector */}
          <div className="mb-6 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Operating Systems"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Circular / Big Timer Display */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Ambient Backlight */}
            <div
              className={`absolute w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
                isRunning ? 'bg-emerald-500/20 opacity-100' : 'bg-slate-800/20 opacity-40'
              }`}
            />

            <div className="relative text-7xl sm:text-8xl md:text-9xl font-mono font-black text-white tracking-tighter select-none">
              {timeFormatted}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md bg-slate-950 rounded-full h-2 mb-8 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition shadow-xl ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              title="Reset Timer"
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Completed Rounds Counter */}
          <div className="mt-8 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed this session: <strong className="text-white">{completedRounds} rounds</strong></span>
          </div>
        </div>

        {/* Right 1 Col: Session History */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-full max-h-[600px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Study Session Log</h3>
            </div>
            <span className="text-[11px] text-slate-500">{sessions.length} recorded</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 pr-1 mt-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                No focus sessions logged yet. Complete a 25-minute timer to log your first session!
              </div>
            ) : (
              sessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {sess.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateTime(sess.completed_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">+{sess.duration_minutes}m</span>
                    <div className="text-[10px] text-slate-500 uppercase">
                      {sess.session_type}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
