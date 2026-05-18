<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <div v-if="showCreditBanner" class="credit-banner">
        <div>
          <strong>{{ creditBannerTitle }}</strong>
          <span>{{ creditBannerMessage }}</span>
        </div>
        <button type="button" @click="router.push('/settings/billing')">Top Up</button>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AppSidebar from '../components/AppSidebar.vue';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const creditSummary = computed(() => {
  const user = authStore.user || {};
  const total = Number(user.total_credits || 0);
  const used = Number(user.used_credits || 0);
  const remaining = Number(user.remaining_credits ?? Math.max(total - used, 0));
  const percentage = Number(user.remaining_percentage || 0);

  return {
    total,
    used,
    remaining,
    percentage,
    is_low: Boolean(user.is_low),
    is_exhausted: Boolean(user.is_exhausted),
  };
});

const showCreditBanner = computed(() => (
  creditSummary.value.is_exhausted ||
  (creditSummary.value.remaining > 0 && creditSummary.value.percentage <= 20)
));
const creditBannerTitle = computed(() => (
  creditSummary.value.is_exhausted ? 'Credits exhausted' : 'Low order credits'
));
const creditBannerMessage = computed(() => {
  const summary = creditSummary.value;
  return `${summary.remaining} of ${summary.total} order credits available. Add credits to keep orders flowing.`;
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

.credit-banner {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #f59e0b;
  background: #fffbeb;
  color: #92400e;
  padding: 10px 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.credit-banner div {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.credit-banner strong {
  color: #78350f;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.credit-banner span {
  overflow: hidden;
  color: #92400e;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credit-banner button {
  flex: 0 0 auto;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  background: #fff;
  color: #92400e;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 850;
  padding: 6px 10px;
}

.credit-banner button:hover {
  background: #fef3c7;
}

@media (max-width: 760px) {
  .credit-banner,
  .credit-banner div {
    align-items: flex-start;
    flex-direction: column;
  }

  .credit-banner span {
    white-space: normal;
  }
}
</style>
