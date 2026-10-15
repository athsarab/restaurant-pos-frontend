import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  // Redirect users to their appropriate dashboard based on role
  switch (user?.role) {
    case 'cashier':
      return <Navigate to="cashier-dashboard" replace />;
    case 'waiter':
      return <Navigate to="waiter-dashboard" replace />;
    case 'kitchen':
      return <Navigate to="kitchen-orders" replace />;
    case 'admin':
    case 'accountant':
      return <Navigate to="dashboard" replace />;
    default:
      return <Navigate to="usage" replace />;
  }
};

export default RoleBasedRedirect;