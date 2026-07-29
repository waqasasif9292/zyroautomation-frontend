<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="error" class="toast error">{{ error }}</div>
    </transition>

    <div class="page-body">
      <SettingsSubNav />
      <main class="page-content">
        <section class="content-panel">
          <header class="panel-header">
            <div>
              <h2 class="panel-title">Activity Logs</h2>
              <p class="panel-subtitle">Track label generation activity by team member.</p>
            </div>
          </header>

          <div class="panel-body">
            <div class="table-wrap">
              <table class="activity-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>{{ labels.today }}</th>
                    <th>{{ labels.yesterday }}</th>
                    <th>{{ labels.last7 }}</th>
                    <th>{{ labels.thisMonth }}</th>
                    <th>{{ labels.lastMonth }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading" v-for="row in 5" :key="row">
                    <td colspan="6"><span class="skeleton"></span></td>
                  </tr>
                  <tr v-else-if="rows.length === 0">
                    <td colspan="6" class="empty-cell">No team members found.</td>
                  </tr>
                  <tr v-else v-for="row in rows" :key="row.user_id">
                    <td><strong>{{ row.name }}</strong></td>
                    <td>
                      <button type="button" class="count-link" @click="openOrders(row, activity.today, activity.today)">
                        {{ number(row.today) }}
                      </button>
                    </td>
                    <td>
                      <button type="button" class="count-link" @click="openOrders(row, activity.yesterday, activity.yesterday)">
                        {{ number(row.yesterday) }}
                      </button>
                    </td>
                    <td>
                      <button type="button" class="count-link" @click="openOrders(row, activity.last_7_start_date, activity.last_7_end_date)">
                        {{ number(row.last_7_days) }}
                      </button>
                    </td>
                    <td>
                      <button type="button" class="count-link" @click="openOrders(row, monthStart(activity.this_month), monthEnd(activity.this_month))">
                        {{ monthWithReturnRate(row.this_month, row.this_month_return_rate) }}
                      </button>
                    </td>
                    <td>
                      <button type="button" class="count-link" @click="openOrders(row, monthStart(activity.last_month), monthEnd(activity.last_month))">
                        {{ monthWithReturnRate(row.last_month, row.last_month_return_rate) }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import SettingsService from '../../services/SettingsService';
import { useAuthStore } from '../../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');
const activity = ref({
  today: '',
  yesterday: '',
  last_7_start_date: '',
  last_7_end_date: '',
  this_month: '',
  last_month: '',
  rows: [],
  totals: {
    today: 0,
    yesterday: 0,
    last_7_days: 0,
    this_month: 0,
    this_month_returns: 0,
    this_month_return_rate: 0,
    last_month: 0,
    last_month_returns: 0,
    last_month_return_rate: 0,
  },
});

const rows = computed(() => activity.value.rows || []);

const formatMonth = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(`${value}-01T00:00:00`));
};

const labels = computed(() => ({
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 Days',
  thisMonth: 'This Month',
  lastMonth: `Last Month (${formatMonth(activity.value.last_month)})`,
}));

const number = (value) => Number(value || 0).toLocaleString();
const percent = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
const monthWithReturnRate = (orders, returnRate) => `${number(orders)} (${percent(returnRate)}% return)`;
const monthStart = (value) => value ? `${value}-01` : null;
const monthEnd = (value) => {
  if (!value) return null;
  const [year, month] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
};

const openOrders = (row, from, to) => {
  if (!row.user_id || !from || !to) return;

  authStore.prepareTabHandoff();
  const target = router.resolve({
    path: '/orders',
    query: {
      label_generated_by_user_id: row.user_id,
      label_date_from: from,
      label_date_to: to,
    },
  });
  window.open(target.href, '_blank', 'noopener');
};

const fetchLogs = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await SettingsService.fetchActivityLogs();
    activity.value = res.data.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Unable to load activity logs.';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchLogs);
</script>

<style scoped>
.page-body {
  display: flex;
  flex: 1;
  width: 100%;
  margin: 28px 0;
  padding: 0 28px;
  gap: 24px;
  align-items: flex-start;
}

.page-content { flex: 1; min-width: 0; }

.content-panel {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-title { margin: 0; color: #111827; font-size: 20px; font-weight: 800; }
.panel-subtitle { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.panel-body { padding: 24px 28px 28px; }

.table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
.activity-table { width: 100%; min-width: 920px; border-collapse: collapse; }
.activity-table th, .activity-table td { padding: 13px 16px; border-bottom: 1px solid #e2e8f0; text-align: left; }
.activity-table th { background: #f8fafc; color: #475569; font-size: 12px; font-weight: 800; }
.activity-table td { color: #334155; font-size: 14px; }
.activity-table tr:last-child td { border-bottom: none; }
.count-link {
  border: 0;
  background: transparent;
  color: #17345c;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
.count-link:hover { color: #2563eb; text-decoration: underline; }
.count-link:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; border-radius: 3px; }
.empty-cell { color: #94a3b8; text-align: center; }
.skeleton { display: block; width: 100%; height: 18px; border-radius: 6px; background: linear-gradient(90deg, #eef2f7, #f8fafc, #eef2f7); background-size: 200% 100%; animation: shimmer 1.1s infinite; }
.toast { position: fixed; right: 22px; top: 18px; z-index: 80; padding: 12px 14px; border-radius: 8px; background: #991b1b; color: #fff; font-size: 13px; font-weight: 800; }

@keyframes shimmer { to { background-position: -200% 0; } }

@media (max-width: 860px) {
  .page-body { flex-direction: column; padding: 0 16px; }
  .panel-header { align-items: flex-start; flex-direction: column; }
}
</style>
