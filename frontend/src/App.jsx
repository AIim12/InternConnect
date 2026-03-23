import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import FAQ from './pages/FAQ';
import AuthPage from './pages/AuthPage';

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-slate-800/50 backdrop-blur border-b border-slate-700/50 sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
        InternConnect
      </Link>
      <div className="flex gap-6 items-center text-sm">
        <Link to="/" className="text-slate-400 hover:text-slate-100 transition-colors">Home</Link>
        <Link to="/faq" className="text-slate-400 hover:text-slate-100 transition-colors">FAQ</Link>
        {user ? (
          <Link
            to={user.role === 'employer' ? '/employer' : '/student'}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link to="/auth" className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-semibold transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'employer' ? '/employer' : '/student'} />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/student" element={
          <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/employer" element={
          <ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-900 text-slate-100">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
