export const sidebarPermissions = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'abandoned-orders', label: 'Abandoned Orders' },
  { key: 'customers', label: 'Customers' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'status-updates', label: 'Update Statuses' },
  { key: 'shipper-advice', label: 'Shipper Advice' },
  { key: 'delivery-charges', label: 'Delivery Charges' },
  { key: 'packing-logs', label: 'Packing Logs' },
  { key: 'returns', label: 'Return Management' },
  { key: 'reports', label: 'Reports' },
  { key: 'products', label: 'Products' },
  { key: 'financials', label: 'Financials' },
  { key: 'brands', label: 'Brands' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'whatsapp-automation', label: 'WhatsApp Automation' },
  { key: 'courier-statuses', label: 'Courier Statuses' },
  { key: 'billing', label: 'Billing' },
  { key: 'activity-logs', label: 'Activity Logs' },
  { key: 'team', label: 'Team' },
];

export const routePermissionMap = {
  '/dashboard': 'dashboard',
  '/orders': 'orders',
  '/abandoned-orders': 'abandoned-orders',
  '/customers': 'customers',
  '/vendors': 'vendors',
  '/status-updates': 'status-updates',
  '/shipper-advice': 'shipper-advice',
  '/delivery-charges': 'delivery-charges',
  '/packing-logs': 'packing-logs',
  '/returns': 'returns',
  '/reports': 'reports',
  '/products': 'products',
  '/inventory': 'products',
  '/projections': 'financials',
  '/profit-loss-calculations': 'financials',
  '/overall-profit-loss': 'financials',
  '/brands': 'brands',
  '/integrations': 'integrations',
  '/leopard-pickup-addresses': 'integrations',
  '/settings/whatsapp': 'whatsapp-automation',
  '/settings/statuses': 'courier-statuses',
  '/settings/billing': 'billing',
  '/settings/activity-logs': 'activity-logs',
  '/settings/team-members': 'team',
};

export const permissionLandingPaths = {
  dashboard: '/dashboard',
  orders: '/orders',
  'abandoned-orders': '/abandoned-orders',
  customers: '/customers',
  vendors: '/vendors',
  'status-updates': '/status-updates',
  'shipper-advice': '/shipper-advice',
  'delivery-charges': '/delivery-charges',
  'packing-logs': '/packing-logs/pending',
  returns: '/returns/pending',
  reports: '/reports/overview',
  products: '/products',
  financials: '/projections',
  brands: '/brands',
  integrations: '/integrations',
  'whatsapp-automation': '/settings/whatsapp',
  'courier-statuses': '/settings/statuses',
  billing: '/settings/billing',
  'activity-logs': '/settings/activity-logs',
  team: '/settings/team-members',
};

export const permissionForPath = (path) => {
  const match = Object.entries(routePermissionMap)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => path.startsWith(prefix));

  return match?.[1] || null;
};

export const isTeamAdmin = (user) => ['admin', 'owner'].includes(user?.team_role || 'admin');

export const firstAccessiblePath = (user) => {
  if (isTeamAdmin(user)) return '/dashboard';

  const permissions = Array.isArray(user?.team_permissions) ? user.team_permissions : [];
  const permission = sidebarPermissions.find(item => permissions.includes(item.key));

  return permission ? permissionLandingPaths[permission.key] || '/dashboard' : '/access-denied';
};
