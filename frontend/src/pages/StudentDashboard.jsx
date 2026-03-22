import { useState, useEffect } from 'react';
import { ChevronRight, Briefcase, Circle, LogOut, User } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const KNOWN_SKILLS = ['Python', 'FastAPI', 'React', 'Tailwind', 'DataScience', 'AWS', 'Docker', 'TypeScript', 'SQL', 'Node.js', 'Linux', 'Git', 'JavaScript', 'PostgreSQL'];

const STATUS_COLOR = {
  Applied: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  Interviewing: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Offered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Rejected: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

export default function StudentDashboard() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('jobs');
  const [profile, setProfile] = useState({ bio: '', skills: [] });
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    authFetch('http://127.0.0.1:8000/auth/profile').then(r => r.json()).then(setProfile);
    authFetch('http://127.0.0.1:8000/auth/internships').then(r => r.json()).then(setInternships);
    authFetch('http://127.0.0.1:8000/auth/applications/me').then(r => r.json()).then(data => {
      if (!data.detail) setApplications(data);
    });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    await authFetch('http://127.0.0.1:8000/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    setSaving(false);
    showToast('Profile saved!');
  };

  const toggleSkill = (skill) => {
    const has = profile.skills.includes(skill);
    setProfile({ ...profile, skills: has ? profile.skills.filter(s => s !== skill) : [...profile.skills, skill] });
  };

  const apply = async (id) => {
    setApplyingId(id);
    const res = await authFetch(`http://127.0.0.1:8000/auth/internships/${id}/apply`, { method: 'POST' });
    const data = await res.json();
    setApplyingId(null);
    if (data.ok) {
      showToast('Application submitted!');
      const updated = await authFetch('http://127.0.0.1:8000/auth/applications/me').then(r => r.json());
      if (!updated.detail) setApplications(updated);
    } else {
      showToast(data.detail || 'Error');
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const appliedIds = new Set(applications.map(a => a.id));

  const kanbanCols = ['Applied', 'Interviewing', 'Offered', 'Rejected'];

  return (
    <div className="max-w-7xl mx-auto w-full p-6 min-h-screen bg-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold animate-bounce">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Career Navigator
          </h1>
          <p className="text-slate-400 mt-1">Welcome back, <span className="text-slate-200 font-semibold">{user?.email}</span></p>
        </div>
        <button onClick={() => { logout(); navigate('/auth'); }}
          className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors px-4 py-2 rounded-xl border border-slate-700 hover:border-rose-400/40">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-slate-800/40 rounded-2xl p-1.5 border border-slate-700/40 w-fit">
        {[['jobs', '🔍 Find Jobs'], ['profile', '👤 My Profile'], ['applications', '📋 My Applications']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── JOBS TAB ── */}
      {tab === 'jobs' && (
        <div className="space-y-5">
          {internships.length === 0 && (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              No internships posted yet. Check back soon!
            </div>
          )}
          {internships.map(job => {
            const match = (() => {
              const req = job.required_skills || [];
              if (!req.length) return { match_percentage: 100, missing: [] };
              const has = new Set(profile.skills.map(s => s.toLowerCase()));
              const matched = req.filter(r => has.has(r.name.toLowerCase()));
              const missing = req.filter(r => !has.has(r.name.toLowerCase()));
              return { match_percentage: Math.round((matched.length / req.length) * 100), missing: missing.map(r => r.name) };
            })();
            const applied = appliedIds.has(job.id);

            return (
              <div key={job.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/40 rounded-2xl transition-all group backdrop-blur-sm">
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">{job.title}</h3>
                      <p className="text-slate-400 text-sm">{job.description}</p>
                    </div>
                  </div>

                  {/* Skills required */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(job.required_skills || []).map(s => (
                      <span key={s.name}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          profile.skills.includes(s.name)
                            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600/30'
                        }`}>
                        {profile.skills.includes(s.name) ? '✓ ' : ''}{s.name}
                      </span>
                    ))}
                  </div>

                  {/* Path to Hire */}
                  {match.missing.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Path to Hire:</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-slate-300 font-medium">You</span>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                        {match.missing.map(ms => (
                          <span key={ms} className="text-rose-400 font-medium px-2 py-1 bg-rose-400/10 rounded-lg border border-rose-400/20 text-xs">
                            Learn: {ms}
                          </span>
                        ))}
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                        <span className="text-emerald-400 font-semibold">Internship</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Match circle + Apply */}
                <div className="flex flex-col items-center justify-center gap-4 sm:border-l border-slate-700/50 sm:pl-6 min-w-[120px]">
                  <div className="relative w-20 h-20 flex justify-center items-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="34" fill="none" className="stroke-slate-800" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none"
                        className={match.match_percentage >= 70 ? 'stroke-emerald-400' : match.match_percentage >= 40 ? 'stroke-amber-400' : 'stroke-rose-400'}
                        strokeWidth="6"
                        strokeDasharray="213.6"
                        strokeDashoffset={213.6 - (213.6 * match.match_percentage) / 100}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-center">
                      <div className="text-lg font-black">{match.match_percentage}%</div>
                      <div className="text-xs text-slate-500">match</div>
                    </div>
                  </div>

                  <button
                    disabled={applied || applyingId === job.id}
                    onClick={() => apply(job.id)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                      applied
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/20'
                    }`}>
                    {applied ? '✓ Applied' : applyingId === job.id ? '...' : 'Apply Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROFILE TAB ── */}
      {tab === 'profile' && (
        <div className="max-w-2xl flex flex-col gap-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><User className="w-5 h-5 text-indigo-400" /> Your CV Profile</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1 block">Bio / Description</label>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={e => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell employers about yourself, your goals, and what you're looking for..."
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3 block">Your Skills <span className="text-indigo-400">(click to toggle)</span></label>
                <div className="flex flex-wrap gap-2">
                  {KNOWN_SKILLS.map(skill => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        profile.skills.includes(skill)
                          ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                      }`}>
                      {profile.skills.includes(skill) ? '✓ ' : ''}{skill}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving}
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* Skill Map visualization */}
          {profile.skills.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-4 text-slate-100">📊 Skill Map</h2>
              <div className="space-y-3">
                {profile.skills.map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-28 text-sm font-semibold text-slate-300 truncate">{s}</span>
                    <div className="flex-1 bg-slate-900 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all" style={{ width: `${Math.max(40, (100 - i * 8))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── APPLICATIONS TAB / KANBAN ── */}
      {tab === 'applications' && (
        <div className="overflow-x-auto">
          {applications.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              You haven't applied to any internships yet.
            </div>
          ) : (
            <div className="flex gap-5 min-w-max pb-4">
              {kanbanCols.map(col => {
                const items = applications.filter(a => a.status === col);
                return (
                  <div key={col} className="w-72 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
                    <h3 className={`text-xs uppercase tracking-widest font-bold mb-4 pb-2 border-b border-slate-700 flex justify-between ${STATUS_COLOR[col]?.split(' ')[0]}`}>
                      {col}
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-xs">{items.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 border border-dashed border-slate-700 rounded-xl text-sm">Empty</div>
                      ) : items.map(app => (
                        <div key={app.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700/50">
                          <div className="font-semibold text-slate-200">{app.title}</div>
                          <div className="text-xs text-slate-500 mt-1">{app.description?.slice(0, 60)}...</div>
                          <div className="mt-3 flex items-center gap-2">
                            <div className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_COLOR[app.status]}`}>{app.status}</div>
                            {app.match_percentage !== undefined && (
                              <span className="text-xs text-slate-400">{app.match_percentage}% match</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
