import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { PageLoader } from '../components/Loaders';
import ErrorBanner from '../components/ErrorBanner';

const ST = {
  R: { label: 'Running',  cls: 'bg-blue/10 border-blue/20 text-blue', dot: 'bg-blue',  pulse: true },
  S: { label: 'Success',  cls: 'bg-ok/10 border-ok/20 text-ok',       dot: 'bg-ok',    pulse: false },
  F: { label: 'Failed',   cls: 'bg-err/10 border-err/20 text-err',    dot: 'bg-err',   pulse: false },
  K: { label: 'Skipped',  cls: 'bg-n-800 border-n-700 text-n-400',    dot: 'bg-n-500', pulse: false },
  P: { label: 'Pending',  cls: 'bg-warn/10 border-warn/20 text-warn', dot: 'bg-warn',  pulse: true },
};

export default function ExecutionTracker() {
  const { id } = useParams();
  const [exec, setExec] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);
  const iv = useRef(null);

  useEffect(() => {
    fetchAll();
    iv.current = setInterval(() => fetchAll(true), 2000);
    return () => { if (iv.current) clearInterval(iv.current); };
  }, [id]);

  async function fetchAll(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [e, l] = await Promise.all([
        api.get(`/api/workflows/executions/${id}/`),
        api.get(`/api/workflows/executions/${id}/step-runs/`),
      ]);
      setExec(e.data);
      setLogs(Array.isArray(l.data) ? l.data : l.data.results || []);
      if (e.data.status === 'S' || e.data.status === 'F') {
        if (iv.current) { clearInterval(iv.current); iv.current = null; }
        setPolling(false);
      }
    } catch {
      if (!silent) setError('Failed to load execution.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  const st = { P:'Pending', R:'Running', S:'Successful', F:'Failed' }[exec?.status] || 'Unknown';
  const stColor = { P:'text-warn', R:'text-blue', S:'text-ok', F:'text-err' }[exec?.status] || 'text-n-400';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/executions" className="p-1.5 rounded-lg bg-n-900 border border-n-800 text-n-400 hover:text-n-200 hover:border-n-700 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-n-100">Execution #{id}</h1>
          <p className="text-n-500 text-xs truncate">
            {exec?.workflow_title || `Workflow #${exec?.workflow}`}
            {exec?.started_at && ` · ${new Date(exec.started_at).toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exec?.status === 'R' && <span className="w-3.5 h-3.5 border-2 border-blue/40 border-t-blue rounded-full anim-spin" />}
          <span className={`text-sm font-semibold ${stColor}`}>{st}</span>
        </div>
      </div>

      {polling && (
        <div className="flex items-center gap-2 mb-4 text-[11px] text-n-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 anim-pulse" />
          Live — refreshing every 2s
        </div>
      )}

      {/* Timeline */}
      {logs.length === 0 ? (
        <div className="anim-in card p-8 text-center"><p className="text-n-500 text-sm">Waiting for execution to start…</p></div>
      ) : (
        <div className="stagger">
          {logs.map((log, i) => {
            const c = ST[log.status] || ST.P;
            return (
              <div key={log.id || i} className="flex gap-3">
                {/* Rail */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 mt-[18px] ${
                    log.status === 'R' ? 'border-blue bg-blue/30 anim-pulse' :
                    log.status === 'S' ? 'border-ok bg-ok/30' :
                    log.status === 'F' ? 'border-err bg-err/30' :
                    log.status === 'K' ? 'border-n-500 bg-n-600/30' : 'border-warn bg-warn/30'
                  }`} />
                  {i < logs.length - 1 && <div className="w-px flex-1 bg-n-800 min-h-[16px]" />}
                </div>
                {/* Card */}
                <div className="flex-1 mb-2">
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-n-200">Step {log.step_number}</span>
                        <span className={`badge border ${c.cls}`}>
                          {c.pulse && <span className={`w-1.5 h-1.5 rounded-full ${c.dot} anim-pulse`} />}
                          {c.label}
                        </span>
                      </div>
                      {log.started_at && (
                        <span className="text-[11px] text-n-600">
                          {new Date(log.started_at).toLocaleTimeString()}
                          {log.finished_at && ` → ${new Date(log.finished_at).toLocaleTimeString()}`}
                        </span>
                      )}
                    </div>
                    {(log.output || log.error_message) && (
                      <details className="group mt-2">
                        <summary className="cursor-pointer text-[11px] font-medium text-n-500 hover:text-n-300 transition-colors select-none flex items-center gap-1">
                          <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
                          Details
                        </summary>
                        <div className="mt-2 space-y-2">
                          {log.output && (
                            <div>
                              <p className="text-[10px] font-medium text-n-500 uppercase mb-1">Output</p>
                              <pre className="p-3 rounded-lg bg-n-950 border border-n-800 text-xs text-n-300 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                                {JSON.stringify(log.output, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.error_message && (
                            <div>
                              <p className="text-[10px] font-medium text-err uppercase mb-1">Error</p>
                              <pre className="p-3 rounded-lg bg-err/5 border border-err/15 text-xs text-err/80 font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {log.error_message}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {exec && (exec.status === 'S' || exec.status === 'F') && exec.finished_at && (
        <div className="mt-4 card p-4 text-center anim-in">
          <p className="text-xs text-n-400">
            Finished at <span className="text-n-200 font-medium">{new Date(exec.finished_at).toLocaleString()}</span>
          </p>
          {exec.status === 'F' && <p className="mt-1 text-xs text-err">Pipeline failed. Expand the failing step to view the error.</p>}
        </div>
      )}
    </div>
  );
}
