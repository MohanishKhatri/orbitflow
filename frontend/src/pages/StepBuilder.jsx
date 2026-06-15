import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { PageLoader } from '../components/Loaders';
import ErrorBanner from '../components/ErrorBanner';

const TYPES = ['HTTP', 'DISCORD_WEBHOOK', 'SMTP_EMAIL'];
const TYPE_LABELS = { HTTP: 'HTTP Request', DISCORD_WEBHOOK: 'Discord Webhook', SMTP_EMAIL: 'SMTP Email' };
const DEFAULTS = {
  HTTP: { method: 'GET', url: '', headers: {}, payload: {} },
  DISCORD_WEBHOOK: { url: '', content: '' },
  SMTP_EMAIL: { sender_mail: '', sender_password: '', receiver_mail: '', subject: '', body: '' },
};

export default function StepBuilder() {
  const { id: wfId } = useParams();
  const [wf, setWf] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [stepType, setStepType] = useState('HTTP');
  const [config, setConfig] = useState({ ...DEFAULTS.HTTP });
  const [runIf, setRunIf] = useState('');

  const [editingStep, setEditingStep] = useState(null);

  useEffect(() => { load(); }, [wfId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [w, s] = await Promise.all([
        api.get(`/api/workflows/${wfId}/`),
        api.get(`/api/workflows/${wfId}/steps/`),
      ]);
      setWf(w.data);
      setSteps(Array.isArray(s.data) ? s.data : s.data.results || []);
    } catch {
      setError('Failed to load workflow.');
    } finally {
      setLoading(false);
    }
  }

  function changeType(t) { 
    if (editingStep) return; // Disallow type change during edit for safety, or allow it
    setStepType(t); 
    setConfig({ ...DEFAULTS[t] }); 
    setRunIf(''); 
  }
  
  function set(k, v) { setConfig(prev => ({ ...prev, [k]: v })); }

  function handleEditClick(s) {
    setEditingStep(s);
    setStepType(s.type);
    
    const cfg = { ...s.config };
    if (cfg.run_if) {
      setRunIf(cfg.run_if);
      delete cfg.run_if;
    } else {
      setRunIf('');
    }
    setConfig(cfg);
    setToast(null);
  }

  function cancelEdit() {
    setEditingStep(null);
    setStepType('HTTP');
    setConfig({ ...DEFAULTS.HTTP });
    setRunIf('');
    setToast(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      const cfg = { ...config };
      if (runIf.trim()) cfg.run_if = runIf.trim();

      if (editingStep) {
        await api.patch(`/api/workflows/steps/${editingStep.id}/`, {
          type: stepType,
          config: cfg
        });
        setToast({ ok: true, msg: `Step ${editingStep.step_number} updated.` });
        cancelEdit();
      } else {
        const num = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) + 1 : 1;
        await api.post(`/api/workflows/${wfId}/steps/`, { step_number: num, type: stepType, config: cfg });
        setToast({ ok: true, msg: `Step ${num} added.` });
        setConfig({ ...DEFAULTS[stepType] });
        setRunIf('');
      }
      await load();
    } catch (err) {
      const d = err.response?.data;
      let msg = 'Failed to save step.';
      if (d) {
        if (typeof d === 'string') msg = d;
        else if (d.detail) msg = d.detail;
        else if (d.non_field_errors) msg = d.non_field_errors.join(' ');
        else { const v = Object.values(d)[0]; if (Array.isArray(v)) msg = v.join(' '); }
      }
      setToast({ ok: false, msg });
    } finally {
      setSaving(false);
    }
  }

  async function deleteStep(stepId, stepNum) {
    if (!window.confirm(`Are you sure you want to delete Step ${stepNum}?`)) return;
    setToast(null);
    try {
      await api.delete(`/api/workflows/steps/${stepId}/`);
      setToast({ ok: true, msg: `Step ${stepNum} deleted.` });
      if (editingStep?.id === stepId) {
        cancelEdit();
      }
      await load();
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.detail || 'Failed to delete step.' });
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-1.5 rounded-lg bg-n-900 border border-n-800 text-n-400 hover:text-n-200 hover:border-n-700 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-n-100">{wf?.title || 'Step Builder'}</h1>
          <p className="text-n-500 text-xs">Add and manage steps in your pipeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Form */}
        <div className="lg:col-span-2">
          {toast && (
            <div className={`anim-in mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
              toast.ok ? 'bg-ok/10 border-ok/20 text-ok' : 'bg-err/10 border-err/20 text-err'
            }`}>
              <span className="flex-1">{toast.msg}</span>
              <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="card p-5 space-y-5">
            <h2 className="text-sm font-semibold text-n-200">
              {editingStep ? `Edit Step #${editingStep.step_number} (${TYPE_LABELS[editingStep.type]})` : 'Add New Step'}
            </h2>

            {/* Type picker */}
            {!editingStep && (
              <div>
                <label className="label">Step Type</label>
                <div className="flex gap-2 flex-wrap">
                  {TYPES.map(t => (
                    <button key={t} type="button" onClick={() => changeType(t)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        stepType === t ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-n-900 border-n-800 text-n-400 hover:text-n-200 hover:border-n-700'
                      }`}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Config */}
            <div className="space-y-3">
              {stepType === 'HTTP' && <HttpForm config={config} set={set} />}
              {stepType === 'DISCORD_WEBHOOK' && <DiscordForm config={config} set={set} />}
              {stepType === 'SMTP_EMAIL' && <EmailForm config={config} set={set} />}
            </div>

            {/* run_if */}
            <div>
              <label className="label">Conditional (run_if)</label>
              <input type="text" value={runIf} onChange={e => setRunIf(e.target.value)}
                placeholder="e.g. {{steps.1.status_code}} == 200" className="input" />
              <p className="text-[11px] text-n-600 mt-1">Leave empty to always run this step.</p>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <span className="w-4 h-4 border-2 border-n-950/30 border-t-n-950 rounded-full anim-spin" />
                  : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                {saving ? 'Saving…' : editingStep ? 'Save Changes' : `Add Step #${steps.length + 1}`}
              </button>
              {editingStep && (
                <button type="button" onClick={cancelEdit} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-xs font-semibold text-n-400 uppercase tracking-wide mb-3">Pipeline ({steps.length} steps)</h2>
            {steps.length === 0 ? (
              <p className="text-xs text-n-600">No steps yet. Add one using the form.</p>
            ) : (
              <div className="space-y-2 stagger">
                {steps.map(s => {
                  const isEditing = editingStep?.id === s.id;
                  return (
                    <div key={s.id} className={`bg-n-850 border rounded-lg p-3 space-y-2 transition-all ${
                      isEditing ? 'border-amber-500/50 ring-1 ring-amber-500/20 bg-amber-500/2' : 'border-n-800 hover:border-n-700'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold flex items-center justify-center">{s.step_number}</span>
                          <span className="text-xs font-medium text-n-300">{TYPE_LABELS[s.type] || s.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button" 
                            onClick={() => handleEditClick(s)} 
                            className={`p-1 rounded hover:bg-n-800 transition-colors ${
                              isEditing ? 'text-amber-400' : 'text-n-500 hover:text-n-300'
                            }`}
                            title="Edit Step"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => deleteStep(s.id, s.step_number)} 
                            className="p-1 rounded text-n-500 hover:text-err hover:bg-err/10 transition-colors"
                            title="Delete Step"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <CopyBadge v={`{{steps.${s.step_number}.status_code}}`} />
                        <CopyBadge v={`{{steps.${s.step_number}.response_body}}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="card p-4">
            <h2 className="text-xs font-semibold text-n-400 uppercase tracking-wide mb-2">Webhook URL</h2>
            <p className="text-[11px] text-n-600 mb-2">Use this URL to trigger this workflow from external services (POST):</p>
            <div className="bg-n-950 border border-n-800 rounded-lg p-2.5 font-mono text-[10px] text-amber-300 break-all select-all leading-relaxed">
              {`${window.location.origin}/api/webhook/${wfId}/?token=${wf?.webhook_token}`}
            </div>
          </div>
          <div className="card p-4">
            <h2 className="text-xs font-semibold text-n-400 uppercase tracking-wide mb-2">Trigger Data</h2>
            <p className="text-[11px] text-n-600 mb-2">Available when triggered via webhook.</p>
            <div className="flex flex-wrap gap-1">
              <CopyBadge v="{{trigger.headers}}" />
              <CopyBadge v="{{trigger.query_params}}" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Config forms ─── */
function HttpForm({ config, set }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="label">Method</label>
          <select value={config.method} onChange={e => set('method', e.target.value)} className="input">
            <option>GET</option><option>POST</option>
          </select>
        </div>
        <div className="col-span-3">
          <label className="label">URL</label>
          <input type="text" value={config.url} onChange={e => set('url', e.target.value)} placeholder="https://api.example.com/data" required className="input" />
        </div>
      </div>
      <div>
        <label className="label">Payload (JSON)</label>
        <textarea value={typeof config.payload === 'string' ? config.payload : JSON.stringify(config.payload, null, 2)}
          onChange={e => { try { set('payload', JSON.parse(e.target.value)); } catch { set('payload', e.target.value); } }}
          rows={3} placeholder='{"key":"value"}' className="input font-mono text-xs resize-y" />
      </div>
      <div>
        <label className="label">Headers (JSON)</label>
        <textarea value={typeof config.headers === 'string' ? config.headers : JSON.stringify(config.headers, null, 2)}
          onChange={e => { try { set('headers', JSON.parse(e.target.value)); } catch { set('headers', e.target.value); } }}
          rows={2} placeholder='{"Authorization":"Bearer ..."}' className="input font-mono text-xs resize-y" />
      </div>
    </>
  );
}

function DiscordForm({ config, set }) {
  return (
    <>
      <div><label className="label">Webhook URL</label>
        <input type="text" value={config.url} onChange={e => set('url', e.target.value)} placeholder="https://discord.com/api/webhooks/..." required className="input" /></div>
      <div><label className="label">Message Content</label>
        <textarea value={config.content} onChange={e => set('content', e.target.value)} rows={3} required placeholder="Pipeline completed!" className="input resize-y" /></div>
    </>
  );
}

function EmailForm({ config, set }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Sender Email</label>
          <input type="email" value={config.sender_mail} onChange={e => set('sender_mail', e.target.value)} placeholder="you@example.com" required className="input" /></div>
        <div><label className="label">Sender Password</label>
          <input type="password" value={config.sender_password} onChange={e => set('sender_password', e.target.value)} placeholder="••••••••" required className="input" /></div>
      </div>
      <div><label className="label">Recipient</label>
        <input type="email" value={config.receiver_mail} onChange={e => set('receiver_mail', e.target.value)} placeholder="recipient@example.com" required className="input" /></div>
      <div><label className="label">Subject</label>
        <input type="text" value={config.subject} onChange={e => set('subject', e.target.value)} placeholder="Pipeline Alert" required className="input" /></div>
      <div><label className="label">Body</label>
        <textarea value={config.body} onChange={e => set('body', e.target.value)} rows={3} required placeholder="Your workflow completed." className="input resize-y" /></div>
    </>
  );
}

/* ─── Copy badge ─── */
function CopyBadge({ v }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(v); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      className="px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/15 text-amber-300/80 text-[10px] font-mono hover:bg-amber-500/15 transition-colors active:scale-95 cursor-pointer"
      title="Click to copy">
      {copied ? '✓ copied' : v}
    </button>
  );
}
