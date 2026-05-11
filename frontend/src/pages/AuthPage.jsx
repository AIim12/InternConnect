import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Github, Linkedin, Chrome, LayoutGrid } from 'lucide-react';

export default function AuthPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [socialPrompt, setSocialPrompt] = useState(null); // 'Google', 'GitHub', etc.
  const [socialEmail, setSocialEmail] = useState('');

  useEffect(() => {
    // If user is already logged in, redirect them away from the auth page.
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'employer') navigate('/employer');
      else navigate('/student');
    }
  }, [user, navigate]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const url = mode === 'register' ? '/auth/register' : '/auth/login';
    try {
      const res = await fetch(`http://127.0.0.1:8000${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Something went wrong'); setLoading(false); return; }

      // If 2FA is required, show the OTP form instead of logging in directly
      if (data['2fa_required']) {
        setShow2FA(true);
        setLoading(false);
        return;
      }

      login(data.access_token, { email: form.email, role: data.role });
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'employer') {
        navigate('/employer');
      } else {
        navigate('/student');
      }
    } catch {
      setError('Could not reach the server. Make sure the backend is running.');
    }
    setLoading(false);
  };

  const submitSocialLogin = async (e) => {
    e.preventDefault();
    const provider = socialPrompt;
    setError('');
    setLoading(true);
    setSocialPrompt(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider, 
          email: socialEmail, 
          full_name: `${provider} User`,
          role: form.role || 'student'
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Something went wrong'); setLoading(false); return; }
      if (data['2fa_required']) {
        setForm(prev => ({ ...prev, email: data.email }));
        setShow2FA(true);
        setLoading(false);
        return;
      }
      login(data.access_token, { email: data.email, role: data.role });
      if (data.role === 'admin') navigate('/admin'); else if (data.role === 'employer') navigate('/employer'); else navigate('/student');
    } catch { setError('Could not reach the server.'); }
    setLoading(false);
  };

  const openSocialPrompt = (provider) => {
    setSocialPrompt(provider);
    setSocialEmail('');
  };

  const submit2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/auth/login/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp_code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Something went wrong'); setLoading(false); return; }

      login(data.access_token, { email: form.email, role: data.role });
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'employer') navigate('/employer');
      else navigate('/student');

    } catch {
      setError('Could not reach the server.');
    }
    setLoading(false);
  };

  // Don't render the form if we are about to redirect
  if (user) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Redirecting...</div>;
  }

  // Render 2FA prompt if needed
  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 relative">
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] top-16 left-16 pointer-events-none" />
        <div className="relative w-full max-w-md mx-4 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-100">Two-Factor Authentication</h2>
            <p className="text-slate-400 text-sm mt-1">Enter the code from your authenticator app.</p>
          </div>
          <form onSubmit={submit2FA} className="flex flex-col gap-4">
            <input
              value={otpCode} onChange={e => setOtpCode(e.target.value)} required
              placeholder="123456" maxLength={6}
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 placeholder:text-slate-600"
            />
            {error && <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>}
            <button type="submit" disabled={loading} className="mt-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60">
              {loading ? '...' : 'Verify & Sign In'}
            </button>
            <button type="button" onClick={() => setShow2FA(false)} className="text-slate-400 text-sm hover:text-white mt-2">Back to login</button>
          </form>
        </div>
      </div>
    );
  }

  // Render Social Login Simulation Prompt
  if (socialPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 relative">
        <div className="relative w-full max-w-sm mx-4 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            {socialPrompt === 'Google' ? <Chrome className="w-5 h-5 text-rose-400"/> : socialPrompt === 'GitHub' ? <Github className="w-5 h-5 text-slate-100"/> : socialPrompt === 'LinkedIn' ? <Linkedin className="w-5 h-5 text-sky-400"/> : <LayoutGrid className="w-5 h-5 text-blue-400"/>}
            Sign in with {socialPrompt}
          </h3>
          <p className="text-slate-400 text-sm mb-6">Simulation Mode: Enter the email you want to authenticate with via {socialPrompt}.</p>
          <form onSubmit={submitSocialLogin} className="flex flex-col gap-4">
            <input type="email" value={socialEmail} onChange={e => setSocialEmail(e.target.value)} required placeholder="your.email@example.com" className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            <button type="submit" disabled={loading} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors">Authenticate</button>
            <button type="button" onClick={() => setSocialPrompt(null)} className="text-slate-400 text-sm hover:text-white mt-1">Cancel</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative">
      {/* Background blobs */}
      <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] top-16 left-16 pointer-events-none" />
      <div className="absolute w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] bottom-16 right-16 pointer-events-none" />

      <div className="relative w-full max-w-md mx-4 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            InternConnect
          </span>
          <p className="text-slate-400 text-sm mt-1">Graph-powered career matching</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900/60 rounded-xl p-1 mb-8 border border-slate-700/40">
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                mode === m
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                name="full_name" value={form.full_name} onChange={handle} required
                placeholder="Jane Doe"
                className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 placeholder:text-slate-600"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
            <input
              name="email" type="email" value={form.email} onChange={handle} required
              placeholder="you@example.com"
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 placeholder:text-slate-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              name="password" type="password" value={form.password} onChange={handle} required
              placeholder="••••••••"
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 placeholder:text-slate-600"
            />
          </div>

          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Type</label>
              <div className="flex gap-3">
                {['student', 'employer'].map(r => (
                  <button
                    type="button" key={r}
                    onClick={() => setForm({ ...form, role: r })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold capitalize transition-all ${
                      form.role === r
                        ? r === 'student'
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {r === 'student' ? '🎓 Student' : '🏢 Employer'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="mt-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60"
          >
            {loading ? '...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Social Login Options */}
        <div className="mt-6 border-t border-slate-700/50 pt-6">
          <p className="text-center text-xs text-slate-500 font-semibold uppercase tracking-wider mb-4">Or continue with</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => openSocialPrompt('Google')} className="flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold text-slate-300 shadow-sm">
              <Chrome className="w-4 h-4 text-rose-400" /> Google
            </button>
            <button type="button" onClick={() => openSocialPrompt('GitHub')} className="flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold text-slate-300 shadow-sm">
              <Github className="w-4 h-4 text-slate-100" /> GitHub
            </button>
            <button type="button" onClick={() => openSocialPrompt('LinkedIn')} className="flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold text-slate-300 shadow-sm">
              <Linkedin className="w-4 h-4 text-sky-400" /> LinkedIn
            </button>
            <button type="button" onClick={() => openSocialPrompt('Microsoft')} className="flex items-center justify-center gap-2 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold text-slate-300 shadow-sm">
              <LayoutGrid className="w-4 h-4 text-blue-400" /> Microsoft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
