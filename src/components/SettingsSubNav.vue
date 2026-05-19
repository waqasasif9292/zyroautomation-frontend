<template>
  <aside class="settings-sidebar">
    <nav class="sidebar-nav">
      <template v-for="item in navItems" :key="item.key">
        <button
          :class="['nav-item', { active: effectiveActive === item.key || childKeys(item).includes(effectiveActive) }]"
          @click="handleClick(item)"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          {{ item.label }}
        </button>
        <div v-if="item.children" class="nav-children">
          <button
            v-for="child in item.children"
            :key="child.key"
            :class="['nav-item nav-child', { active: effectiveActive === child.key }]"
            @click="handleClick(child)"
          >
            {{ child.label }}
          </button>
        </div>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  activeKey: { type: String, default: '' },
});

const emit = defineEmits(['change']);

const route  = useRoute();
const router = useRouter();

const effectiveActive = computed(() => {
  if (props.activeKey) return props.activeKey;
  if (route.path.startsWith('/integrations')) return 'integrations';
  if (route.path.startsWith('/leopard-pickup-addresses')) return 'leopard';
  if (route.path.startsWith('/brands')) return 'brands';
  if (route.path.startsWith('/settings/whatsapp')) return 'whatsapp';
  if (route.path.startsWith('/settings/billing')) return 'billing';
  if (route.path.startsWith('/settings/security')) return 'security';
  return 'profile';
});

const childKeys = (item) => item.children?.map(child => child.key) ?? [];

const handleClick = (item) => {
  if (item.to) {
    router.push(item.to);
  } else if (route.path === '/settings') {
    emit('change', item.key);
  } else {
    router.push({ path: '/settings', query: { tab: item.key } });
  }
};

const navItems = [
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
    key: 'notifications', label: 'Notifications',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  },
  {
    key: 'whatsapp', label: 'WhatsApp Automation', to: '/settings/whatsapp',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.36 7.57L3 21l1.93-5.55A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.5 8.5c.3 3.1 3 5.8 6.1 6.1l1.4-1.4-2.2-1.1-.8.8c-1.1-.5-2-1.4-2.5-2.5l.8-.8-1.1-2.2-1.7 1.1Z"/></svg>`,
  },
  {
    key: 'statuses', label: 'Courier Statuses',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><path d="M7 7h.01"/><path d="M14 8h4"/><path d="M16 6v4"/></svg>`,
  },
  {
    key: 'billing', label: 'Billing', to: '/settings/billing',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  },
  {
    key: 'team', label: 'Team',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    key: 'security', label: 'Change Password', to: '/settings/security',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
];
</script>

<style scoped>
.settings-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13.5px;
  color: #374151;
  font-weight: 500;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.nav-item.active .nav-icon {
  color: #1d4ed8;
}

.nav-icon {
  display: flex;
  align-items: center;
  color: #9ca3af;
  flex-shrink: 0;
}

.nav-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: -1px 0 4px 28px;
}

.nav-child {
  padding: 8px 10px;
  font-size: 13px;
  color: #64748b;
}
</style>
