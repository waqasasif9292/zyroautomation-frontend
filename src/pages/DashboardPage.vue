<template>
  <AppLayout>
    <main class="dashboard-page">
      <section class="dashboard-head">
        <div>
          <p class="eyebrow">Operations</p>
          <h1>Dashboard</h1>
          <p class="head-subtitle">Clear operating numbers for orders, cash exposure, courier flow, returns, and queues.</p>
        </div>
        <div class="head-actions">
          <span v-if="dashboard.generated_at" class="generated-at">{{ formatDateTime(dashboard.generated_at) }}</span>
          <button class="refresh-btn" type="button" :disabled="loading" @click="fetchStats">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </section>

      <section class="kpi-grid">
        <article v-for="metric in kpiCards" :key="metric.key" :class="['kpi-card', metric.tone]">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.note }}</small>
        </article>
      </section>

      <section class="dashboard-grid top">
        <article class="panel trend-panel">
          <div class="panel-head">
            <div>
              <h2>14-Day Movement</h2>
              <p>Orders, sales, delivered, returned, and cancelled by day.</p>
            </div>
            <span class="panel-kpi">{{ formatNumber(stats.last_7_days) }} orders in 7 days</span>
          </div>

          <div v-if="loading" class="empty-state">Loading trend...</div>
          <div v-else class="trend-chart" aria-label="14 day order movement">
            <div
              v-for="day in trend"
              :key="day.date"
              class="trend-day"
              tabindex="0"
              :aria-label="`${day.label}: ${formatNumber(day.orders)} orders, ${money(day.revenue)} sales, ${formatNumber(day.delivered)} delivered, ${formatNumber(day.returned)} returned, ${formatNumber(day.cancelled)} cancelled`"
              :title="`${day.label}: ${formatNumber(day.orders)} orders, ${money(day.revenue)} sales`"
            >
              <div class="bar-track">
                <span class="bar revenue-bar" :style="{ height: `${barHeight(day.revenue, maxTrendRevenue)}%` }"></span>
                <span class="bar order-bar" :style="{ height: `${barHeight(day.orders, maxTrendOrders)}%` }"></span>
              </div>
              <div class="trend-tooltip">
                <strong>{{ day.label }}</strong>
                <span>{{ formatNumber(day.orders) }} orders</span>
                <span>{{ money(day.revenue) }} sales</span>
                <span>{{ formatNumber(day.delivered) }} delivered</span>
                <span>{{ formatNumber(day.returned) }} returned · {{ formatNumber(day.cancelled) }} cancelled</span>
              </div>
              <div class="trend-values">
                <b>{{ formatNumber(day.orders) }}</b>
                <span>{{ compactMoney(day.revenue) }}</span>
              </div>
              <span class="trend-label">{{ day.label }}</span>
            </div>
          </div>

          <div class="legend-row">
            <span><i class="legend-dot orders"></i>Orders</span>
            <span><i class="legend-dot revenue"></i>Sales</span>
          </div>
        </article>

        <article class="panel queue-panel">
          <div class="panel-head">
            <div>
              <h2>Action Queues</h2>
              <p>Work that should be handled next.</p>
            </div>
          </div>

          <div class="queue-list">
            <button
              v-for="queue in actionQueues"
              :key="queue.key"
              class="queue-row"
              type="button"
              @click="goTo(queue)"
            >
              <div>
                <strong>{{ queue.label }}</strong>
                <span>{{ queue.note }}</span>
              </div>
              <b>{{ formatNumber(queue.value) }}</b>
            </button>
          </div>
        </article>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Order Flow</h2>
            <p>Main category funnel with order count, COD, and share of total orders.</p>
          </div>
          <button class="text-btn" type="button" @click="router.push('/reports/overview')">Owner Overview</button>
        </div>
        <div class="flow-grid">
          <div v-for="step in orderFlow" :key="step.key" class="flow-step">
            <div class="flow-top">
              <span>{{ step.label }}</span>
              <strong>{{ formatNumber(step.orders) }}</strong>
            </div>
            <div class="flow-track">
              <span :style="{ width: `${barWidth(step.orders, maxFlowOrders)}%`, background: statusColor(step.key) }"></span>
            </div>
            <div class="flow-meta">
              <span>{{ money(step.cod) }}</span>
              <b>{{ formatPercent(step.percentage) }}</b>
            </div>
          </div>
        </div>
      </section>

      <section class="dashboard-grid">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Courier Exposure</h2>
              <p>Where parcels and COD are currently concentrated.</p>
            </div>
            <button class="text-btn" type="button" @click="router.push('/reports/in-progress')">In Progress</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Active</th>
                  <th>COD</th>
                  <th>Delivered</th>
                  <th>Returned</th>
                  <th>Return %</th>
                  <th>Missing DC</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in courierExposure" :key="row.courier_id">
                  <td>{{ row.courier_name }}</td>
                  <td>{{ formatNumber(row.active) }}</td>
                  <td>{{ money(row.active_cod) }}</td>
                  <td>{{ formatNumber(row.delivered) }}</td>
                  <td>{{ formatNumber(row.returned) }}</td>
                  <td>{{ formatPercent(row.return_rate) }}</td>
                  <td>{{ formatNumber(row.missing_delivery_charges) }}</td>
                </tr>
                <tr v-if="!courierExposure.length">
                  <td colspan="7">No courier data yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Status Categories</h2>
              <p>Current parcel distribution by main category.</p>
            </div>
          </div>
          <div class="rank-list">
            <div v-for="item in statusCategories" :key="item.key" class="rank-row">
              <div class="rank-meta">
                <span><i :style="{ background: statusColor(item.key) }"></i>{{ item.label }}</span>
                <b>{{ formatNumber(item.orders) }} · {{ money(item.cod) }}</b>
              </div>
              <div class="rank-track">
                <span :style="{ width: `${barWidth(item.orders, maxStatusOrders)}%`, background: statusColor(item.key) }"></span>
              </div>
              <small>{{ formatPercent(item.percentage) }} of total orders</small>
            </div>
            <div v-if="!statusCategories.length && !loading" class="empty-state compact">No status data yet.</div>
          </div>
        </article>
      </section>

      <section class="dashboard-grid bottom">
        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Product Risk</h2>
              <p>Products carrying return, cancel, and active COD exposure.</p>
            </div>
            <button class="text-btn" type="button" @click="router.push('/reports/products')">Product Report</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Active</th>
                  <th>Return Risk</th>
                  <th>Returned</th>
                  <th>Cancelled</th>
                  <th>COD</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in productRisk" :key="row.key">
                  <td>
                    <strong class="cell-title">{{ row.product_name }}</strong>
                    <small>{{ row.sku || 'No SKU' }}</small>
                  </td>
                  <td>{{ formatNumber(row.active) }}</td>
                  <td>{{ formatNumber(row.ready_for_return) }}</td>
                  <td>{{ formatNumber(row.returned) }}</td>
                  <td>{{ formatNumber(row.cancelled) }}</td>
                  <td>{{ money(row.cod) }}</td>
                </tr>
                <tr v-if="!productRisk.length">
                  <td colspan="6">No product risk data yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="panel">
          <div class="panel-head">
            <div>
              <h2>Source Quality</h2>
              <p>Sales channel performance and risk.</p>
            </div>
          </div>
          <div class="source-list">
            <div v-for="row in sourceBreakdown.slice(0, 6)" :key="row.source" class="source-row">
              <div>
                <strong>{{ row.source }}</strong>
                <span>{{ formatNumber(row.orders) }} orders · {{ money(row.sales) }}</span>
              </div>
              <div class="source-rates">
                <b>{{ formatPercent(row.delivery_rate) }}</b>
                <small>{{ formatPercent(row.return_rate) }} return</small>
              </div>
            </div>
            <div v-if="!sourceBreakdown.length" class="empty-state compact">No source data yet.</div>
          </div>
        </article>
      </section>

      <section class="system-grid">
        <article v-for="item in systemCards" :key="item.key" class="system-card" @click="item.route && router.push(item.route)">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </article>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import OrderService from '../services/OrderService';

