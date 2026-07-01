import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { firstAccessiblePath, isTeamAdmin, permissionForPath } from '../constants/sidebarPermissions';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../pages/LoginPage.vue'), meta: { requiresGuest: true } },
  { path: '/register', component: () => import('../pages/RegisterPage.vue'), meta: { requiresGuest: true } },
  { path: '/forgot-password', component: () => import('../pages/ForgotPasswordPage.vue'), meta: { requiresGuest: true } },
  { path: '/reset-password', component: () => import('../pages/ResetPasswordPage.vue'), meta: { requiresGuest: true } },
  { path: '/access-denied', component: () => import('../pages/AccessDeniedPage.vue'), meta: { requiresAuth: true } },
  { path: '/dashboard', component: () => import('../pages/DashboardPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings', component: () => import('../pages/settings/SettingsPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/statuses', component: () => import('../pages/settings/SettingsPage.vue'), meta: { requiresAuth: true, settingsTab: 'statuses' } },
  { path: '/settings/whatsapp', component: () => import('../pages/settings/WhatsAppAutomationPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/billing', component: () => import('../pages/settings/BillingPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/activity-logs', component: () => import('../pages/settings/ActivityLogsPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/security', component: () => import('../pages/settings/SecurityPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/team-members', component: () => import('../pages/settings/TeamMembersPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/team-members/create', component: () => import('../pages/settings/TeamMemberFormPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/team-members/:id/edit', component: () => import('../pages/settings/TeamMemberFormPage.vue'), meta: { requiresAuth: true } },
  { path: '/orders', component: () => import('../pages/OrdersPage.vue'), meta: { requiresAuth: true } },
  { path: '/abandoned-orders', component: () => import('../pages/AbandonedOrdersPage.vue'), meta: { requiresAuth: true } },
  { path: '/vendors', component: () => import('../pages/vendors/VendorsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/vendors/invoices', component: () => import('../pages/vendors/InvoicesListPage.vue'), meta: { requiresAuth: true } },
  { path: '/vendors/bilties', component: () => import('../pages/vendors/BiltiesListPage.vue'), meta: { requiresAuth: true } },
  { path: '/vendors/stock-receipts', component: () => import('../pages/vendors/StockReceiptsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/vendors/:id', component: () => import('../pages/vendors/VendorDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/status-updates', component: () => import('../pages/StatusUpdatesPage.vue'), meta: { requiresAuth: true } },
  { path: '/status-updates/fetch/:courierSlug', component: () => import('../pages/StatusUpdateFetchPage.vue'), meta: { requiresAuth: true } },
  { path: '/shipper-advice', component: () => import('../pages/ShipperAdvicePage.vue'), meta: { requiresAuth: true } },
  { path: '/delivery-charges', component: () => import('../pages/DeliveryChargesPage.vue'), meta: { requiresAuth: true } },
  { path: '/delivery-charges/fetch/:courierSlug', component: () => import('../pages/DeliveryChargeFetchPage.vue'), meta: { requiresAuth: true } },
  { path: '/packing-logs', redirect: '/packing-logs/pending' },
  { path: '/packing-logs/pending', component: () => import('../pages/PackingLogsPage.vue'), meta: { requiresAuth: true, packingView: 'pending' } },
  { path: '/packing-logs/packed', component: () => import('../pages/PackingLogsPage.vue'), meta: { requiresAuth: true, packingView: 'packed' } },
  { path: '/packing-logs/scan', component: () => import('../pages/PackingShipmentScanPage.vue'), meta: { requiresAuth: true } },
  { path: '/packing-logs/products', component: () => import('../pages/PackingProductsPage.vue'), meta: { requiresAuth: true } },
  { path: '/returns', redirect: '/returns/pending' },
  { path: '/returns/pending', component: () => import('../pages/ReturnManagementPage.vue'), meta: { requiresAuth: true, returnView: 'pending' } },
  { path: '/returns/received', component: () => import('../pages/ReturnManagementPage.vue'), meta: { requiresAuth: true, returnView: 'received' } },
  { path: '/returns/scan', component: () => import('../pages/ReturnScanPage.vue'), meta: { requiresAuth: true } },
  { path: '/cancelled', redirect: '/reports/cancel' },
  { path: '/return-performance', redirect: '/reports/returns' },
  { path: '/reports', redirect: '/reports/overview' },
  { path: '/reports/overview', component: () => import('../pages/ReportsOverviewPage.vue'), meta: { requiresAuth: true } },
  { path: '/reports/cancel', component: () => import('../pages/OrderPerformancePage.vue'), meta: { requiresAuth: true, performanceType: 'cancelled' } },
  { path: '/reports/returns', component: () => import('../pages/OrderPerformancePage.vue'), meta: { requiresAuth: true, performanceType: 'returns' } },
  { path: '/reports/in-progress', component: () => import('../pages/InProgressOrderReportPage.vue'), meta: { requiresAuth: true } },
  { path: '/reports/products', component: () => import('../pages/ProductReportPage.vue'), meta: { requiresAuth: true } },
  { path: '/customers', component: () => import('../pages/CustomersPage.vue'), meta: { requiresAuth: true } },
  { path: '/orders/create', component: () => import('../pages/orders/OrderCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id/edit', component: () => import('../pages/orders/OrderCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id/view', component: () => import('../pages/orders/OrderCreatePage.vue'), meta: { requiresAuth: true, readonlyOrder: true } },
  { path: '/orders/:id/tracking', component: () => import('../pages/orders/OrderTrackingPage.vue'), meta: { requiresAuth: true } },
  { path: '/products', component: () => import('../pages/products/ProductsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/products/create', component: () => import('../pages/products/ProductCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/products/:id/edit', component: () => import('../pages/products/ProductEditPage.vue'), meta: { requiresAuth: true } },
  { path: '/inventory', component: () => import('../pages/InventoryPage.vue'), meta: { requiresAuth: true } },
  { path: '/projections', component: () => import('../pages/projections/ProjectionsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/projections/create', component: () => import('../pages/projections/ProjectionCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/projections/:id', component: () => import('../pages/projections/ProjectionDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/projections/:id/edit', component: () => import('../pages/projections/ProjectionEditPage.vue'), meta: { requiresAuth: true } },
  { path: '/profit-loss-calculations', component: () => import('../pages/profit-loss/ProfitLossCalculationsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/profit-loss-calculations/create', component: () => import('../pages/profit-loss/ProfitLossCalculationCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/profit-loss-calculations/:id', component: () => import('../pages/profit-loss/ProfitLossCalculationDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/profit-loss-calculations/:id/edit', component: () => import('../pages/profit-loss/ProfitLossCalculationEditPage.vue'), meta: { requiresAuth: true } },
  { path: '/overall-profit-loss', component: () => import('../pages/profit-loss/OverallProfitLossListPage.vue'), meta: { requiresAuth: true } },
  { path: '/overall-profit-loss/create', component: () => import('../pages/profit-loss/OverallProfitLossCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/overall-profit-loss/:id', component: () => import('../pages/profit-loss/OverallProfitLossDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/overall-profit-loss/:id/edit', component: () => import('../pages/profit-loss/OverallProfitLossCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/brands', component: () => import('../pages/brands/BrandsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/brands/create', component: () => import('../pages/brands/BrandCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/brands/:id/edit', component: () => import('../pages/brands/BrandEditPage.vue'), meta: { requiresAuth: true } },
  { path: '/integrations', component: () => import('../pages/integrations/IntegrationsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/integrations/create', component: () => import('../pages/integrations/IntegrationCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/integrations/:id/edit', component: () => import('../pages/integrations/IntegrationEditPage.vue'), meta: { requiresAuth: true } },
  { path: '/leopard-pickup-addresses', component: () => import('../pages/leopard/LeopardPickupAddressesListPage.vue'), meta: { requiresAuth: true } },
  { path: '/leopard-pickup-addresses/create', component: () => import('../pages/leopard/LeopardPickupAddressCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/leopard-pickup-addresses/:id/edit', component: () => import('../pages/leopard/LeopardPickupAddressEditPage.vue'), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const impersonationToken = to.query.impersonation_token;

  if (typeof impersonationToken === 'string' && impersonationToken) {
    sessionStorage.setItem('zyro_token', impersonationToken);
    localStorage.removeItem('zyro_token');
    authStore.hydrateTokenFromStorage();

    return next({
      path: to.path === '/login' || to.path === '/' ? '/dashboard' : to.path,
      query: {},
      replace: true,
    });
  }

  if (!authStore.isAuthenticated) {
    authStore.hydrateTokenFromStorage();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  if (to.meta.requiresAuth && authStore.isAuthenticated && !authStore.user) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      return next('/login');
    }
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next(firstAccessiblePath(authStore.user));
  }

  const user = authStore.user;
  const isAdmin = isTeamAdmin(user);
  const fallbackPath = firstAccessiblePath(user);
  if (to.path.startsWith('/settings/billing') && user?.billing_enabled === false) {
    return next('/settings');
  }

  if (to.meta.adminOnly && !isAdmin) {
    return next(fallbackPath === to.path ? '/access-denied' : fallbackPath);
  }

  const requiredPermission = to.meta.requiresAuth ? permissionForPath(to.path) : null;
  if (requiredPermission && !isAdmin && !user?.team_permissions?.includes(requiredPermission)) {
    return next(fallbackPath === to.path ? '/access-denied' : fallbackPath);
  }

  next();
});

export default router;
