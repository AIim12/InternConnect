import { useState, useEffect } from 'react';
import { ChevronRight, Briefcase, Circle, LogOut, User, Bell, Star } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const TURKEY_CITIES = ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'];
const KNOWN_SKILLS = ['Python', 'FastAPI', 'React', 'Tailwind', 'DataScience', 'AWS', 'Docker', 'TypeScript', 'SQL', 'Node.js', 'Linux', 'Git', 'JavaScript', 'PostgreSQL'];

const STATUS_COLOR = {
  Applied: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  Interviewing: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Offered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Rejected: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

// Helper to extract numbers from strings (e.g. "$15/hr" -> 15, "20 hrs" -> 20)
const extractNum = (str) => {
  if (typeof str !== 'string') return 0;
  const match = str.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
};

// Helper to generate a consistent 3.5 - 5.0 rating based on company email
const getRating = (email) => {
  let hash = 0;
  const str = email || 'default';
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return (3.5 + (Math.abs(hash) % 15) / 10).toFixed(1);
};

export default function StudentDashboard() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('jobs');
  const [sortBy, setSortBy] = useState('match');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterPay, setFilterPay] = useState('all');
  const [profile, setProfile] = useState({ bio: '', skills: [] });
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    authFetch('http://127.0.0.1:8000/auth/profile').then(r => r.json()).then(setProfile);
    authFetch('http://127.0.0.1:8000/auth/internships').then(r => r.json()).then(setInternships);
    authFetch('http://127.0.0.1:8000/auth/applications/me').then(r => r.json()).then(data => {
      if (!data.detail) setApplications(data);
    });
    authFetch('http://127.0.0.1:8000/auth/notifications').then(r => r.json()).then(data => {
      if (!data.detail) setNotifications(data);
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

  const handleTab = (key) => {
    setTab(key);
    if (key === 'notifications' && notifications.some(n => !n.is_read)) {
      authFetch('http://127.0.0.1:8000/auth/notifications/read', { method: 'POST' });
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    }
  };

  const appliedIds = new Set(applications.map(a => a.id));

  const kanbanCols = ['Applied', 'Interviewing', 'Offered', 'Rejected'];

  // Process, filter, and sort jobs before rendering
  const filteredJobs = internships.filter(job => {
    if (filterLocation !== 'all' && job.location !== filterLocation) return false;

    if (filterPay === 'paid' && extractNum(job.hourly_pay) === 0) return false;
    if (filterPay === 'unpaid' && extractNum(job.hourly_pay) > 0) return false;

    const mode = (job.work_mode || '').toLowerCase();
    if (filterMode === 'remote' && !mode.includes('remote') && !mode.includes('online')) return false;
    if (filterMode === 'onsite' && !mode.includes('on-site') && !mode.includes('onsite') && !mode.includes('office') && !mode.includes('hybrid') && !mode.includes('in-person')) return false;

    return true;
  }).map(job => {
    const req = job.required_skills || [];
    let match_percentage = 100;
    let missing = [];
    if (req.length) {
      const has = new Set(profile.skills.map(s => s.toLowerCase()));
      const matched = req.filter(r => has.has(r.name.toLowerCase()));
      const missingSkills = req.filter(r => !has.has(r.name.toLowerCase()));
      match_percentage = Math.round((matched.length / req.length) * 100);
      missing = missingSkills.map(r => r.name);
    }
    return { ...job, match_percentage, missing, rating: parseFloat(getRating(job.employer_email)) };
  });

  filteredJobs.sort((a, b) => {
    if (sortBy === 'match') return b.match_percentage - a.match_percentage;
    if (sortBy === 'salary') return extractNum(b.hourly_pay) - extractNum(a.hourly_pay);
    if (sortBy === 'hours') {
      const hA = extractNum(a.work_hours) || 999;
      const hB = extractNum(b.work_hours) || 999;
      return hA - hB;
    }
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

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
        {[['jobs', '🔍 Find Jobs'], ['profile', '👤 My Profile'], ['applications', '📋 My Applications'], ['notifications', '🔔 Notifications']].map(([key, label]) => {
          const unread = key === 'notifications' ? notifications.filter(n => !n.is_read).length : 0;
          return (
            <button key={key} onClick={() => handleTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === key ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}>
              {label}
              {unread > 0 && <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">{unread}</span>}
            </button>
          );
        })}
      </div>

      {/* ── JOBS TAB ── */}
      {tab === 'jobs' && (
        <div className="space-y-5">
          {/* Sorting Header */}
          {internships.length > 0 && (
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <span className="text-slate-300 text-sm font-semibold">{filteredJobs.length} Jobs Found</span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 sm:border-r border-slate-700 sm:pr-3">
                  <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 p-2.5 outline-none cursor-pointer">
                    <option value="all">🌍 All Cities</option>
                    {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filterMode} onChange={e => setFilterMode(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 p-2.5 outline-none cursor-pointer">
                    <option value="all">📍 All Modes</option>
                    <option value="remote">🏠 Remote / Online</option>
                    <option value="onsite">🏢 On-site / Hybrid</option>
                  </select>
                  <select value={filterPay} onChange={e => setFilterPay(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 p-2.5 outline-none cursor-pointer">
                    <option value="all">💰 All</option>
                    <option value="paid">💵 Paid Only</option>
                    <option value="unpaid">🤝 Unpaid</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:block">Sort:</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 p-2.5 outline-none cursor-pointer shadow-sm">
                    <option value="match">🔥 Best Match</option>
                    <option value="salary">💰 Highest Salary</option>
                    <option value="hours">⏱️ Fewest Hours</option>
                    <option value="rating">⭐ Top Rated</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {internships.length === 0 && (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              No internships posted yet. Check back soon!
            </div>
          )}
          {internships.length > 0 && filteredJobs.length === 0 && (
            <div className="text-center py-16 text-slate-400 border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
              No internships match your current filters. Try changing them!
            </div>
          )}

          {/* Render Sorted Jobs */}
          {filteredJobs.map(job => {
              const applied = appliedIds.has(job.id);

              return (
                <div key={job.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/40 rounded-2xl transition-all group backdrop-blur-sm">
                  <div className="flex-1">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{job.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-slate-400 text-sm">{job.description}</p>
                        </div>
                        {/* Company Rating Badge */}
                        <div className="flex items-center gap-1.5 mt-2 bg-slate-900/50 w-fit px-2.5 py-1 rounded-md border border-slate-700/50">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-slate-200">{job.rating}</span>
                          <span className="text-xs text-slate-500">Employer Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3 text-xs font-medium text-slate-400">
                      {job.location && <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">🇹🇷 {job.location}</span>}
                      {job.work_mode && <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">📍 {job.work_mode}</span>}
                      {job.work_hours && <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">⏱️ {job.work_hours}</span>}
                      {job.hourly_pay && <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">💰 {job.hourly_pay}</span>}
                      {job.payment_methods && <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">💳 {job.payment_methods}</span>}
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
                    {job.missing.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Path to Hire:</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-slate-300 font-medium">You</span>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                          {job.missing.map(ms => (
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
                          className={job.match_percentage >= 70 ? 'stroke-emerald-400' : job.match_percentage >= 40 ? 'stroke-amber-400' : 'stroke-rose-400'}
                          strokeWidth="6"
                          strokeDasharray="213.6"
                          strokeDashoffset={213.6 - (213.6 * job.match_percentage) / 100}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <div className="text-lg font-black">{job.match_percentage}%</div>
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

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === 'notifications' && (
        <div className="space-y-4 max-w-3xl">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
              You have no notifications yet.
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-5 rounded-2xl border transition-all ${n.is_read ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-800/80 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'}`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-full ${n.is_read ? 'bg-slate-700 text-slate-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-sm sm:text-base whitespace-pre-wrap ${n.is_read ? 'text-slate-300' : 'text-white font-semibold'}`}>{n.message}</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
