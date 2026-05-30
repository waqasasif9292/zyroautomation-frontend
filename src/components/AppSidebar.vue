<template>
  <aside :class="['sidebar', { collapsed: isCollapsed }]">
    <!-- Brand -->
    <div class="sidebar-header">
      <button class="sidebar-brand" type="button" title="Dashboard" @click="router.push('/dashboard')">
        <div class="brand-logo">Z</div>
        <span class="brand-name">Zyro Automation</span>
      </button>
      <button
        class="sidebar-toggle"
        type="button"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-pressed="isCollapsed"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="toggleSidebar"
      >
        <svg class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div v-for="item in navItems" :key="item.key" class="nav-group">
        <button
          :class="['nav-item', { active: isActive(item) }]"
          :title="item.label"
          @click="router.push(item.to)"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </button>
        <div v-if="!isCollapsed && item.children?.length && isActive(item)" class="nav-submenu">
          <button
            v-for="child in item.children"
            :key="child.key"
            :class="['nav-subitem', { active: isChildActive(child) }]"
            :title="child.label"
            @click="router.push(child.to)"
          >
            <span class="nav-subicon" v-html="child.icon"></span>
            <span class="nav-label">{{ child.label }}</span>
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
      <button class="logout-btn" title="Logout" @click="handleLogout">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span class="nav-label">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { permissionForPath } from '../constants/sidebarPermissions';

const router    = useRouter();
const route     = useRoute();
const authStore = useAuthStore();
const sidebarStorageKey = 'zyro-sidebar-collapsed';
const isCollapsed = ref(localStorage.getItem(sidebarStorageKey) === 'true');

watch(isCollapsed, (value) => {
  localStorage.setItem(sidebarStorageKey, value ? 'true' : 'false');
});

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

const userInitial = computed(() => {
  const name = authStore.user?.name || '';
  return name.charAt(0).toUpperCase() || 'U';
});

const isActive = (item) => {
  return item.activePaths
    ? item.activePaths.some(p => route.path.startsWith(p))
    : route.path.startsWith(item.to);
};

const isChildActive = (item) => {
  return item.activePaths
    ? item.activePaths.some(p => route.path.startsWith(p))
    : route.path === item.to;
};

const handleLogout = async () => {
  await authStore.logout();
};

const isTeamAdmin = computed(() => ['admin', 'owner'].includes(authStore.user?.team_role || 'admin'));
const hasPermission = (item) => {
  const permission = permissionForPath(item.to);
  return !permission || isTeamAdmin.value || authStore.user?.team_permissions?.includes(permission);
};

const filterChildren = (children = []) => children.filter(child => {
  if (child.adminOnly && !isTeamAdmin.value) return false;
  return hasPermission(child);
});

