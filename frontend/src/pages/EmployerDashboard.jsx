import { useState, useEffect } from 'react';
import { LogOut, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const KNOWN_SKILLS = ['Python', 'FastAPI', 'React', 'Tailwind', 'DataScience', 'AWS', 'Docker', 'TypeScript', 'SQL', 'Node.js', 'Linux', 'Git', 'JavaScript', 'PostgreSQL'];
const TURKEY_CITIES = ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya'];

const STATUS_OPTS = ['Applied', 'Interviewing', 'Offered', 'Rejected'];
const STATUS_COLOR = {
  Applied: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  Interviewing: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  Offered: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  Rejected: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
};

export default function EmployerDashboard() {
  const { user, authFetch, logout, refetchUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('manage');
  const [internships, setInternships] = useState([]);
  const [applicants, setApplicants] = useState({});       // internship_id -> list
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ title: '', description: '', required_skills: [], work_hours: '', work_mode: '', hourly_pay: '', payment_methods: [], location: '' });
  const [skillInput, setSkillInput] = useState('');

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [changePasswordForm, setChangePasswordForm] = useState({ newPassword: '', otpCode: '' });
  const [changePwdError, setChangePwdError] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadInternships = () =>
    authFetch('http://127.0.0.1:8000/auth/internships/my')
      .then(r => r.json()).then(data => { if (!data.detail) setInternships(data); });

  useEffect(() => { loadInternships(); }, []);

  const loadChangePasswordQR = async () => {
    try {
      const res = await authFetch('http://127.0.0.1:8000/auth/2fa/qr');
      if (res.ok) {
        const blob = await res.blob();
        setQrCodeUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (tab === 'settings') {
      loadChangePasswordQR();
    }
  }, [tab]);

  const submitChangePassword = async (e) => {
    e.preventDefault();
    setChangePwdError('');
    setChangePwdLoading(true);
    try {
      const res = await authFetch('http://127.0.0.1:8000/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: changePasswordForm.newPassword, otp_code: changePasswordForm.otpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password changed successfully!');
        setChangePasswordForm({ newPassword: '', otpCode: '' });
        if (refetchUser) refetchUser();
      } else {
        setChangePwdError(data.detail || 'Failed to change password.');
      }
    } catch (err) {
      setChangePwdError('Could not reach the server.');
    }
    setChangePwdLoading(false);
  };

  const loadApplicants = async (id) => {
    if (applicants[id]) { setExpanded(expanded === id ? null : id); return; }
    const res = await authFetch(`http://127.0.0.1:8000/auth/internships/${id}/applicants`);
    const data = await res.json();
    setApplicants(prev => ({ ...prev, [id]: data }));
    setExpanded(id);
  };

  const updateStatus = async (internshipId, studentEmail, status) => {
    let signature = "";
    if (status === 'Offered') {
      signature = window.prompt("Please enter your E-Signature for the official offer letter:");
      if (signature === null) return; // User cancelled
    }
    await authFetch(`http://127.0.0.1:8000/auth/internships/${internshipId}/applicants/${encodeURIComponent(studentEmail)}?status=${status}&e_signature=${encodeURIComponent(signature)}`, { method: 'PATCH' });
    setApplicants(prev => ({
      ...prev,
      [internshipId]: prev[internshipId].map(a => a.email === studentEmail ? { ...a, status } : a),
    }));
    showToast(`Status updated: ${status}`);
  };

  const removeInternship = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this internship?")) return;
    const res = await authFetch(`http://127.0.0.1:8000/auth/internships/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast("Internship removed");
      loadInternships();
    } else {
      showToast("Failed to remove internship");
    }
  };

  const addSkill = (name) => {
    if (!name || form.required_skills.find(s => s.name === name)) return;
    setForm({ ...form, required_skills: [...form.required_skills, { name, level: 1 }] });
    setSkillInput('');
  };

  const removeSkill = (name) =>
    setForm({ ...form, required_skills: form.required_skills.filter(s => s.name !== name) });

  const postInternship = async (e) => {
    e.preventDefault();
    const payload = { ...form, payment_methods: form.payment_methods.join(', ') };
    const res = await authFetch('http://127.0.0.1:8000/auth/internships', {
      method: 'POST', body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.id) {
      showToast('Internship posted!');
      setShowForm(false);
      setForm({ title: '', description: '', required_skills: [], work_hours: '', work_mode: '', hourly_pay: '', payment_methods: [], location: '' });
      loadInternships();
    } else {
      showToast(data.detail || 'Error posting');
    }
  };

  const skillMatchPct = (studentSkills, requiredSkills) => {
    if (!requiredSkills.length) return 100;
    const has = new Set(studentSkills.map(s => s.toLowerCase()));
    const matched = requiredSkills.filter(r => has.has(r.name.toLowerCase())).length;
    return Math.round((matched / requiredSkills.length) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-6 min-h-screen bg-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Talent Scout
          </h1>
          <p className="text-slate-400 mt-1">Signed in as <span className="text-slate-200 font-semibold">{user?.email}</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setTab(tab === 'manage' ? 'settings' : 'manage')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors">
            {tab === 'manage' ? '⚙️ Settings' : '📋 Manage'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> Post Internship
          </button>
          <button onClick={() => { logout(); navigate('/auth'); }}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors px-4 py-2 rounded-xl border border-slate-700 hover:border-rose-400/40">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {tab === 'settings' && (
        <div className="max-w-2xl bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">🛡️ Change Password with 2FA</h2>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-4">Scan the QR code to set up your 2FA (if not done yet), then enter your new password and the 6-digit OTP code.</p>
              <form onSubmit={submitChangePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
                  <input type="password" value={changePasswordForm.newPassword} onChange={e => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })} required
                    placeholder="••••••••"
                    className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">2FA Code</label>
                  <input value={changePasswordForm.otpCode} onChange={e => setChangePasswordForm({ ...changePasswordForm, otpCode: e.target.value })} required
                    placeholder="123456" maxLength={6}
                    className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600" />
                </div>
                {changePwdError && <div className="text-rose-400 text-sm">{changePwdError}</div>}
                <button type="submit" disabled={changePwdLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                  {changePwdLoading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-slate-600 w-48 h-48">
              {qrCodeUrl ? <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-full object-contain" /> : <p className="text-slate-500 text-sm">Loading QR...</p>}
            </div>
          </div>
        </div>
      )}

      {/* Post Internship Form */}
      {tab === 'manage' && showForm && (
        <div className="mb-8 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-slate-100 mb-5">📋 New Internship Posting</h2>
          <form onSubmit={postInternship} className="flex flex-col gap-4">
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Internship title (e.g. Backend Engineering Intern)"
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600" />
            <textarea required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the role, team, and what the intern will work on..."
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 text-sm appearance-none">
              <option value="">📍 Select City</option>
              {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.work_mode} onChange={e => setForm({ ...form, work_mode: e.target.value })}
              placeholder="Mode (e.g. Remote, On-site)"
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600 text-sm" />
            <input value={form.work_hours} onChange={e => setForm({ ...form, work_hours: e.target.value })}
              placeholder="Hours (e.g. 20 hrs/week)"
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600 text-sm" />
            <input value={form.hourly_pay} onChange={e => setForm({ ...form, hourly_pay: e.target.value })}
              placeholder="Pay (e.g. $15/hr or Unpaid)"
              className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600 text-sm" />
          </div>

          <div className="flex flex-col gap-2 mb-2 mt-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Payment Methods</label>
            <div className="flex flex-wrap gap-5">
              {['PayPal', 'Credit Card', 'Western Union'].map(pm => (
                <label key={pm} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox"
                    checked={form.payment_methods.includes(pm)}
                    onChange={(e) => {
                      if (e.target.checked) setForm({ ...form, payment_methods: [...form.payment_methods, pm] });
                      else setForm({ ...form, payment_methods: form.payment_methods.filter(p => p !== pm) });
                    }}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  /> {pm}
                </label>
              ))}
            </div>
          </div>

            {/* Skills picker */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Required Skills</label>
            <div className="flex gap-2 mb-3">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))} placeholder="Type a custom skill and press Enter..." className="flex-1 bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm text-slate-100" />
              <button type="button" onClick={() => addSkill(skillInput)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-white">Add</button>
            </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {KNOWN_SKILLS.map(sk => (
                  <button type="button" key={sk}
                    onClick={() => addSkill(sk)}
                    disabled={!!form.required_skills.find(s => s.name === sk)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.required_skills.find(s => s.name === sk)
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 cursor-default'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}>
                    {form.required_skills.find(s => s.name === sk) ? '✓ ' : '+ '}{sk}
                  </button>
                ))}
              </div>
              {form.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  {form.required_skills.map(s => (
                    <span key={s.name} className="flex items-center gap-1 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
                      {s.name}
                      <button type="button" onClick={() => removeSkill(s.name)} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors">
                Publish Internship
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-slate-700 text-slate-400 hover:border-slate-500 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listed Internships */}
      {tab === 'manage' && (
      <div className="space-y-4">
        {internships.length === 0 && (
          <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
            You haven't posted any internships yet. Click "Post Internship" to get started!
          </div>
        )}
        {internships.map(job => {
          const apps = applicants[job.id] || [];
          const isOpen = expanded === job.id;
          return (
            <div key={job.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
              {/* Internship header */}
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-700/20 transition-colors"
                onClick={() => loadApplicants(job.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-100">{job.title}</h3>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/20 font-semibold">
                      {apps.length > 0 ? `${apps.length} applicant${apps.length > 1 ? 's' : ''}` : 'No applicants yet'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-1">{job.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs font-medium text-slate-400">
                    {job.location && <span className="bg-slate-900 px-2 py-1 rounded-md border border-slate-700">🇹🇷 {job.location}</span>}
                    {job.work_mode && <span className="bg-slate-900 px-2 py-1 rounded-md border border-slate-700">📍 {job.work_mode}</span>}
                    {job.work_hours && <span className="bg-slate-900 px-2 py-1 rounded-md border border-slate-700">⏱️ {job.work_hours}</span>}
                    {job.hourly_pay && <span className="bg-slate-900 px-2 py-1 rounded-md border border-slate-700">💰 {job.hourly_pay}</span>}
                    {job.payment_methods && <span className="bg-slate-900 px-2 py-1 rounded-md border border-slate-700">💳 {job.payment_methods}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(job.required_skills || []).map(s => (
                      <span key={s.name} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-md">{s.name}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-500 ml-4">
                  <button onClick={(e) => { e.stopPropagation(); removeInternship(job.id); }} className="hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-lg">
                    🗑️
                  </button>
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Applicants list */}
              {isOpen && (
                <div className="border-t border-slate-700/50 p-5 space-y-4">
                  {apps.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No applicants yet.</p>
                  ) : apps.map(a => {
                    const pct = skillMatchPct(a.skills || [], job.required_skills || []);
                    return (
                      <div key={a.email} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/40">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-slate-200">{a.full_name}</span>
                            <span className="text-xs text-slate-500">{a.email}</span>
                          </div>
                          {a.bio && <p className="text-sm text-slate-400 mb-2">{a.bio}</p>}
                          <div className="flex flex-wrap gap-1.5">
                            {(a.skills || []).map(sk => (
                              <span key={sk}
                                className={`px-2 py-0.5 text-xs rounded-md font-medium ${
                                  (job.required_skills || []).find(r => r.name === sk)
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>{sk}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 sm:border-l border-slate-700/50 sm:pl-4 min-w-[130px]">
                          {/* Match ring */}
                          <div className="relative w-16 h-16 flex justify-center items-center">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="32" cy="32" r="26" fill="none" className="stroke-slate-800" strokeWidth="5" />
                              <circle cx="32" cy="32" r="26" fill="none"
                                className={pct >= 70 ? 'stroke-emerald-400' : pct >= 40 ? 'stroke-amber-400' : 'stroke-rose-400'}
                                strokeWidth="5"
                                strokeDasharray="163.4"
                                strokeDashoffset={163.4 - (163.4 * pct) / 100}
                                strokeLinecap="round" />
                            </svg>
                            <div className="absolute text-sm font-black">{pct}%</div>
                          </div>
                          {/* Status selector */}
                          <select
                            value={a.status}
                            onChange={e => updateStatus(job.id, a.email, e.target.value)}
                            className={`w-full text-xs font-bold rounded-lg border px-2 py-1.5 bg-slate-900 focus:outline-none ${STATUS_COLOR[a.status] || ''}`}>
                            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
