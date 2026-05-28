<template>
  <AppLayout>
    <main class="dashboard-page">
      <section class="dashboard-head">
        <div>
          <p class="eyebrow">Operations</p>
          <h1>Dashboard</h1>
          <p class="head-subtitle">Order volume, sales, fulfillment health, and queues that need attention.</p>
        </div>
        <button class="refresh-btn" type="button" :disabled="loading" @click="fetchStats">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </section>

      <section class="hero-grid">
        <article class="metric-card primary">
          <p class="metric-label">Sales this month</p>
          <strong>{{ money(revenue.this_month) }}</strong>
          <span :class="['delta-pill', monthDelta >= 0 ? 'positive' : 'negative']">
            {{ signedPercent(monthDelta) }} vs last month
          </span>
        </article>

        <article v-for="metric in headlineMetrics" :key="metric.key" class="metric-card">
          <p class="metric-label">{{ metric.label }}</p>
          <strong>{{ metric.value }}</strong>
          <span class="metric-note">{{ metric.note }}</span>
        </article>
      </section>

      <section class="content-grid">
        <article class="panel trend-panel">
          <div class="panel-head">
            <div>
              <h2>14-day trend</h2>
              <p>Daily orders with revenue intensity.</p>
            </div>
            <span class="panel-kpi">{{ formatNumber(stats.last_7_days) }} orders in 7 days</span>
          </div>

          <div v-if="loading" class="empty-state">Loading trend...</div>
          <div v-else class="trend-chart" aria-label="Order trend">
            <div v-for="day in trend" :key="day.date" class="trend-day">
              <div class="bar-track">
                <span
                  class="bar revenue-bar"
                  :style="{ height: `${barHeight(day.revenue, maxTrendRevenue)}%` }"
                ></span>
                <span
                  class="bar order-bar"
                  :style="{ height: `${barHeight(day.orders, maxTrendOrders)}%` }"
                ></span>
              </div>
              <span class="trend-label">{{ day.label }}</span>
            </div>
          </div>

          <div class="legend-row">
            <span><i class="legend-dot orders"></i>Orders</span>
            <span><i class="legend-dot revenue"></i>Revenue</span>
          </div>
        </article>

        <article class="panel queue-panel">
          <div class="panel-head">
            <div>
              <h2>Action queues</h2>
              <p>Work waiting inside operations.</p>
            </div>
          </div>

          <div class="queue-list">
            <div v-for="queue in queueItems" :key="queue.key" class="queue-row">
              <div>
                <strong>{{ queue.label }}</strong>
                <span>{{ queue.note }}</span>
              </div>
              <b>{{ formatNumber(queue.value) }}</b>
            </div>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Status mix</h2>
              <p>Current parcel state distribution.</p>
            </div>
          </div>
          <div class="rank-list">
            <div v-for="item in statusMix" :key="item.label" class="rank-row">
              <div class="rank-meta">
                <span>{{ item.label }}</span>
                <b>{{ formatNumber(item.value) }}</b>
              </div>
              <div class="rank-track">
                <span :style="{ width: `${rankWidth(item.value, maxStatus)}%` }"></span>
              </div>
            </div>
            <div v-if="!statusMix.length && !loading" class="empty-state compact">No status data yet.</div>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Courier load</h2>
              <p>Orders assigned by courier.</p>
            </div>
          </div>
          <div class="donut-wrap">
            <div class="donut" :style="donutStyle(courierMix)"></div>
            <div class="donut-list">
              <div v-for="item in courierMix" :key="item.label" class="donut-row">
                <span :style="{ background: item.color }"></span>
                <p>{{ item.label }}</p>
                <b>{{ formatNumber(item.value) }}</b>
              </div>
              <div v-if="!courierMix.length && !loading" class="empty-state compact">No courier data yet.</div>
            </div>
          </div>
        </article>

        <article class="panel source-panel">
          <div class="panel-head">
            <div>
              <h2>Order sources</h2>
              <p>Where demand is coming from.</p>
            </div>
          </div>
          <div class="source-grid">
            <div v-for="item in sourceMix" :key="item.label" class="source-item">
              <span>{{ item.label }}</span>
              <strong>{{ formatNumber(item.value) }}</strong>
            </div>
            <div v-if="!sourceMix.length && !loading" class="empty-state compact">No source data yet.</div>
          </div>
        </article>

        <article class="panel health-panel">
          <div class="panel-head">
            <div>
              <h2>Fulfillment health</h2>
              <p>Quick read on completed versus open work.</p>
            </div>
          </div>
          <div class="health-meter">
            <div class="meter-ring" :style="{ '--value': `${performance.fulfillment_rate || 0}%` }">
              <strong>{{ formatPercent(performance.fulfillment_rate) }}</strong>
              <span>delivered</span>
            </div>
            <div class="health-stats">
              <div>
                <span>Delivered</span>
                <b>{{ formatNumber(performance.delivered_count) }}</b>
              </div>
              <div>
                <span>Open orders</span>
                <b>{{ formatNumber(performance.open_count) }}</b>
              </div>
              <div>
                <span>Confirmation backlog</span>
                <b>{{ formatPercent(performance.confirmation_backlog_rate) }}</b>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import OrderService from '../services/OrderService';