const router = useRouter();
const loading = ref(false);
const stats = ref({});
const revenue = ref({});
const performance = ref({});
const dashboard = ref({
  kpis: {},
  queues: [],
  trend: [],
  order_flow: [],
  status_categories: [],
  courier_exposure: [],
  product_risk: [],
  source_breakdown: [],
  brand_breakdown: [],
  system_health: {},
  generated_at: null,
});

const trend = computed(() => dashboard.value.trend || []);
const actionQueues = computed(() => dashboard.value.queues || []);
const orderFlow = computed(() => dashboard.value.order_flow || []);
const statusCategories = computed(() => dashboard.value.status_categories || []);
const courierExposure = computed(() => (dashboard.value.courier_exposure || []).slice(0, 8));
const productRisk = computed(() => dashboard.value.product_risk || []);
const sourceBreakdown = computed(() => dashboard.value.source_breakdown || []);

const maxTrendOrders = computed(() => Math.max(1, ...trend.value.map(day => Number(day.orders || 0))));
const maxTrendRevenue = computed(() => Math.max(1, ...trend.value.map(day => Number(day.revenue || 0))));
const maxFlowOrders = computed(() => Math.max(1, ...orderFlow.value.map(item => Number(item.orders || 0))));
const maxStatusOrders = computed(() => Math.max(1, ...statusCategories.value.map(item => Number(item.orders || 0))));
const monthDelta = computed(() => percentChange(dashboard.value.kpis?.month_sales, dashboard.value.kpis?.last_month_sales));

