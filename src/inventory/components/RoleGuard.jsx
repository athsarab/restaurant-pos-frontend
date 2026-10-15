import { useAuth } from '../hooks/useAuth';

// Component for role-based access control
export default function RoleGuard({ children, allowedRoles, fallback = null }) {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return fallback;
  }
  
  return children;
}