import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { DEFAULT_PERMISSIONS, normalizePermissions } from '../rbac/defaultPermissions';

const PermissionsContext = createContext(null);

const STORAGE_KEY = 'rbac_permissions_override_v1';

function mergeDefaultsWithOverrides(overrides) {
  // Shallow merge per role, per feature.
  const merged = { ...DEFAULT_PERMISSIONS };
  if (!overrides || typeof overrides !== 'object') return merged;

  for (const role of Object.keys(overrides)) {
    merged[role] = { ...(merged[role] || {}), ...(overrides[role] || {}) };
  }

  return normalizePermissions(merged);
}

function loadLocalOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocalOverrides(overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function PermissionsProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('defaults');
  const [overrides, setOverrides] = useState(() => loadLocalOverrides() || {});

  const permissionsByRole = useMemo(() => mergeDefaultsWithOverrides(overrides), [overrides]);

  const refreshFromServer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/permissions');

      // API supports returning either { permissionsByRole } (admin) or { role, permissions } (non-admin).
      if (res?.data?.permissionsByRole) {
        setOverrides(res.data.permissionsByRole);
        saveLocalOverrides(res.data.permissionsByRole);
        setSource('server');
      } else if (res?.data?.role && res?.data?.permissions) {
        const role = res.data.role;
        const rolePerms = res.data.permissions;
        const next = { ...(loadLocalOverrides() || {}), [role]: rolePerms };
        setOverrides(next);
        saveLocalOverrides(next);
        setSource('server');
      } else {
        setSource('defaults');
      }
    } catch {
      // No backend support yet or offline – keep local overrides and defaults.
      const local = loadLocalOverrides() || {};
      setSource(Object.keys(local).length ? 'local' : 'defaults');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  const saveRolePermissions = useCallback(async (role, rolePermissions) => {
    // Update local immediately for a snappy UI.
    setOverrides((prev) => {
      const next = { ...(prev || {}), [role]: rolePermissions };
      saveLocalOverrides(next);
      return next;
    });

    // Persist to backend (admin-only). Surface failure to caller.
    try {
      await api.put(`/permissions/${encodeURIComponent(role)}`, { permissions: rolePermissions });
      setSource('server');
      await refreshFromServer();
      return true;
    } catch (err) {
      setSource('local');
      throw err;
    }
  }, [refreshFromServer]);

  const value = useMemo(
    () => ({
      loading,
      source,
      permissionsByRole,
      refreshFromServer,
      saveRolePermissions
    }),
    [loading, source, permissionsByRole, refreshFromServer, saveRolePermissions]
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}
