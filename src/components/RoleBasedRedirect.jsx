import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleBasedRedirect = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Redirect based on user role
    switch (user?.role) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'accountant':
        navigate('/accountant', { replace: true });
        break;
      case 'kitchen':
        navigate('/kitchen', { replace: true });
        break;
      case 'cashier':
        navigate('/cashier', { replace: true });
        break;
      case 'waiter':
        navigate('/waiter', { replace: true });
        break;
      default:
        // If role is not recognized, redirect to login
        navigate('/login', { replace: true });
        break;
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-300 mt-4">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;