export const sidebarPermissions = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Orders' },
  { key: 'abandoned-orders', label: 'Abandoned Orders' },
  { key: 'customers', label: 'Customers' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'status-updates', label: 'Update Statuses' },
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

export const permissionForPath = (path) => {
  const match = Object.entries(routePermissionMap)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => path.startsWith(prefix));

  return match?.[1] || null;
};
