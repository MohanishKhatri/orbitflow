import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { to: '/', label: 'Workflows' },
    { to: '/executions', label: 'Executions' },
  ];

  return (
    <nav className="border-b border-n-800 bg-n-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-n-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4"/></svg>
            </div>
            <span className="font-bold text-n-100 text-sm">OrbitFlow</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  pathname === l.to ? 'bg-n-850 text-n-100' : 'text-n-400 hover:text-n-200'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="text-xs text-n-500">{user.username}</span>}
          <button onClick={logout}
            className="text-xs text-n-500 hover:text-n-300 transition-colors">Logout</button>
        </div>
      </div>
    </nav>
  );
}
