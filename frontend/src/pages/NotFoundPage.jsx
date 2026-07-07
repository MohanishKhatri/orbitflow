import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-n-950 anim-in">
      <div className="max-w-md w-full text-center stagger space-y-6">
        {/* Glowy Amber 404 Number */}
        <div className="relative inline-block select-none">
          <span className="text-8xl font-black text-n-850 tracking-widest block filter blur-sm">
            404
          </span>
          <span className="text-8xl font-black text-amber-500 tracking-widest absolute inset-0 drop-shadow-[0_0_15px_rgba(249,115,22,0.35)]">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-n-50">Page Not Found</h1>
          <p className="text-sm text-n-400">
            The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/" className="btn-primary">
            Return to Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
