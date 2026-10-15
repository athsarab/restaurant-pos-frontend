import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../context/PermissionsContext';
import UnauthorizedPermission from '../components/UnauthorizedPermission';
import { canDo } from '../rbac/permissionUtils';

export function withPermissionProtection(Component, { featureKey, featureLabel, action = 'view' }) {
  return function ProtectedByPermission(props) {
    const { user, loading: authLoading } = useAuth();
    const { loading: permsLoading, permissionsByRole } = usePermissions();

    if (authLoading || permsLoading || !user) return null;

    const allowed = canDo(user.role, permissionsByRole, featureKey, action);

    if (!allowed) {
      return <UnauthorizedPermission featureLabel={featureLabel || featureKey} action={action} />;
    }

    return <Component {...props} />;
  };
}