const kpiCards = computed(() => {
  const kpis = dashboard.value.kpis || {};

  return [
    { key: 'today', label: 'Today Orders', value: formatNumber(kpis.today_orders), note: `${money(kpis.today_sales)} sales`, tone: 'blue' },
    { key: 'month', label: 'Month Sales', value: money(kpis.month_sales), note: `${signedPercent(monthDelta.value)} vs last month`, tone: 'dark' },
    { key: 'active', label: 'Active Orders', value: formatNumber(kpis.active_orders), note: `${money(kpis.active_cod)} active COD`, tone: 'teal' },
    { key: 'courier', label: 'Courier Exposure', value: formatNumber(kpis.courier_exposure_orders), note: `${money(kpis.courier_exposure_cod)} COD`, tone: 'indigo' },
    { key: 'return-risk', label: 'Return Risk', value: formatNumber(kpis.return_risk_orders), note: `${money(kpis.return_risk_cod)} COD`, tone: 'amber' },
    { key: 'health', label: 'Delivery Health', value: formatPercent(kpis.delivery_rate), note: `${formatPercent(kpis.return_rate)} return · ${formatPercent(kpis.cancel_rate)} cancel`, tone: 'green' },
  ];
});

const systemCards = computed(() => {
  const health = dashboard.value.system_health || {};
  const credits = health.credits || {};

  return [
    { key: 'credits', label: 'Credits', value: credits.billing_enabled ? formatNumber(credits.remaining_credits) : 'Free', note: credits.is_low ? 'Low balance' : 'Account balance', route: '/settings/billing' },
    { key: 'blocked', label: 'Blocked Orders', value: formatNumber(health.blocked_orders), note: 'Needs credit recovery', route: '/settings/billing' },
    { key: 'integrations', label: 'Couriers Connected', value: formatNumber(health.courier_integrations), note: 'Active integrations', route: '/integrations' },
    { key: 'low-stock', label: 'Low Stock', value: formatNumber(health.low_stock_products), note: 'Products below threshold', route: '/inventory' },
    { key: 'missing-tracking', label: 'Missing Tracking', value: formatNumber(health.orders_missing_tracking), note: 'Booked flow without tracking', route: '/orders' },
    { key: 'missing-dc', label: 'Missing Charges', value: formatNumber(health.missing_delivery_charges), note: 'Delivery charge sync needed', route: '/delivery-charges' },
  ];
});

