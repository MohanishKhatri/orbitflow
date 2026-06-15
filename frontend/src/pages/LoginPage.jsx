import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm anim-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-n-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/></svg>
          </div>
          <h1 className="text-xl font-bold text-n-100">Sign in to OrbitFlow</h1>
          <p className="text-n-500 text-sm mt-1">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-err/10 border border-err/20 text-err text-sm anim-in">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label htmlFor="u" className="label">Username</label>
            <input id="u" type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" className="input" placeholder="username" />
          </div>
          <div>
            <label htmlFor="p" className="label">Password</label>
            <input id="p" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" className="input" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="w-4 h-4 border-2 border-n-950/30 border-t-n-950 rounded-full anim-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-n-500 mt-5">
          No account?{' '}<Link to="/signup" className="text-amber-400 hover:text-amber-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
