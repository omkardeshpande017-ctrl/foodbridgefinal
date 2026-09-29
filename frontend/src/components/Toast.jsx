import {
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-50 card p-4 flex gap-3 items-start max-w-sm">
      <div
        className={
          toast.type === 'error'
            ? 'text-red-600'
            : 'text-green-600'
        }
      >
        {toast.type === 'error' ? (
          <AlertCircle />
        ) : (
          <CheckCircle />
        )}
      </div>

      <div className="flex-1">
        <b>{toast.title || 'Done'}</b>

        <p className="text-sm text-slate-600 mt-1">
          {toast.message}
        </p>
      </div>

      <button onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}