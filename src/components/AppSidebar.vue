<template>
  <aside class="sidebar">
    <!-- Brand -->
    <button class="sidebar-brand" type="button" @click="router.push('/dashboard')">
      <div class="brand-logo">Z</div>
      <span class="brand-name">Zyro Automation</span>
    </button>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div v-for="item in navItems" :key="item.key" class="nav-group">
        <button
          :class="['nav-item', { active: isActive(item) }]"
          @click="router.push(item.to)"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </button>
        <div v-if="item.children && isActive(item)" class="nav-submenu">
          <button
            v-for="child in item.children"
            :key="child.key"
            :class="['nav-subitem', { active: isChildActive(child) }]"
            @click="router.push(child.to)"
          >
            <span class="nav-subicon" v-html="child.icon"></span>
            {{ child.label }}
          </button>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="user-row">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <span class="user-name">{{ authStore.user?.name || 'Account' }}</span>
          <span class="user-email">{{ authStore.user?.email || '' }}</span>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router    = useRouter();
const route     = useRoute();
const authStore = useAuthStore();

const userInitial = computed(() => {
  const name = authStore.user?.name || '';
  return name.charAt(0).toUpperCase() || 'U';
});

const isActive = (item) => {
  return item.activePaths
    ? item.activePaths.some(p => route.path.startsWith(p))
    : route.path.startsWith(item.to);
};

const isChildActive = (item) => route.path === item.to;

const handleLogout = async () => {
  await authStore.logout();
};

const navItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  },
  {
    key: 'orders',
    label: 'Orders',
    to: '/orders',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  },
  {
    key: 'customers',
    label: 'Customers',
    to: '/customers',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    key: 'packing-logs',
    label: 'Packing Logs',
    to: '/packing-logs/pending',
    activePaths: ['/packing-logs'],
    children: [
      {
        key: 'packing-pending',
        label: 'Pending',
        to: '/packing-logs/pending',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
      },
      {
        key: 'packing-packed',
        label: 'Packed',
        to: '/packing-logs/packed',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
      },
    ],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7.5 12 3 4 7.5l8 4.5 8-4.5Z"/><path d="M4 7.5v9L12 21l8-4.5v-9"/><path d="M12 12v9"/><path d="m8 5.25 8 4.5"/></svg>`,
  },
  {
    key: 'returns',
    label: 'Return Management',
    to: '/returns/pending',
    activePaths: ['/returns'],
    children: [
      {
        key: 'returns-pending',
        label: 'Return Pending',
        to: '/returns/pending',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h13a5 5 0 0 1 0 10H8"/><path d="m8 12-5-5 5-5"/></svg>`,
      },
      {
        key: 'returns-received',
        label: 'Return Received',
        to: '/returns/received',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
      },
    ],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h13a5 5 0 0 1 0 10H8"/><path d="m8 12-5-5 5-5"/><path d="M21 17v4h-4"/></svg>`,
  },
  {
    key: 'postex-webhooks',
    label: 'PostEx Webhooks',
    to: '/postex-webhooks',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`,
  },
  {
    key: 'products',
    label: 'Products',
    to: '/products',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  },
  {
    key: 'projections',
    label: 'Projections',
    to: '/projections',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-4 4"/><path d="M19 9h-5"/><path d="M19 9v5"/></svg>`,
  },
  {
    key: 'settings',
    label: 'Settings',
    to: '/settings',
    activePaths: ['/settings', '/brands', '/integrations'],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`,
  },
];
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 20px 18px 16px;
  border: none;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.sidebar-brand:hover .brand-name {
  color: #fff;
}

.brand-logo {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.brand-name {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13.5px;
  color: #94a3b8;
  font-weight: 500;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: #e2e8f0;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.18);
  color: #93c5fd;
}

.nav-item.active .nav-icon {
  color: #93c5fd;
}

.nav-submenu {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 5px 0 7px 21px;
  padding: 4px 0 4px 12px;
}

.nav-submenu::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.24);
}

.nav-subitem {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 700;
  padding: 8px 10px;
  text-align: left;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.nav-subitem:hover {
  background: rgba(255,255,255,0.06);
  color: #e2e8f0;
}

.nav-subitem.active {
  background: rgba(59, 130, 246, 0.2);
  color: #dbeafe;
  box-shadow: inset 2px 0 0 #60a5fa;
}

.nav-subitem.active .nav-subicon {
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
}

.nav-subicon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  border-radius: 7px;
  color: #7dd3fc;
  background: rgba(15, 23, 42, 0.42);
}

.nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Footer */
.sidebar-footer {
  padding: 12px 10px 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  background: #334155;
  color: #cbd5e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  font-size: 12.5px;
  font-weight: 500;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13.5px;
  color: #94a3b8;
  font-weight: 500;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}
</style>