const palette = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#dc2626', '#475569', '#059669'];

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
const revenue = ref({
  today: 0,
  yesterday: 0,
  last_7_days: 0,
  this_month: 0,
  last_month: 0,
  gross: 0,
  delivery_charges: 0,
  average_order_value: 0,
});
const performance = ref({
  delivered_count: 0,
  open_count: 0,
  fulfillment_rate: 0,
  confirmation_backlog_rate: 0,
});
const queues = ref({
  hold: 0,
  pending_confirmation: 0,
  packing_pending: 0,
  returns_pending: 0,
  delivery_charge_missing: 0,
});
const charts = ref({
  order_trend: [],
  status_mix: [],
  source_mix: [],
  courier_mix: [],
});

const trend = computed(() => charts.value.order_trend || []);
const statusMix = computed(() => charts.value.status_mix || []);
const sourceMix = computed(() => charts.value.source_mix || []);
const courierMix = computed(() => (charts.value.courier_mix || []).map((item, index) => ({
  ...item,
  color: palette[index % palette.length],
})));

const maxTrendOrders = computed(() => Math.max(1, ...trend.value.map(day => Number(day.orders || 0))));
const maxTrendRevenue = computed(() => Math.max(1, ...trend.value.map(day => Number(day.revenue || 0))));
const maxStatus = computed(() => Math.max(1, ...statusMix.value.map(item => Number(item.value || 0))));
const monthDelta = computed(() => percentChange(revenue.value.this_month, revenue.value.last_month));

const headlineMetrics = computed(() => [
  {
    key: 'today',
    label: 'Orders today',
    value: formatNumber(stats.value.today),
    note: `${formatNumber(stats.value.yesterday)} yesterday`,
  },
  {
    key: 'aov',
    label: 'Average order value',
    value: money(revenue.value.average_order_value),
    note: `${money(revenue.value.gross)} lifetime sales`,
  },
  {
    key: 'open',
    label: 'Open orders',
    value: formatNumber(performance.value.open_count),
    note: `${formatPercent(performance.value.fulfillment_rate)} fulfillment rate`,
  },
  {
    key: 'charges',
    label: 'Delivery charges',
    value: money(revenue.value.delivery_charges),
    note: `${formatNumber(queues.value.delivery_charge_missing)} missing charges`,
  },
]);

const queueItems = computed(() => [
  { key: 'pending_confirmation', label: 'Pending confirmation', value: queues.value.pending_confirmation, note: 'Needs confirmation before booking' },
  { key: 'hold', label: 'On hold', value: queues.value.hold, note: 'Manual review or customer issue' },
  { key: 'packing_pending', label: 'Packing pending', value: queues.value.packing_pending, note: 'Open orders not packed yet' },
  { key: 'returns_pending', label: 'Returns pending', value: queues.value.returns_pending, note: 'Marked return, not received' },
  { key: 'delivery_charge_missing', label: 'Missing delivery charges', value: queues.value.delivery_charge_missing, note: 'Booked orders without charge sync' },
]);

