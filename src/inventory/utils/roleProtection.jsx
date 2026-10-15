import { useAuth } from '../hooks/useAuth';
import UnauthorizedAccess from '../components/UnauthorizedAccess';

// Higher-order component for page-level protection
export function withRoleProtection(Component, allowedRoles) {
  return function ProtectedComponent(props) {
    const { user, loading } = useAuth();
    
    if (loading || !user) {
      return null; // Let the main app handle loading states
    }
    
    if (!allowedRoles.includes(user.role)) {
      return <UnauthorizedAccess requiredRoles={allowedRoles} />;
    }
    
    return <Component {...props} />;
  };
}