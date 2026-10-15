// Default permission matrix for the Inventory portal.
// Single source of truth for initial RBAC; can be overridden by backend config.

export const ACTIONS = ['view', 'create', 'edit', 'approve', 'delete'];

export const DEFAULT_PERMISSIONS = {
  admin: {
    '*': { view: true, create: true, edit: true, approve: true, delete: true }
  },

  // Accountant exists in current system. Broad ops access but no staff/access-control by default.
  accountant: {
    dashboard: { view: true, create: false, edit: false, approve: false, delete: false },

    inventory: { view: true, create: true, edit: true, approve: false, delete: false },
    stockRequests: { view: true, create: true, edit: true, approve: true, delete: true },
    wastageManagement: { view: true, create: true, edit: true, approve: true, delete: true },
    outOfStock: { view: true, create: true, edit: true, approve: false, delete: true },
    categories: { view: true, create: true, edit: true, approve: false, delete: true },

    purchaseOrderGrn: { view: true, create: true, edit: true, approve: true, delete: true },
    grnReport: { view: true, create: false, edit: false, approve: true, delete: false },
    suppliers: { view: true, create: true, edit: true, approve: false, delete: true },
    supplierPayments: { view: true, create: true, edit: true, approve: true, delete: true },

    menuRecipes: { view: true, create: true, edit: true, approve: true, delete: true },
    menuPacking: { view: true, create: true, edit: true, approve: true, delete: true },
    menuAnalytics: { view: true, create: false, edit: false, approve: false, delete: false },

    deliveryManagement: { view: true, create: true, edit: true, approve: true, delete: true },
    deliveryAnalytics: { view: true, create: false, edit: false, approve: false, delete: false },
    deliveryHistory: { view: true, create: false, edit: false, approve: false, delete: false },

    transactions: { view: true, create: true, edit: true, approve: true, delete: true },
    reportsAnalytics: { view: true, create: false, edit: false, approve: false, delete: false },
    smsCampaigns: { view: true, create: true, edit: true, approve: true, delete: true }
  },

  // Kitchen: kitchen pages + Stock Requests + Wastage + Inventory view only.
  kitchen: {
    dashboard: { view: false, create: false, edit: false, approve: false, delete: false },

    kitchenDashboard: { view: true, create: true, edit: true, approve: false, delete: false },
    kitchenOrders: { view: true, create: false, edit: true, approve: false, delete: false },
    kitchenUsage: { view: true, create: true, edit: true, approve: false, delete: false },

    stockIssue: { view: true, create: true, edit: true, approve: false, delete: false },
    stockIssueHistory: { view: true, create: false, edit: false, approve: false, delete: false },
    kitchenInventory: { view: true, create: false, edit: false, approve: false, delete: false },
    productionPlanning: { view: true, create: true, edit: true, approve: false, delete: false },
    bakeryProductionEntry: { view: true, create: true, edit: true, approve: false, delete: false },

    inventory: { view: true, create: false, edit: false, approve: false, delete: false },
    stockRequests: { view: true, create: true, edit: true, approve: false, delete: false },
    wastageManagement: { view: true, create: true, edit: true, approve: false, delete: false },
    outOfStock: { view: true, create: false, edit: false, approve: false, delete: false }
  },

  // Cashier: order & billing only + optional delivery status updates + inventory view only.
  cashier: {
    dashboard: { view: false, create: false, edit: false, approve: false, delete: false },

    cashierDashboard: { view: true, create: true, edit: true, approve: true, delete: false },

    deliveryManagement: { view: true, create: false, edit: true, approve: false, delete: false },
    deliveryHistory: { view: true, create: false, edit: false, approve: false, delete: false },

    inventory: { view: true, create: false, edit: false, approve: false, delete: false },

    orderAnalytics: { view: true, create: false, edit: false, approve: false, delete: false }
  },

  waiter: {
    waiterDashboard: { view: true, create: false, edit: true, approve: false, delete: false },
    deliveryManagement: { view: true, create: false, edit: true, approve: false, delete: false },
    deliveryHistory: { view: true, create: false, edit: false, approve: false, delete: false }
  },

  // Legacy/unused role in some DBs; keep it locked down by default.
  staff: {}
};
export function normalizePermissions(permissionsByRole) {
  const normalized = { ...permissionsByRole };
  for (const role of Object.keys(normalized)) {
    normalized[role] = normalized[role] || {};
  }
  return normalized;
}

export function getDefaultRolePermissions(role) {
  return DEFAULT_PERMISSIONS[role] || {};
}