const formatNumber = value => Number(value || 0).toLocaleString();
const money = value => `Rs ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const formatPercent = value => `${Number(value || 0).toFixed(1)}%`;
const signedPercent = value => `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(1)}%`;
const percentChange = (current, previous) => {
  const prev = Number(previous || 0);
  if (!prev) return Number(current || 0) > 0 ? 100 : 0;
  return ((Number(current || 0) - prev) / prev) * 100;
};
const barHeight = (value, max) => Math.max(Number(value || 0) > 0 ? 8 : 0, Math.round((Number(value || 0) / Number(max || 1)) * 100));
const rankWidth = (value, max) => Math.max(Number(value || 0) > 0 ? 4 : 0, Math.round((Number(value || 0) / Number(max || 1)) * 100));

const donutStyle = (items) => {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!total) return { background: '#e2e8f0' };

  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    cursor += (Number(item.value || 0) / total) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  });

  return { background: `conic-gradient(${stops.join(', ')})` };
};

const fetchStats = async () => {
  loading.value = true;
  try {
    const res = await OrderService.getStats();
    const data = res.data.data || {};
    stats.value = { ...stats.value, ...(data.stats || {}) };
    revenue.value = { ...revenue.value, ...(data.revenue || {}) };
    performance.value = { ...performance.value, ...(data.performance || {}) };
    queues.value = { ...queues.value, ...(data.queues || {}) };
    charts.value = { ...charts.value, ...(data.charts || {}) };
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStats);
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 28px;
  background: #f6f8fb;
}

.dashboard-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
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
  color: #0f172a;
  font-size: 26px;
  font-weight: 850;
  letter-spacing: 0;
}

.head-subtitle,
.panel-head p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.refresh-btn {
  min-width: 92px;
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

.hero-grid {
  display: grid;
  grid-template-columns: 1.35fr repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}

.metric-card,
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.metric-card {
  min-height: 126px;
  padding: 18px;
}

.metric-card.primary {
  background: #0f172a;
  border-color: #0f172a;
  color: #fff;
}

.metric-label {
  margin: 0 0 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.primary .metric-label {
  color: #cbd5e1;
}

.metric-card strong {
  display: block;
  color: #0f172a;
  font-size: 25px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: 0;
}

.metric-card.primary strong {
  color: #fff;
  font-size: 32px;
}

.metric-note,
.delta-pill {
  display: inline-flex;
  margin-top: 12px;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
}

.delta-pill {
  border-radius: 999px;
  padding: 5px 8px;
}

.delta-pill.positive {
  background: #dcfce7;
  color: #166534;
}

.delta-pill.negative {
  background: #fee2e2;
  color: #991b1b;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.95fr 1fr;
  gap: 14px;
}

.panel {
  min-width: 0;
  padding: 18px;
}

.trend-panel {
  grid-column: span 2;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0;
}

.panel-kpi {
  flex: 0 0 auto;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 850;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(14, minmax(24px, 1fr));
  align-items: end;
  gap: 9px;
  height: 236px;
  padding-top: 6px;
}

.trend-day {
  min-width: 0;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 8px;
}

.bar-track {
  position: relative;
  height: 100%;
  border-radius: 7px;
  background: #f1f5f9;
  overflow: hidden;
}

.bar {
  position: absolute;
  bottom: 0;
  width: 50%;
  min-height: 0;
  transition: height 180ms ease;
}

.revenue-bar {
  left: 0;
  background: #14b8a6;
}

.order-bar {
  right: 0;
  background: #2563eb;
}

.trend-label {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-row {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.legend-row span,
.donut-row {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.legend-dot.orders {
  background: #2563eb;
}

.legend-dot.revenue {
  background: #14b8a6;
}

.queue-list,
.rank-list,
.health-stats {
  display: grid;
  gap: 10px;
}

.queue-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.queue-row strong,
.rank-meta span {
  display: block;
  color: #1e293b;
  font-size: 13px;
  font-weight: 850;
}

.queue-row span {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
}

.queue-row b {
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
}

.rank-row {
  display: grid;
  gap: 7px;
}

.rank-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.rank-meta b {
  color: #334155;
  font-size: 12px;
}

.rank-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.rank-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}

.donut-wrap {
  display: grid;
  grid-template-columns: 132px 1fr;
  gap: 18px;
  align-items: center;
}

.donut {
  width: 132px;
  aspect-ratio: 1;
  border-radius: 999px;
  position: relative;
}

.donut::after {
  content: "";
  position: absolute;
  inset: 28px;
  border-radius: inherit;
  background: #fff;
}

.donut-list {
  display: grid;
  gap: 9px;
  min-width: 0;
}

.donut-row {
  justify-content: space-between;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.donut-row span {
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  border-radius: 999px;
}

.donut-row p {
  min-width: 0;
  flex: 1;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.donut-row b {
  color: #0f172a;
}

.source-panel {
  grid-column: span 1;
}

.source-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.source-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 13px;
}

.source-item span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.source-item strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.health-panel {
  grid-column: span 2;
}

.health-meter {
  display: grid;
  grid-template-columns: 170px 1fr;
  gap: 20px;
  align-items: center;
}

.meter-ring {
  width: 168px;
  aspect-ratio: 1;
  border-radius: 999px;
  display: grid;
  place-items: center;
  align-content: center;
  background: conic-gradient(#0f766e var(--value), #e2e8f0 0);
  position: relative;
}

.meter-ring::after {
  content: "";
  position: absolute;
  inset: 18px;
  border-radius: inherit;
  background: #fff;
}

.meter-ring strong,
.meter-ring span {
  position: relative;
  z-index: 1;
}

.meter-ring strong {
  color: #0f172a;
  font-size: 28px;
  font-weight: 950;
}

.meter-ring span {
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
}

.health-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.health-stats div {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}

.health-stats span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.health-stats b {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.empty-state {
  display: grid;
  min-height: 180px;
  place-items: center;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.empty-state.compact {
  min-height: 72px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

@media (max-width: 1280px) {
  .hero-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trend-panel,
  .health-panel {
    grid-column: span 2;
  }
}

@media (max-width: 820px) {
  .dashboard-page {
    padding: 22px;
  }

  .dashboard-head {
    flex-direction: column;
  }

  .hero-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .trend-panel,
  .health-panel {
    grid-column: span 1;
  }

  .trend-chart {
    gap: 6px;
    overflow-x: auto;
    grid-template-columns: repeat(14, 38px);
    padding-bottom: 4px;
  }

  .donut-wrap,
  .health-meter,
  .health-stats {
    grid-template-columns: 1fr;
  }

  .donut,
  .meter-ring {
    justify-self: center;
  }
}

@media (max-width: 520px) {
  .dashboard-page {
    padding: 16px;
  }

  .panel,
  .metric-card {
    padding: 14px;
  }

  .panel-head {
    flex-direction: column;
  }

  .source-grid {
    grid-template-columns: 1fr;
  }
}
</style>
