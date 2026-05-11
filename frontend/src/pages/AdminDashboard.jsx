import { useState, useEffect } from 'react';
import { Shield, Users, LogOut, Edit } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_OPTS = ['student', 'employer', 'admin'];
const ROLE_COLOR = {
  student: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10',
  employer: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  admin: 'text-rose-400 border-rose-400/30 bg-rose-400/10',
};

export default function AdminDashboard() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    // This page is for admins only.
    if (user?.role !== 'admin') {
      navigate('/auth');
      return;
    }

    authFetch('http://127.0.0.1:8000/auth/admin/users')
      .then(r => r.json())
      .then(data => {
        if (!data.detail) {
          setUsers(data);
        }
        setLoading(false);
      });
  }, [user, navigate, authFetch]);

  const updateUserRole = async (email, newRole) => {
    const res = await authFetch(`http://127.0.0.1:8000/auth/admin/users/${encodeURIComponent(email)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ new_role: newRole }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.email === email ? { ...u, role: newRole } : u));
      showToast(`Updated ${email} to ${newRole}`);
    } else {
      const error = await res.json();
      showToast(`Error: ${error.detail || 'Failed to update'}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 min-h-screen bg-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-xl font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-400">
            Admin Control Panel
          </h1>
          <p className="text-slate-400 mt-1">Signed in as <span className="text-slate-200 font-semibold">{user?.email}</span></p>
        </div>
        <button onClick={() => { logout(); navigate('/auth'); }}
          className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors px-4 py-2 rounded-xl border border-slate-700 hover:border-rose-400/40">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Users Table */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl backdrop-blur-sm">
        <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
          <Users className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-100">Manage User Roles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/30">
              <tr>
                <th scope="col" className="px-6 py-3">Full Name</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Current Role</th>
                <th scope="col" className="px-6 py-3 text-center">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-slate-200 whitespace-nowrap">{u.full_name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${ROLE_COLOR[u.role] || ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={u.role}
                      onChange={e => updateUserRole(u.email, e.target.value)}
                      disabled={u.email === user.email} // Admin can't change their own role
                      className={`w-full text-xs font-bold rounded-lg border px-2 py-1.5 bg-slate-900 focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${ROLE_COLOR[u.role] || ''}`}>
                      {ROLE_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}