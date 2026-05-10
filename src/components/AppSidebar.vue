<template>
  <aside class="sidebar">
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="brand-logo">Z</div>
      <span class="brand-name">Zyro Automation</span>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.key"
        :class="['nav-item', { active: isActive(item) }]"
        @click="router.push(item.to)"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span>{{ item.label }}</span>
      </button>
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
    key: 'settings',
    label: 'Settings',
    to: '/settings',
    activePaths: ['/settings', '/brands'],
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
  padding: 20px 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
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
