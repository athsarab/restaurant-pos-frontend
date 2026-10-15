import { DEFAULT_PERMISSIONS } from './defaultPermissions';

export function resolvePermission({
  permissionsByRole,
  role,
  featureKey,
  action
}) {
  if (!role || !featureKey || !action) return false;

  // Admin shortcut (supports dynamic admin override too).
  const rolePerms = permissionsByRole?.[role] || DEFAULT_PERMISSIONS[role] || {};

  // Wildcard grants (mainly for admin).
  const wildcard = rolePerms['*'];
  if (wildcard && wildcard[action] === true) return true;

  const feature = rolePerms[featureKey];
  if (!feature) return false;

  return feature[action] === true;
}

// Hard business-rule caps: even if an admin toggles something on,
// these roles should not be able to access sensitive modules.
// Keep this small and explicit; defaults remain in DEFAULT_PERMISSIONS.
const ROLE_DENYLIST = {
  kitchen: new Set([
    'purchaseOrderGrn',
    'suppliers',
    'supplierPayments',
    'transactions',
    'accessControl'
  ]),
  cashier: new Set([
    'purchaseOrderGrn',
    'suppliers',
    'supplierPayments',
    'accessControl'
  ]),
  waiter: new Set([
    'purchaseOrderGrn',
    'inventory',
    'suppliers',
    'supplierPayments',
    'transactions',
    'accessControl'
  ]),
  staff: new Set([
    'purchaseOrderGrn',
    'suppliers',
    'supplierPayments',
    'transactions',
    'accessControl'
  ])
};

export function isFeatureCapped(role, featureKey) {
  if (!role || !featureKey) return false;
  return ROLE_DENYLIST[role]?.has(featureKey) === true;
}

export function canDo(role, permissionsByRole, featureKey, action = 'view') {
  if (isFeatureCapped(role, featureKey)) return false;
  return resolvePermission({ permissionsByRole, role, featureKey, action });
}

export function canViewFeature(permissionsByRole, role, featureKey) {
  return canDo(role, permissionsByRole, featureKey, 'view');
}
