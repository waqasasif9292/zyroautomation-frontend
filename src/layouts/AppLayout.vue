<template>
  <div class="app-layout">
    <header class="mobile-app-bar">
      <button
        class="mobile-menu-btn"
        type="button"
        aria-label="Open navigation"
        :aria-expanded="mobileNavOpen ? 'true' : 'false'"
        @click="mobileNavOpen = true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="mobile-title">
        <span>Zyro Automation</span>
        <strong>{{ pageTitle }}</strong>
      </div>
    </header>

    <button
      v-if="mobileNavOpen"
      class="mobile-nav-backdrop"
      type="button"
      aria-label="Close navigation"
      @click="mobileNavOpen = false"
    ></button>

    <AppSidebar :mobile-open="mobileNavOpen" @close-mobile="mobileNavOpen = false" />
    <div class="app-main">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppSidebar from '../components/AppSidebar.vue';

const route = useRoute();
const mobileNavOpen = ref(false);
const pageTitle = computed(() => {
  const first = route.path.split('/').filter(Boolean)[0] || 'dashboard';
  return first
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
});

watch(() => route.fullPath, () => {
  mobileNavOpen.value = false;
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f9fafb;
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mobile-app-bar,
.mobile-nav-backdrop {
  display: none;
}

@media (max-width: 760px) {
  .app-layout {
    display: block;
    padding-top: 58px;
  }

  .app-main {
    display: block;
  }

  .mobile-app-bar {
    position: fixed;
    z-index: 80;
    top: 0;
    left: 0;
    right: 0;
    height: 58px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #e2e8f0;
    background: rgba(255, 255, 255, 0.96);
    padding: 8px 14px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(10px);
  }

  .mobile-menu-btn {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
  }

  .mobile-menu-btn svg {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-width: 2.2;
  }

  .mobile-title {
    min-width: 0;
    display: grid;
    gap: 1px;
  }

  .mobile-title span {
    color: #64748b;
    font-size: 11px;
    font-weight: 850;
    text-transform: uppercase;
  }

  .mobile-title strong {
    overflow: hidden;
    color: #0f172a;
    font-size: 16px;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-nav-backdrop {
    position: fixed;
    z-index: 90;
    inset: 0;
    display: block;
    border: 0;
    background: rgba(15, 23, 42, 0.42);
  }
}
</style>