const baseNavItems = [
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
    key: 'abandoned-orders',
    label: 'Abandoned Orders',
    to: '/abandoned-orders',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M10 15h4"/><path d="M12 13v4"/></svg>`,
  },
  {
    key: 'customers',
    label: 'Customers',
    to: '/customers',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    key: 'status-updates',
    label: 'Update Statuses',
    to: '/status-updates',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
  },
  {
    key: 'delivery-charges',
    label: 'Delivery Charges',
    to: '/delivery-charges',
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h4"/><path d="M15 12h2"/><path d="M7 16h4"/><path d="M15 16h2"/></svg>`,
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
      {
        key: 'packing-products',
        label: 'Pending Products',
        to: '/packing-logs/products',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7.5 12 3 4 7.5l8 4.5 8-4.5Z"/><path d="M4 7.5v9L12 21l8-4.5v-9"/><path d="M12 12v9"/></svg>`,
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
    key: 'reports',
    label: 'Reports',
    to: '/reports/overview',
    activePaths: ['/reports', '/cancelled', '/return-performance'],
    children: [
      {
        key: 'reports-overview',
        label: 'Overview',
        to: '/reports/overview',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 2 5-6"/></svg>`,
      },
      {
        key: 'cancel-report',
        label: 'Cancel Report',
        to: '/reports/cancel',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
      },
      {
        key: 'return-report',
        label: 'Return Report',
        to: '/reports/returns',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h13a5 5 0 0 1 0 10H8"/><path d="m8 12-5-5 5-5"/></svg>`,
      },
    ],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15v2"/><path d="M12 11v6"/><path d="M17 7v10"/></svg>`,
  },
  {
    key: 'products',
    label: 'Products',
    to: '/products',
    activePaths: ['/products', '/inventory'],
    children: [
      {
        key: 'product-products',
        label: 'Products',
        to: '/products',
        activePaths: ['/products'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4Z"/><path d="m3.3 7 8.7 5 8.7-5"/></svg>`,
      },
      {
        key: 'product-inventory',
        label: 'Inventory',
        to: '/inventory',
        activePaths: ['/inventory'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/><path d="m14 15 2 2 4-4"/></svg>`,
      },
    ],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  },
  {
    key: 'financials',
    label: 'Financials',
    to: '/projections',
    activePaths: ['/projections', '/profit-loss-calculations', '/overall-profit-loss'],
    children: [
      {
        key: 'financials-overall-profit-loss',
        label: 'Overall Profit Loss',
        to: '/overall-profit-loss',
        activePaths: ['/overall-profit-loss'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 14 3-3 3 2 5-6"/><path d="M18 7h-4"/></svg>`,
      },
      {
        key: 'financials-profit-loss',
        label: 'Product Wise Profit Loss',
        to: '/profit-loss-calculations',
        activePaths: ['/profit-loss-calculations'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      },
      {
        key: 'financials-projections',
        label: 'Projections',
        to: '/projections',
        activePaths: ['/projections'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-4 4"/><path d="M19 9h-5"/><path d="M19 9v5"/></svg>`,
      },
    ],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15h.01"/><path d="M11 15h2"/><path d="M17 9h.01"/><path d="M7 9h6"/></svg>`,
  },
  {
    key: 'vendors',
    label: 'Vendors',
    to: '/vendors',
    activePaths: ['/vendors'],
    children: [
      {
        key: 'vendors-list',
        label: 'Vendors',
        to: '/vendors',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>`,
      },
      {
        key: 'vendor-invoices',
        label: 'Invoices',
        to: '/vendors/invoices',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z"/><path d="M14 2v6h6"/></svg>`,
      },
      {
        key: 'vendor-bilties',
        label: 'Bilties',
        to: '/vendors/bilties',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 17h1V9h4l3 4v4h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
      },
      {
        key: 'vendor-receipts',
        label: 'Stock Receipts',
        to: '/vendors/stock-receipts',
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7.5 12 3 4 7.5l8 4.5 8-4.5Z"/><path d="M4 7.5v9L12 21l8-4.5v-9"/><path d="m9 14 2 2 4-5"/></svg>`,
      },
    ],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 17h1V9h4l3 4v4h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  },
  {
    key: 'settings',
    label: 'Settings',
    to: '/settings',
    activePaths: ['/settings', '/brands', '/integrations', '/leopard-pickup-addresses'],
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`,
  },
];

const navItems = computed(() => baseNavItems
  .filter(item => hasPermission(item))
  .map(item => ({ ...item, children: filterChildren(item.children) })));
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
  overflow-x: hidden;
  overflow-y: auto;
  transition: width 0.26s ease, box-shadow 0.26s ease;
  will-change: width;
}

.sidebar.collapsed {
  width: 72px;
}

/* Brand */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  padding: 4px 0 4px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
}

.sidebar-brand:hover .brand-name {
  color: #fff;
}

.sidebar-toggle {
  width: 30px;
  height: 30px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  color: #94a3b8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.26s ease;
}

.sidebar-toggle:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(148, 163, 184, 0.34);
  color: #e2e8f0;
}

.toggle-icon {
  transition: transform 0.26s ease;
}

.sidebar.collapsed .toggle-icon {
  transform: rotate(180deg);
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
  transition: opacity 0.18s ease, transform 0.24s ease, width 0.24s ease;
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
  overflow: hidden;
  transition: background 0.15s, color 0.15s, padding 0.26s ease, gap 0.26s ease;
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
  overflow: hidden;
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
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.18s ease, transform 0.24s ease, width 0.24s ease;
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
  transition: opacity 0.18s ease, transform 0.24s ease, width 0.24s ease;
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
  overflow: hidden;
  transition: background 0.15s, color 0.15s, padding 0.26s ease, gap 0.26s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
}

.sidebar.collapsed .sidebar-header {
  align-items: center;
  flex-direction: column;
  padding: 16px 10px 12px;
}

.sidebar.collapsed .sidebar-brand {
  flex: 0 0 auto;
  justify-content: center;
  padding: 0;
  width: 40px;
}

.sidebar.collapsed .sidebar-toggle {
  width: 40px;
  height: 40px;
}

.sidebar.collapsed .brand-name,
.sidebar.collapsed .nav-label,
.sidebar.collapsed .user-info {
  width: 0;
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
}

.sidebar.collapsed .sidebar-nav {
  align-items: center;
  padding: 16px 10px;
}

.sidebar.collapsed .nav-group {
  display: flex;
  justify-content: center;
  width: 100%;
}

.sidebar.collapsed .nav-item,
.sidebar.collapsed .logout-btn {
  width: 40px;
  height: 40px;
  justify-content: center;
  gap: 0;
  padding: 0;
}

.sidebar.collapsed .nav-icon {
  width: 20px;
  height: 20px;
}

.sidebar.collapsed .user-row {
  justify-content: center;
  padding: 5px 0;
}

.sidebar.collapsed .sidebar-footer {
  align-items: center;
  padding: 12px 10px 16px;
}

.sidebar.collapsed .logout-btn svg {
  flex: 0 0 auto;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-toggle,
  .toggle-icon,
  .brand-name,
  .nav-label,
  .user-info,
  .nav-item,
  .logout-btn {
    transition: none;
  }
}
</style>
