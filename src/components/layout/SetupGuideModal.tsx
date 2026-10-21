import React, { useState } from 'react';
import { X, ShieldCheck, Database, Key, CheckCircle2, Copy, AlertTriangle, ExternalLink, Globe } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyEnvSample = () => {
    navigator.clipboard.writeText(`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key-here`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Private Duo Setup & Security Architecture</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-sm text-slate-300">
          {/* Step 1 */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>1. Supabase Cloud Database & RLS</span>
            </div>
            <p className="text-slate-400 text-xs mb-3">
              The application uses PostgreSQL with Row Level Security (RLS) on all 11 tables so only your 2 authorized accounts can read or write data.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 pl-1">
              <li>Create a free Supabase project at <code className="text-emerald-300">supabase.com</code>.</li>
              <li>Go to <strong>SQL Editor</strong> and paste the contents of <code className="text-emerald-300">supabase/schema.sql</code>.</li>
              <li>Update the placeholder emails in the <code className="text-indigo-300">authorized_emails</code> table to you and your friend's exact email addresses.</li>
              <li>Under <strong>Authentication &gt; Providers &gt; Email</strong>, you can disable <em>"Enable Signups"</em> so outside users cannot create accounts.</li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>2. Environment Variables (.env)</span>
            </div>
            <p className="text-slate-400 text-xs mb-2">
              In your project root, create a file named <code className="text-emerald-300">.env</code> with your Supabase credentials:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-xs flex items-center justify-between text-slate-300">
              <pre>
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
              <button
                onClick={copyEnvSample}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded text-xs text-slate-200 transition"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Step 3: Private Hosting & Security Limitations */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>3. Private Online Access & Hosting Options</span>
            </div>
            <p className="text-slate-400 text-xs mb-3">
              Per your requirement, we do not deploy publicly by default. When you are ready for both of you to access the app online from your phones and laptops, here are the secure private options:
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                <div className="font-semibold text-emerald-400">Option A: Vercel / Netlify with Password Protection (Recommended)</div>
                <div className="text-slate-400 mt-1">
                  Deploy the Vite build to Vercel/Netlify. Both offer a free tier (100GB bandwidth/mo, far more than 2 users will ever consume). Enable Vercel Password Protection or standard domain restriction so random internet crawlers cannot even load the login screen.
                </div>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                <div className="font-semibold text-indigo-400">Option B: Tailscale / Cloudflare Zero Trust Tunnel</div>
                <div className="text-slate-400 mt-1">
                  Run the app on your home machine or a lightweight VPS. Cloudflare Tunnel with Zero Trust allows you to put Google/Email OTP authentication in front of the entire domain for free, ensuring 0% public exposure.
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Privacy Guarantee:</strong> All database queries are filtered server-side by PostgreSQL Row Level Security. Even if someone obtains your frontend URL or anonymous Supabase key, they cannot read any notes, doubts, or tasks without logging into one of the two authorized whitelisted accounts.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
