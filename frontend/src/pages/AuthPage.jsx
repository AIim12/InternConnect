import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      login(data.access_token, { email: form.email, role: data.role });
      navigate(data.role === 'employer' ? '/employer' : '/student');
    } catch (err) {
      console.error("Login fetch error:", err);
      setError(`Could not reach the server. Make sure the backend is running. (${err.message})`);
    }
    setLoading(false);
  };

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
      </div>
    </div>
  );
}
