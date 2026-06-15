import { useState, useEffect } from 'react';

export default function ErrorBanner({ message, onDismiss }) {
  const [show, setShow] = useState(true);
  useEffect(() => { setShow(true); }, [message]);
  if (!show || !message) return null;

  return (
    <div className="anim-in mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-err/10 border border-err/20 text-err text-sm">
      <span className="flex-1">{message}</span>
      <button onClick={() => { setShow(false); onDismiss?.(); }}
        className="p-0.5 hover:bg-err/10 rounded transition-colors text-err/60 hover:text-err">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}
