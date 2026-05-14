import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../pages/LoginPage.vue'), meta: { requiresGuest: true } },
  { path: '/register', component: () => import('../pages/RegisterPage.vue'), meta: { requiresGuest: true } },
  { path: '/forgot-password', component: () => import('../pages/ForgotPasswordPage.vue'), meta: { requiresGuest: true } },
  { path: '/reset-password', component: () => import('../pages/ResetPasswordPage.vue'), meta: { requiresGuest: true } },
  { path: '/dashboard', component: () => import('../pages/DashboardPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings', component: () => import('../pages/settings/SettingsPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/security', component: () => import('../pages/settings/SecurityPage.vue'), meta: { requiresAuth: true } },
  { path: '/orders', component: () => import('../pages/OrdersPage.vue'), meta: { requiresAuth: true } },
  { path: '/customers', component: () => import('../pages/CustomersPage.vue'), meta: { requiresAuth: true } },
  { path: '/orders/create', component: () => import('../pages/orders/OrderCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id/edit', component: () => import('../pages/orders/OrderCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id/tracking', component: () => import('../pages/orders/OrderTrackingPage.vue'), meta: { requiresAuth: true } },
  { path: '/products', component: () => import('../pages/products/ProductsListPage.vue'), meta: { requiresAuth: true } },
  { path: '/products/create', component: () => import('../pages/products/ProductCreatePage.vue'), meta: { requiresAuth: true } },
  { path: '/products/:id/edit', component: () => import('../pages/products/ProductEditPage.vue'), meta: { requiresAuth: true } },
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login');
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next('/dashboard');
  }

  next();
});

export default router;
