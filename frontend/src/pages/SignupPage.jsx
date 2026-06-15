import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(username, email, password);
      navigate('/login');
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        setError(Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`).join('\n'));
      } else {
        setError('Signup failed.');
      }
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
          <h1 className="text-xl font-bold text-n-100">Create your account</h1>
          <p className="text-n-500 text-sm mt-1">Get started with OrbitFlow</p>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-err/10 border border-err/20 text-err text-sm whitespace-pre-line anim-in">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div>
            <label htmlFor="u" className="label">Username</label>
            <input id="u" type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" className="input" placeholder="pick_a_username" />
          </div>
          <div>
            <label htmlFor="e" className="label">Email</label>
            <input id="e" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="p" className="label">Password</label>
            <input id="p" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" className="input" placeholder="min. 8 characters" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="w-4 h-4 border-2 border-n-950/30 border-t-n-950 rounded-full anim-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-n-500 mt-5">
          Have an account?{' '}<Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
