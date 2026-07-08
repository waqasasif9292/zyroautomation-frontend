<template>
  <aside class="settings-sidebar">
    <nav class="sidebar-nav">
      <template v-for="item in navItems" :key="item.key">
        <a
          :class="['nav-item', { active: effectiveActive === item.key || childKeys(item).includes(effectiveActive) }]"
          :href="itemHref(item)"
          @click="handleClick($event, item)"
          @mousedown="authStore.prepareTabHandoff"
          @auxclick="authStore.prepareTabHandoff"
          @contextmenu="authStore.prepareTabHandoff"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          {{ item.label }}
        </a>
        <div v-if="item.children && (effectiveActive === item.key || childKeys(item).includes(effectiveActive))" class="nav-children">
          <a
            v-for="child in item.children"
            :key="child.key"
            :class="['nav-item nav-child', { active: effectiveActive === child.key }]"
            :href="itemHref(child)"
            @click="handleClick($event, child)"
            @mousedown="authStore.prepareTabHandoff"
            @auxclick="authStore.prepareTabHandoff"
            @contextmenu="authStore.prepareTabHandoff"
          >
            {{ child.label }}
          </a>
        </div>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { permissionForPath } from '../constants/sidebarPermissions';

const props = defineProps({
  activeKey: { type: String, default: '' },
});

const emit = defineEmits(['change']);

const route  = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isTeamAdmin = computed(() => ['admin', 'owner'].includes(authStore.user?.team_role || 'admin'));
const billingEnabled = computed(() => authStore.user?.billing_enabled !== false);
const hasPermission = (item) => {
  if (item.key === 'billing' && !billingEnabled.value) return false;
  const permission = item.permission || (item.to ? permissionForPath(item.to) : null);
  return !permission || isTeamAdmin.value || authStore.user?.team_permissions?.includes(permission);
};

const effectiveActive = computed(() => {
  if (props.activeKey) return props.activeKey;
  if (route.path.startsWith('/integrations')) return 'integrations';
  if (route.path.startsWith('/leopard-pickup-addresses')) return 'leopard';
  if (route.path.startsWith('/brands')) return 'brands';
  if (route.path.startsWith('/settings/statuses')) return 'statuses';
  if (route.path.startsWith('/settings/billing')) return 'billing';
  if (route.path.startsWith('/settings/activity-logs')) return 'activity-logs';
  if (route.path.startsWith('/settings/security')) return 'security';
  if (route.path.startsWith('/settings/team-members')) return 'team';
  return 'profile';
});

const childKeys = (item) => item.children?.map(child => child.key) ?? [];

const itemTarget = (item) => {
  if (item.to) return item.to;
  return item.key === 'profile'
    ? '/settings'
    : { path: '/settings', query: { tab: item.key } };
};

const itemHref = (item) => router.resolve(itemTarget(item)).href;

const handleClick = (event, item) => {
  authStore.prepareTabHandoff();

  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();

  if (item.to) {
    router.push(item.to);
  } else if (route.path === '/settings') {
    emit('change', item.key);
  } else {
    router.push({ path: '/settings', query: { tab: item.key } });
  }
};

const baseNavItems = [
  {
    key: 'profile', label: 'Profile',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  },
  {
    key: 'brands', label: 'Brands', to: '/brands',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  },
  {
    key: 'integrations', label: 'Integrations', to: '/integrations',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>`,
    children: [
      { key: 'integrations', label: 'Courier Integration', to: '/integrations' },
      { key: 'leopard', label: 'Leopard Pickup Addresses', to: '/leopard-pickup-addresses' },
    ],
  },
  {
    key: 'statuses', label: 'Courier Statuses',
    to: '/settings/statuses',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><path d="M7 7h.01"/><path d="M14 8h4"/><path d="M16 6v4"/></svg>`,
  },
  {
    key: 'billing', label: 'Billing', to: '/settings/billing',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  },
  {
    key: 'activity-logs', label: 'Activity Logs', to: '/settings/activity-logs',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l3-3 3 2 5-6"/><path d="M7 8h.01"/><path d="M7 12h.01"/></svg>`,
  },
  {
    key: 'team', label: 'Team', to: '/settings/team-members',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    key: 'security', label: 'Change Password', to: '/settings/security',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
];

const navItems = computed(() => baseNavItems
  .filter(item => (!item.adminOnly || isTeamAdmin.value) && hasPermission(item))
  .map(item => ({
    ...item,
    children: (item.children || []).filter(child => hasPermission(child)),
  })));
</script>

<style scoped>
.settings-sidebar {
  width: 232px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
  align-self: flex-start;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  padding: 10px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: transparent;
  cursor: pointer;
  font-size: 13.5px;
  color: #334155;
  font-weight: 700;
  text-decoration: none;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #f8fafc;
  color: #0f172a;
}

.nav-item.active {
  background: #eef5ff;
  color: #1d4ed8;
  box-shadow: inset 3px 0 0 #2563eb;
}

.nav-item.active .nav-icon {
  color: #1d4ed8;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  color: #94a3b8;
  flex-shrink: 0;
}

.nav-children {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 2px 0 5px 18px;
  padding-left: 16px;
}

.nav-children::before {
  content: "";
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: 1px;
  border-radius: 999px;
  background: #dbe4ef;
}

.nav-child {
  min-height: 34px;
  padding: 7px 10px;
  font-size: 13px;
  color: #52637a;
  font-weight: 700;
}

.nav-child.active {
  box-shadow: none;
}
</style>
