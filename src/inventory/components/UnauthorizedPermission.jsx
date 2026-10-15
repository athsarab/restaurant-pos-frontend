import { useAuth } from '../hooks/useAuth';

export default function UnauthorizedPermission({ featureLabel, action = 'view' }) {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="max-w-md mx-auto text-center bg-slate-800/60 border border-slate-700 rounded-xl p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-300 mb-4">
          You don’t have permission to {action} <span className="font-medium">{featureLabel}</span>.
        </p>
        <div className="text-sm text-slate-400">
          Logged in as: <span className="font-medium text-slate-200">{user?.role || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}
