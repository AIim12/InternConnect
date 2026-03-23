import { useState, useEffect } from 'react';
import { LogOut, Save, MessageSquare, Check, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EmployerProfile() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('company');
  const [profile, setProfile] = useState({ company_name: '', company_bio: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [applications, setApplications] = useState({});
  const [expandedApp, setExpandedApp] = useState(null);
  const [messageForm, setMessageForm] = useState({ internship_id: null, student_email: null, message: '' });
  const [showMessageForm, setShowMessageForm] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    loadProfile();
    loadApplications();
  }, []);

  const loadProfile = async () => {
    const res = await authFetch('http://127.0.0.1:8000/auth/employer/profile');
    const data = await res.json();
    if (!data.detail) setProfile(data);
  };

  const loadApplications = async () => {
    const res = await authFetch('http://127.0.0.1:8000/auth/internships/my');
    const internships = await res.json();
    
    const allApps = {};
    for (const internship of internships) {
      const appRes = await authFetch(`http://127.0.0.1:8000/auth/internships/${internship.id}/applicants`);
      const apps = await appRes.json();
      allApps[internship.id] = { internship, applicants: apps };
    }
    setApplications(allApps);
  };

  const saveProfile = async () => {
    setSaving(true);
    await authFetch('http://127.0.0.1:8000/auth/employer/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    setSaving(false);
    showToast('Profile saved!');
  };

  const updateApplicationStatus = async (internshipId, studentEmail, status, message = '') => {
    await authFetch(
      `http://127.0.0.1:8000/auth/internships/${internshipId}/applicants/${encodeURIComponent(studentEmail)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, message }),
      }
    );
    setMessageForm({ internship_id: null, student_email: null, message: '' });
    setShowMessageForm(false);
    loadApplications();
    showToast(`Status updated: ${status}`);
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
            Employer Hub
          </h1>
          <p className="text-slate-400 mt-1">Manage your company and applications</p>
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors px-4 py-2 rounded-xl border border-slate-700 hover:border-rose-400/40"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-slate-800/40 rounded-2xl p-1.5 border border-slate-700/40 w-fit">
        {[['company', '🏢 Company Profile'], ['applications', '📋 Applications']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── COMPANY PROFILE TAB ─── */}
      {tab === 'company' && (
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-100 mb-5">Company Information</h2>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  placeholder="Your Company Name"
                  className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">About Your Company</label>
                <textarea
                  value={profile.company_bio}
                  onChange={(e) => setProfile({ ...profile, company_bio: e.target.value })}
                  placeholder="Tell us about your company, culture, and what you're looking for..."
                  rows="5"
                  className="bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── APPLICATIONS TAB ─── */}
      {tab === 'applications' && (
        <div className="space-y-6">
          {Object.keys(applications).length === 0 ? (
            <div className="text-center py-12 text-slate-400">No applications yet</div>
          ) : (
            Object.entries(applications).map(([internshipId, { internship, applicants }]) => (
              <div key={internshipId} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                {/* Internship Header */}
                <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
                  <h3 className="text-lg font-bold text-slate-100">{internship.title}</h3>
                  <p className="text-sm text-slate-400 mt-2">
                    ${internship.hourly_rate || 'N/A'}/hr • {internship.working_hours || 'Flexible'} • {internship.remote ? '🌐 Remote' : '📍 On-site'}
                  </p>
                </div>

                {/* Applicants */}
                <div className="p-6 space-y-4">
                  {applicants.length === 0 ? (
                    <p className="text-slate-400">No applications yet</p>
                  ) : (
                    applicants.map((app) => (
                      <div
                        key={app.email}
                        className="border border-slate-700/50 rounded-xl p-4 bg-slate-900/50 hover:bg-slate-900/80 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-100">{app.full_name}</h4>
                            <p className="text-sm text-slate-400">{app.email}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              app.status === 'Offered'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : app.status === 'Rejected'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>

                        {app.bio && <p className="text-sm text-slate-300 mb-3">{app.bio}</p>}

                        {app.skills && app.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {app.skills.map((skill) => (
                              <span key={skill} className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs border border-indigo-500/30">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {app.status !== 'Offered' && (
                            <button
                              onClick={() => {
                                setMessageForm({
                                  internship_id: internship.id,
                                  student_email: app.email,
                                  message: `Congratulations! We'd like to offer you the position of ${internship.title}. We're excited to have you on our team!`,
                                });
                                setShowMessageForm(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border border-emerald-500/30"
                            >
                              <Check className="w-4 h-4" /> Accept
                            </button>
                          )}
                          {app.status !== 'Rejected' && (
                            <button
                              onClick={() =>
                                updateApplicationStatus(internship.id, app.email, 'Rejected')
                              }
                              className="flex-1 flex items-center justify-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border border-rose-500/30"
                            >
                              <X className="w-4 h-4" /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Message Form Modal */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Send Offer Message</h3>
            <textarea
              value={messageForm.message}
              onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
              placeholder="Personalize your offer message..."
              rows="5"
              className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-100 placeholder:text-slate-600 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  updateApplicationStatus(
                    messageForm.internship_id,
                    messageForm.student_email,
                    'Offered',
                    messageForm.message
                  );
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Send & Offer
              </button>
              <button
                onClick={() => setShowMessageForm(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
