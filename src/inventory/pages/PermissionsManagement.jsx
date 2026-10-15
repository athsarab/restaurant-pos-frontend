import { useMemo, useState } from 'react';
import menuConfig from '../rbac/menuConfig.json';
import Card from '../components/ui/Card';
import { ACTIONS } from '../rbac/defaultPermissions';
import { usePermissions } from '../context/PermissionsContext';

const ROLE_OPTIONS = [
  { key: 'admin', label: 'Admin' },
  { key: 'accountant', label: 'Accountant' },
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'cashier', label: 'Cashier' },
  { key: 'waiter', label: 'Waiter' },
  { key: 'staff', label: 'Staff' }
];

function emptyPerms() {
  return { view: false, create: false, edit: false, approve: false, delete: false };
}

function normalizeFeaturePerms(value) {
  // Backward-compatible: some legacy payloads store feature permission as boolean.
  if (typeof value === 'boolean') return { ...emptyPerms(), view: value };
  if (!value || typeof value !== 'object') return emptyPerms();
  return {
    view: Boolean(value.view),
    create: Boolean(value.create),
    edit: Boolean(value.edit),
    approve: Boolean(value.approve),
    delete: Boolean(value.delete)
  };
}

function sanitizeRolePermsForSave(rolePerms, items) {
  const cleaned = {};

  // Only persist known menu features (prevents invalid keys/types breaking backend validation)
  for (const item of items) {
    cleaned[item.key] = normalizeFeaturePerms(rolePerms?.[item.key]);
  }

  // Preserve wildcard for admin if present
  if (rolePerms?.['*'] && typeof rolePerms['*'] === 'object') {
    cleaned['*'] = normalizeFeaturePerms(rolePerms['*']);
  }

  return cleaned;
}

export default function PermissionsManagement() {
  const { permissionsByRole, saveRolePermissions, source } = usePermissions();
  const [selectedRole, setSelectedRole] = useState('kitchen');
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => menuConfig.items, []);

  const rolePerms = permissionsByRole[selectedRole] || {};

  const setPermission = (featureKey, action, value) => {
    const current = rolePerms[featureKey] || emptyPerms();
    const nextRolePerms = {
      ...rolePerms,
      [featureKey]: { ...current, [action]: value }
    };

    const safeToSave = sanitizeRolePermsForSave(nextRolePerms, items);

    // Save live (single source of truth in provider)
    setSaving(true);
    Promise.resolve(saveRolePermissions(selectedRole, safeToSave))
      .catch((err) => {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to save permissions to server.';
        alert(message);
      })
      .finally(() => setSaving(false));
  };

  const setAllForRole = (action, value) => {
    const nextRolePerms = { ...rolePerms };
    for (const item of items) {
      const current = nextRolePerms[item.key] || emptyPerms();
      nextRolePerms[item.key] = { ...current, [action]: value };
    }
    const safeToSave = sanitizeRolePermsForSave(nextRolePerms, items);
    setSaving(true);
    Promise.resolve(saveRolePermissions(selectedRole, safeToSave))
      .catch((err) => {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to save permissions to server.';
        alert(message);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
        <h1 className="text-2xl font-bold text-white">Access Control</h1>
        <p className="text-slate-400 mt-1">Manage per-role permissions for sidebar features (stored by domain).</p>
        <div className="mt-2 text-xs text-slate-500">Source: {source}{saving ? ' • saving…' : ''}</div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <select
              className="form-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((action) => (
              <div key={action} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400 capitalize">{action}</span>
                <button
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => setAllForRole(action, true)}
                  type="button"
                >
                  All On
                </button>
                <button
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                  onClick={() => setAllForRole(action, false)}
                  type="button"
                >
                  All Off
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Features">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300 border-b border-slate-700">
                <th className="py-3 pr-4">Feature</th>
                <th className="py-3 pr-4">Tab</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="py-3 pr-4 capitalize">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const p = rolePerms[item.key] || emptyPerms();
                return (
                  <tr key={item.key} className="border-b border-slate-800">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-white">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.key}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-400 capitalize">{item.tab}</td>
                    {ACTIONS.map((action) => (
                      <td key={action} className="py-3 pr-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(p[action])}
                            onChange={(e) => setPermission(item.key, action, e.target.checked)}
                          />
                          <span className="text-slate-400">&nbsp;</span>
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
