import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { SkeletonList } from '../components/Loaders';
import ErrorBanner from '../components/ErrorBanner';

const STATUS = {
  P: { label: 'Pending',    cls: 'bg-warn/10 text-warn',  dot: 'bg-warn anim-pulse' },
  R: { label: 'Running',    cls: 'bg-blue/10 text-blue',  dot: 'bg-blue anim-pulse' },
  S: { label: 'Successful', cls: 'bg-ok/10 text-ok',      dot: 'bg-ok' },
  F: { label: 'Failed',     cls: 'bg-err/10 text-err',    dot: 'bg-err' },
};

export default function ExecutionsList() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [retrying, setRetrying] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchExecs(); }, [filter]);

  async function fetchExecs() {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/workflows/executions/?ordering=-started_at';
      if (filter) url += `&status=${filter}`;
      const res = await api.get(url);
      setExecutions(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setError('Failed to load executions.');
    } finally {
      setLoading(false);
    }
  }

  async function retryExec(execId) {
    setRetrying(execId);
    setToast(null);
    try {
      const res = await api.post(`/api/workflows/executions/${execId}/retry/`);
      setToast({ ok: true, msg: `Retried — new Execution #${res.data.execution_id}`, execId: res.data.execution_id });
      await fetchExecs();
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.error || 'Retry failed.' });
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-n-100">Executions</h1>
          <p className="text-n-500 text-xs mt-0.5">View and track all workflow runs</p>
        </div>
        {/* Filter */}
        <div className="flex gap-1">
          {[{ v: '', l: 'All' }, { v: 'S', l: 'Success' }, { v: 'F', l: 'Failed' }, { v: 'R', l: 'Running' }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.v ? 'bg-n-850 text-n-100 border border-n-700' : 'text-n-500 hover:text-n-300'
              }`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`anim-in mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
          toast.ok ? 'bg-ok/10 border-ok/20 text-ok' : 'bg-err/10 border-err/20 text-err'
        }`}>
          <span className="flex-1">{toast.msg}</span>
          {toast.ok && toast.execId && <Link to={`/execution/${toast.execId}`} className="underline underline-offset-2 text-xs">Track →</Link>}
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {loading ? <SkeletonList count={5} /> : executions.length === 0 ? (
        <div className="anim-in card p-10 text-center">
          <p className="text-n-400 text-sm">No executions found{filter ? ' with this filter' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {executions.map(ex => {
            const s = STATUS[ex.status] || STATUS.P;
            return (
              <div key={ex.id} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-bold text-n-300 w-8 text-right shrink-0">#{ex.id}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-n-200 font-medium truncate">{ex.workflow_title || `Workflow #${ex.workflow}`}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-n-600">{new Date(ex.started_at).toLocaleString()}</span>
                      {ex.triggered_by_username && <span className="text-[11px] text-n-600">by {ex.triggered_by_username}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${s.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                  <Link to={`/execution/${ex.id}`} className="btn-secondary text-xs py-1.5 px-2.5">
                    View
                  </Link>
                  {ex.status === 'F' && (
                    <button onClick={() => retryExec(ex.id)} disabled={retrying === ex.id}
                      className="btn-primary text-xs py-1.5 px-2.5">
                      {retrying === ex.id ? <span className="w-3 h-3 border-2 border-n-950/30 border-t-n-950 rounded-full anim-spin" /> : 'Retry'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
