<template>
  <AppLayout>
    <main class="dashboard-page">
      <section class="dashboard-head">
        <div>
          <p class="eyebrow">Operations</p>
          <h1>Dashboard</h1>
        </div>
        <button class="refresh-btn" type="button" :disabled="loading" @click="fetchStats">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </section>

      <section class="stats-grid">
        <article v-for="card in cards" :key="card.key" class="stat-card">
          <div>
            <p class="stat-label">{{ card.label }}</p>
            <strong>{{ loading ? '—' : formatNumber(card.value) }}</strong>
          </div>
          <span :class="['stat-icon', card.tone]">
            <svg v-if="card.icon === 'calendar'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18" />
            </svg>
            <svg v-else-if="card.icon === 'clock'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <svg v-else-if="card.icon === 'box'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21 8-9-5-9 5 9 5 9-5Z" />
              <path d="M3 8v8l9 5 9-5V8" />
              <path d="M12 13v8" />
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4v16h16" />
              <path d="M7 15l4-4 3 3 5-7" />
            </svg>
          </span>
        </article>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import OrderService from '../services/OrderService';

const loading = ref(false);
const stats = ref({
  today: 0,
  yesterday: 0,
  last_7_days: 0,
  this_month: 0,
  last_month: 0,
  total: 0,
  hold: 0,
  pending_confirmation: 0,
});

const cardConfig = [
  { key: 'today', label: 'Today', tone: 'tone-red', icon: 'calendar' },
  { key: 'yesterday', label: 'Yesterday', tone: 'tone-rose', icon: 'clock' },
  { key: 'last_7_days', label: 'Last 7 Days', tone: 'tone-orange', icon: 'chart' },
  { key: 'this_month', label: 'This Month', tone: 'tone-amber', icon: 'chart' },
  { key: 'last_month', label: 'Last Month', tone: 'tone-teal', icon: 'chart' },
  { key: 'total', label: 'Total', tone: 'tone-slate', icon: 'box' },
  { key: 'hold', label: 'Total On Hold', tone: 'tone-indigo', icon: 'clock' },
  { key: 'pending_confirmation', label: 'Pending Confirmation', tone: 'tone-blue', icon: 'calendar' },
];

const cards = computed(() => cardConfig.map(card => ({
  ...card,
  value: stats.value[card.key] || 0,
})));

const formatNumber = value => Number(value || 0).toLocaleString();

const fetchStats = async () => {
  loading.value = true;
  try {
    const res = await OrderService.getStats();
    stats.value = { ...stats.value, ...res.data.data.stats };
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStats);
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.14), transparent 28%),
    #f1f5f9;
}

.dashboard-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.dashboard-head h1 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 850;
}

.refresh-btn {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  padding: 9px 13px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 106px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  padding: 22px 24px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
}

.stat-card::after {
  content: "";
  position: absolute;
  inset: auto -22px -30px auto;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.9);
}

.stat-label {
  margin: 0 0 7px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.35;
  text-transform: uppercase;
}

.stat-card strong {
  color: #172554;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0;
}

.stat-icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  flex: 0 0 auto;
  border-radius: 999px;
  color: #fff;
}

.tone-red { background: #ef4444; }
.tone-rose { background: #f43f5e; }
.tone-orange { background: #f97316; }
.tone-amber { background: #f59e0b; }
.tone-teal { background: #14b8a6; }
.tone-slate { background: #334155; }
.tone-indigo { background: #4f46e5; }
.tone-blue { background: #2563eb; }

@media (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .dashboard-page {
    padding: 22px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .dashboard-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