const statusPalette = {
  hold: '#64748b',
  pending_confirmation: '#475569',
  duplicate: '#9333ea',
  error: '#b91c1c',
  merchant_warehouse: '#2563eb',
  dispatched: '#0f766e',
  out_for_delivery: '#7c3aed',
  delivered: '#16a34a',
  ready_for_return: '#d97706',
  out_for_return: '#ea580c',
  returned_to_shipper: '#dc2626',
  cancel_by_shipper: '#991b1b',
  other: '#94a3b8',
};

const statusColor = key => statusPalette[key] || '#94a3b8';
const formatNumber = value => Number(value || 0).toLocaleString();
const money = value => `Rs ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const compactMoney = value => `Rs ${Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))}`;
const formatPercent = value => `${Number(value || 0).toFixed(1)}%`;
const signedPercent = value => `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(1)}%`;
const percentChange = (current, previous) => {
  const prev = Number(previous || 0);
  if (!prev) return Number(current || 0) > 0 ? 100 : 0;
  return ((Number(current || 0) - prev) / prev) * 100;
};
const barHeight = (value, max) => Math.max(Number(value || 0) > 0 ? 8 : 0, Math.round((Number(value || 0) / Number(max || 1)) * 100));
const barWidth = (value, max) => Math.max(Number(value || 0) > 0 ? 4 : 0, Math.round((Number(value || 0) / Number(max || 1)) * 100));
const formatDateTime = value => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

const goTo = (queue) => {
  if (!queue?.route) return;
  router.push({ path: queue.route, query: queue.query || {} });
};

const fetchStats = async () => {
  loading.value = true;
  try {
    const res = await OrderService.getStats();
    const data = res.data.data || {};
    stats.value = data.stats || {};
    revenue.value = data.revenue || {};
    performance.value = data.performance || {};
    dashboard.value = { ...dashboard.value, ...(data.dashboard || {}) };
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
  background: #f1f5f9;
}

.dashboard-head,
.head-actions,
.panel-head,
.flow-top,
.flow-meta,
.rank-meta,
.source-row,
.queue-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dashboard-head {
  margin-bottom: 18px;
}

.head-actions {
  align-items: center;
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
  color: #1e293b;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 0;
}

.head-subtitle,
.panel-head p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.generated-at,
.panel-kpi {
  flex: 0 0 auto;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 850;
}

.refresh-btn,
.text-btn {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  padding: 9px 13px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.text-btn {
  padding: 7px 10px;
}

.refresh-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.kpi-grid,
.system-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.kpi-card,
.system-card,
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.kpi-card,
.system-card {
  min-width: 0;
  padding: 16px;
}

.kpi-card.dark {
  border-color: #1e293b;
  background: #1e293b;
  color: #fff;
}

.kpi-card span,
.system-card span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.kpi-card.dark span,
.kpi-card.dark small {
  color: #cbd5e1;
}

.kpi-card strong,
.system-card strong {
  display: block;
  margin-top: 8px;
  color: #1e293b;
  font-size: 24px;
  font-weight: 950;
  line-height: 1.1;
}

.kpi-card.dark strong {
  color: #fff;
}

.kpi-card small,
.system-card small {
  display: block;
  margin-top: 9px;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
}

.kpi-card.blue { border-top: 3px solid #2563eb; }
.kpi-card.teal { border-top: 3px solid #0f766e; }
.kpi-card.indigo { border-top: 3px solid #4f46e5; }
.kpi-card.amber { border-top: 3px solid #d97706; }
.kpi-card.green { border-top: 3px solid #16a34a; }

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
  gap: 14px;
  margin-bottom: 14px;
}

.dashboard-grid.bottom {
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
}

.panel {
  min-width: 0;
  padding: 18px;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-head h2 {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(14, minmax(32px, 1fr));
  align-items: end;
  gap: 8px;
  min-height: 252px;
  padding-top: 6px;
}

.trend-day {
  position: relative;
  min-width: 0;
  height: 100%;
  display: grid;
  grid-template-rows: minmax(150px, 1fr) auto auto;
  gap: 6px;
  border-radius: 7px;
  outline: none;
}

.trend-day:focus-visible .bar-track {
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.22);
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

.trend-tooltip {
  position: absolute;
  left: 50%;
  top: 8px;
  z-index: 3;
  display: grid;
  gap: 3px;
  min-width: 150px;
  padding: 9px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.25;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition: opacity 140ms ease, transform 140ms ease;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
}

.trend-day:first-child .trend-tooltip {
  left: 0;
  transform: translate(0, 4px);
}

.trend-day:last-child .trend-tooltip {
  right: 0;
  left: auto;
  transform: translate(0, 4px);
}

.trend-tooltip span,
.trend-tooltip strong {
  color: #fff;
}

.trend-day:hover .trend-tooltip,
.trend-day:focus-visible .trend-tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

.trend-day:first-child:hover .trend-tooltip,
.trend-day:first-child:focus-visible .trend-tooltip,
.trend-day:last-child:hover .trend-tooltip,
.trend-day:last-child:focus-visible .trend-tooltip {
  transform: translate(0, 0);
}

.trend-values {
  display: grid;
  gap: 2px;
  min-height: 30px;
  color: #1e293b;
  font-size: 11px;
  font-weight: 850;
  line-height: 1.1;
  text-align: center;
}

.trend-values b,
.trend-values span,
.trend-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trend-values span {
  color: #0f766e;
  font-size: 10px;
}

.trend-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
  text-align: center;
}

.legend-row {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.legend-row span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.legend-dot.orders { background: #2563eb; }
.legend-dot.revenue { background: #14b8a6; }

.queue-list,
.rank-list,
.source-list,
.flow-grid {
  display: grid;
  gap: 10px;
}

.queue-row {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.queue-row:hover,
.system-card:hover {
  border-color: #93c5fd;
  background: #f8fbff;
}

.queue-row strong,
.source-row strong,
.cell-title {
  display: block;
  color: #1e293b;
  font-size: 13px;
  font-weight: 850;
}

.queue-row span,
.source-row span,
td small {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
}

.queue-row b {
  color: #0f172a;
  font-size: 20px;
  font-weight: 950;
}

.flow-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.flow-step {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.flow-top span,
.rank-meta span {
  color: #1e293b;
  font-size: 13px;
  font-weight: 850;
}

.flow-top strong,
.rank-meta b {
  color: #0f172a;
  font-size: 13px;
  font-weight: 950;
}

.flow-track,
.rank-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
  margin: 9px 0;
}

.flow-track span,
.rank-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.flow-meta span,
.flow-meta b,
.rank-row small {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.rank-meta span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.rank-meta i {
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  border-radius: 999px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e2e8f0;
  padding: 11px 9px;
  color: #334155;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

td {
  font-weight: 750;
}

.source-row {
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.source-rates {
  text-align: right;
}

.source-rates b {
  display: block;
  color: #16a34a;
  font-size: 13px;
}

.source-rates small {
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
}

.system-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
  margin-bottom: 0;
}

.system-card {
  cursor: pointer;
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

@media (max-width: 1400px) {
  .kpi-grid,
  .system-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .flow-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .dashboard-grid,
  .dashboard-grid.bottom {
    grid-template-columns: 1fr;
  }

  .trend-chart {
    grid-template-columns: repeat(14, 44px);
    overflow-x: auto;
    padding-bottom: 4px;
  }
}

@media (max-width: 720px) {
  .dashboard-page {
    padding: 16px;
  }

  .dashboard-head,
  .head-actions,
  .panel-head {
    flex-direction: column;
  }

  .kpi-grid,
  .system-grid,
  .flow-grid {
    grid-template-columns: 1fr;
  }

  .panel,
  .kpi-card,
  .system-card {
    padding: 14px;
  }
}
</style>
