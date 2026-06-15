import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { SkeletonList } from '../components/Loaders';
import ErrorBanner from '../components/ErrorBanner';

export default function WorkflowDashboard() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [triggeringId, setTriggeringId] = useState(null);
  const [toast, setToast] = useState(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Rename workflow
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete workflow
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Toggling status
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => { fetchWorkflows(); }, []);

  async function fetchWorkflows() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/workflows/');
      setWorkflows(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setError('Failed to load workflows. Is the Django server running?');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/api/workflows/', { title: newTitle.trim() });
      setNewTitle('');
      setShowCreate(false);
      navigate(`/builder/${res.data.id}`);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.title?.[0] || d?.detail || 'Failed to create workflow.');
    } finally {
      setCreating(false);
    }
  }

  async function triggerWorkflow(id) {
    setTriggeringId(id);
    setToast(null);
    const wf = workflows.find(w => w.id === id);
    const token = wf?.webhook_token || '';
    try {
      const res = await api.post(`/api/webhook/${id}/?token=${token}`, {});
      setToast({ ok: true, msg: `Triggered — Execution #${res.data.execution_id}`, execId: res.data.execution_id });
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.error || 'Failed to trigger.' });
    } finally {
      setTriggeringId(null);
    }
  }

  async function toggleActive(id, currentStatus) {
    setTogglingId(id);
    setToast(null);
    try {
      const res = await api.patch(`/api/workflows/${id}/`, { is_active: !currentStatus });
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_active: res.data.is_active } : w));
      setToast({ ok: true, msg: `Workflow set to ${res.data.is_active ? 'Active' : 'Inactive'}.` });
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.detail || 'Failed to toggle status.' });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleRename(e, id) {
    e.preventDefault();
    if (!editingTitle.trim()) return;
    setRenaming(true);
    setToast(null);
    try {
      const res = await api.patch(`/api/workflows/${id}/`, { title: editingTitle.trim() });
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, title: res.data.title } : w));
      setEditingId(null);
      setEditingTitle('');
      setToast({ ok: true, msg: 'Workflow renamed successfully.' });
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.title?.[0] || 'Failed to rename workflow.' });
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setToast(null);
    try {
      await api.delete(`/api/workflows/${id}/`);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      setConfirmDeleteId(null);
      setToast({ ok: true, msg: 'Workflow deleted successfully.' });
    } catch (err) {
      setToast({ ok: false, msg: err.response?.data?.detail || 'Failed to delete workflow.' });
    } finally {
      setDeletingId(null);
    }
  }

  function startEditing(id, title) {
    setEditingId(id);
    setEditingTitle(title);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-n-100">Workflows</h1>
          <p className="text-n-500 text-xs mt-0.5">Create and manage your automation pipelines</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Workflow
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="anim-in card p-4 mb-5 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="wf-title" className="label">Workflow name</label>
            <input id="wf-title" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. User Sync Pipeline" required autoFocus className="input" />
          </div>
          <button type="submit" disabled={creating || !newTitle.trim()} className="btn-primary shrink-0">
            {creating ? <span className="w-4 h-4 border-2 border-n-950/30 border-t-n-950 rounded-full anim-spin" /> : 'Create & Add Steps'}
          </button>
          <button type="button" onClick={() => { setShowCreate(false); setNewTitle(''); }}
            className="btn-secondary shrink-0">Cancel</button>
        </form>
      )}

      {/* Toast */}
      {toast && (
        <div className={`anim-in mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
          toast.ok ? 'bg-ok/10 border-ok/20 text-ok' : 'bg-err/10 border-err/20 text-err'
        }`}>
          <span className="flex-1">{toast.msg}</span>
          {toast.ok && toast.execId && (
            <Link to={`/execution/${toast.execId}`} className="underline underline-offset-2 text-xs">Track →</Link>
          )}
          <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? <SkeletonList count={4} /> : workflows.length === 0 && !showCreate ? (
        <div className="anim-in text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-n-900 border border-n-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-n-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="13" y2="13"/></svg>
          </div>
          <p className="text-n-400 font-medium mb-1">No workflows yet</p>
          <p className="text-n-600 text-sm mb-5">Create your first pipeline to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">Create Your First Workflow</button>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {workflows.map(wf => (
            <div key={wf.id} className="card p-4 flex items-center justify-between gap-4 group transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,3 21,3 21,8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21,16 21,21 16,21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  {editingId === wf.id ? (
                    <form onSubmit={(e) => handleRename(e, wf.id)} className="flex items-center gap-2 max-w-md anim-in">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        className="input py-1.5 px-3 text-xs w-full max-w-xs"
                        autoFocus
                        disabled={renaming}
                        required
                      />
                      <button type="submit" disabled={renaming} className="text-ok hover:text-ok/80 p-1 disabled:opacity-40" title="Save">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button type="button" onClick={() => { setEditingId(null); setEditingTitle(''); }} className="text-err hover:text-err/80 p-1" title="Cancel">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 group/title">
                      <h3 className="text-sm font-semibold text-n-200 truncate group-hover:text-n-50 transition-colors">{wf.title}</h3>
                      <button onClick={() => startEditing(wf.id, wf.title)} className="opacity-0 group-hover/title:opacity-100 p-0.5 text-n-500 hover:text-amber-400 transition-all cursor-pointer" title="Rename workflow">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-n-600">{new Date(wf.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    
                    <button 
                      onClick={() => toggleActive(wf.id, wf.is_active)} 
                      disabled={togglingId === wf.id}
                      className={`badge border border-transparent transition-all cursor-pointer select-none ${
                        wf.is_active 
                          ? 'bg-ok/10 text-ok hover:bg-ok/20' 
                          : 'bg-n-800 text-n-500 hover:bg-n-700'
                      }`}
                      title={togglingId === wf.id ? "Updating..." : `Click to toggle status`}
                    >
                      {togglingId === wf.id ? (
                        <span className="w-1.5 h-1.5 border border-n-500 border-t-transparent rounded-full anim-spin" />
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${wf.is_active ? 'bg-ok anim-pulse' : 'bg-n-600'}`} />
                      )}
                      {wf.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {confirmDeleteId === wf.id ? (
                  <div className="flex items-center gap-1.5 anim-in">
                    <span className="text-[11px] text-n-500">Confirm?</span>
                    <button 
                      onClick={() => handleDelete(wf.id)} 
                      disabled={deletingId === wf.id} 
                      className="btn-primary bg-err text-n-950 hover:bg-err/80 text-xs py-1.5 px-2.5"
                    >
                      {deletingId === wf.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(null)} 
                      className="btn-secondary text-xs py-1.5 px-2.5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => triggerWorkflow(wf.id)} disabled={triggeringId === wf.id || !wf.is_active}
                      className="btn-primary text-xs py-2 px-3">
                      {triggeringId === wf.id
                        ? <span className="w-3.5 h-3.5 border-2 border-n-950/30 border-t-n-950 rounded-full anim-spin" />
                        : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>}
                      {triggeringId === wf.id ? 'Running…' : 'Run'}
                    </button>
                    <Link to={`/builder/${wf.id}`} className="btn-secondary text-xs py-2 px-3">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Steps
                    </Link>
                    <button 
                      onClick={() => setConfirmDeleteId(wf.id)}
                      className="btn-secondary text-xs py-2 px-3 hover:text-err hover:border-err/40 transition-colors cursor-pointer"
                      title="Delete Workflow"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
