import { useAuth } from '../hooks/useAuth';

export default function UnauthorizedAccess({ requiredRoles }) {
  const { user } = useAuth();
  
  const roleDescriptions = {
    admin: 'Administrator',
    accountant: 'Accountant',
    kitchen: 'Kitchen Staff'
  };
  
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="max-w-md mx-auto text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-3-6l3-3m0 0l3-3m-3 3V9a6 6 0 016 6m-6-6l-3 3"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Restricted</h2>
        
        <p className="text-slate-600 mb-4">
          You don't have permission to access this page. This page is restricted to:
        </p>
        
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            {requiredRoles.map((role) => (
              <span 
                key={role}
                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
              >
                {roleDescriptions[role] || role}
              </span>
            ))}
          </div>
        </div>
        
        <div className="text-sm text-slate-500 space-y-2">
          <p>
            You are currently logged in as: {' '}
            <span className="font-medium text-slate-700">
              {roleDescriptions[user?.role] || user?.role || 'Unknown'}
            </span>
          </p>
          <p>
            Contact your administrator if you need access to this section.
          </p>
        </div>
        
        <div className="mt-6">
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}