import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../pages/LoginPage.vue'), meta: { requiresGuest: true } },
  { path: '/register', component: () => import('../pages/RegisterPage.vue'), meta: { requiresGuest: true } },
  { path: '/forgot-password', component: () => import('../pages/ForgotPasswordPage.vue'), meta: { requiresGuest: true } },
  { path: '/reset-password', component: () => import('../pages/ResetPasswordPage.vue'), meta: { requiresGuest: true } },
  { path: '/dashboard', component: () => import('../pages/DashboardPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings/security', component: () => import('../pages/settings/SecurityPage.vue'), meta: { requiresAuth: true } },
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
