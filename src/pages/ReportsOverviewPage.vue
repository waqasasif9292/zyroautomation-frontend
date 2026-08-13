<template>
  <AppLayout>
    <main class="overview-page">
      <section class="page-head">
        <div>
          <p class="eyebrow">Reports</p>
          <h1>Owner Overview</h1>
          <p>Full operating snapshot across orders, cash exposure, courier flow, product status, returns, and cancellations.</p>
        </div>
        <button class="refresh-btn" type="button" :disabled="loading" @click="fetchData">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </section>

      <section class="filters-panel">
        <label>
          <span>Date From</span>
          <input v-model="filters.date_from" type="date">
        </label>
        <label>
          <span>Date To</span>
          <input v-model="filters.date_to" type="date">
        </label>
        <label>
          <span>Brand</span>
          <select v-model="filters.brand_id">
            <option value="">All brands</option>
            <option v-for="brand in data.filters.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
          </select>
        </label>
        <label>
          <span>Courier</span>
          <select v-model="filters.courier_integration_id">
            <option value="">All couriers</option>
            <option v-for="courier in data.filters.couriers" :key="courier.id" :value="courier.id">{{ courier.name }}</option>
          </select>
        </label>
        <label>
          <span>Source</span>
          <select v-model="filters.source">
            <option value="">All sources</option>
            <option v-for="source in data.filters.sources" :key="source" :value="source">{{ source }}</option>
          </select>
        </label>
        <button class="filter-btn" type="button" :disabled="loading" @click="fetchData">Apply</button>
      </section>

      <section class="kpi-grid">
        <div v-for="metric in kpis" :key="metric.key" class="kpi-card" :class="metric.tone">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.note }}</small>
        </div>
      </section>

      <section class="flow-panel">
        <div class="panel-head">
          <h2>Order Flow</h2>
          <span>{{ formatDateTime(data.generated_at) }}</span>
        </div>
        <div class="flow-track">
          <div v-for="step in orderFlowWithHold" :key="step.key" class="flow-step">
            <div class="flow-bar">
              <span :style="{ height: `${barPercent(step.orders, maxFlowOrders)}%` }"></span>
            </div>
            <strong>{{ formatNumber(step.orders) }}</strong>
            <span>{{ step.label }}</span>
            <small>{{ formatMoney(step.cod) }}</small>
          </div>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="panel">
          <div class="panel-head">
            <h2>Status Mix</h2>
            <button type="button" @click="router.push('/reports/in-progress')">In Progress Report</button>
          </div>
          <div class="pie-layout">
            <div class="donut" :style="{ background: statusDonut }">
              <span>{{ formatNumber(data.summary.total_orders) }}</span>
            </div>
            <div class="legend-list">
              <div v-for="row in topStatusRows" :key="row.key" class="legend-row">
                <i :style="{ background: statusColor(row.key) }"></i>
                <span>{{ row.label }}</span>
                <strong>{{ formatNumber(row.orders) }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Order Count</h2>
          </div>
          <div class="trend-chart">
            <svg viewBox="0 0 720 240" preserveAspectRatio="none" role="img" aria-label="Order count trend">
              <g class="trend-grid">
                <g v-for="tick in trendChart.yTicks" :key="tick.value">
                  <line :x1="trendChart.plot.left" :x2="trendChart.plot.right" :y1="tick.y" :y2="tick.y" />
                  <text :x="trendChart.plot.left - 10" :y="tick.y + 4">{{ formatNumber(tick.value) }}</text>
                </g>
              </g>
              <line class="trend-axis" :x1="trendChart.plot.left" :x2="trendChart.plot.left" :y1="trendChart.plot.top" :y2="trendChart.plot.bottom" />
              <line class="trend-axis" :x1="trendChart.plot.left" :x2="trendChart.plot.right" :y1="trendChart.plot.bottom" :y2="trendChart.plot.bottom" />
              <polyline v-if="trendChart.points.length > 1" class="trend-line" :points="trendChart.linePoints" />
              <g v-for="point in trendChart.points" :key="point.date">
                <title>{{ point.label }}: {{ formatNumber(point.orders) }} orders</title>
                <circle class="trend-point" :cx="point.x" :cy="point.y" r="4" />
              </g>
              <g class="trend-labels">
                <text
                  v-for="label in trendChart.xLabels"
                  :key="label.date"
                  :x="label.x"
                  :y="trendChart.plot.bottom + 24"
                  text-anchor="middle"
                >
                  {{ label.label }}
                </text>
              </g>
            </svg>
          </div>
        </section>
      </div>

      <div class="dashboard-grid reports-table-grid">
        <section class="panel">
          <div class="panel-head">
            <h2>Courier Exposure</h2>
            <button type="button" @click="router.push('/delivery-charges')">Charges</button>
          </div>
          <table class="courier-table">
            <thead>
              <tr>
                <th>Courier</th>
                <th>Dispatched</th>
                <th>Return</th>
                <th>Delivered</th>
                <th>Pending</th>
                <th>Total Charges</th>
                <th>Avg DC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.couriers" :key="row.courier_id || row.courier_name">
                <td>{{ row.courier_name }}</td>
                <td>{{ formatNumber(row.dispatched) }}</td>
                <td>{{ countWithPercent(row.returned, row.return_rate) }}</td>
                <td>{{ countWithPercent(row.delivered, row.delivery_rate) }}</td>
                <td>{{ countWithPercent(row.pending, row.pending_rate) }}</td>
                <td>{{ formatMoney(row.delivery_charges) }}</td>
                <td>{{ formatMoney(row.average_delivery_charge) }}</td>
              </tr>
              <tr v-if="!data.couriers.length"><td colspan="7">No courier data.</td></tr>
            </tbody>
          </table>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Product Status Summary</h2>
            <button type="button" @click="router.push('/reports/products')">Products</button>
          </div>
          <div class="table-scroll">
            <table class="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total Orders</th>
                  <th>Cancel</th>
                  <th>Dispatched</th>
                  <th>Delivered</th>
                  <th>Return</th>
                  <th>Pending</th>
                  <th>Dispatched Qty</th>
                  <th>Total COD</th>
                  <th>Avg COD</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in data.products" :key="row.key">
                  <td>
                    <div class="strong">{{ row.product_name }}</div>
                    <small>{{ row.sku || 'No SKU' }}</small>
                  </td>
                  <td>{{ formatNumber(row.orders) }}</td>
                  <td>{{ countWithPercent(row.cancelled, row.cancel_rate) }}</td>
                  <td>{{ formatNumber(row.dispatched) }}</td>
                  <td>{{ countWithPercent(row.delivered, row.delivery_rate) }}</td>
                  <td>{{ countWithPercent(row.returned, row.return_rate) }}</td>
                  <td>{{ countWithPercent(row.pending, row.pending_rate) }}</td>
                  <td>{{ formatNumber(row.dispatched_quantity) }}</td>
                  <td>{{ formatMoney(row.cod) }}</td>
                  <td>{{ formatMoney(row.average_cod) }}</td>
                </tr>
                <tr v-if="!data.products.length"><td colspan="10">No product status data.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div class="dashboard-grid bottom">
        <section class="panel">
          <div class="panel-head">
            <h2>Sales Channel Summary</h2>
            <select v-model="summaryMode" class="panel-select">
              <option value="source">Source</option>
              <option value="brand">Brand</option>
            </select>
          </div>
          <table>
            <thead>
              <tr>
                <th>{{ summaryLabel }}</th>
                <th>Orders</th>
                <th>Dispatched</th>
                <th>Delivered</th>
                <th>Returned</th>
                <th>Cancelled</th>
                <th>COD</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in summaryRows" :key="row.key">
                <td>{{ row.name }}</td>
                <td>{{ formatNumber(row.orders) }}</td>
                <td>{{ formatNumber(row.dispatched) }}</td>
                <td>{{ countWithPercent(row.delivered, row.delivery_rate) }}</td>
                <td>{{ countWithPercent(row.returned, row.return_rate) }}</td>
                <td>{{ countWithPercent(row.cancelled, row.cancel_rate) }}</td>
                <td>{{ formatMoney(row.cod) }}</td>
              </tr>
              <tr v-if="!summaryRows.length"><td colspan="7">No {{ summaryLabel.toLowerCase() }} data.</td></tr>
            </tbody>
          </table>
        </section>

        <section class="panel actions-panel">
          <div class="panel-head">
            <h2>Report Shortcuts</h2>
          </div>
          <div class="shortcut-grid">
            <button type="button" @click="router.push('/reports/in-progress')">
              <span>In Progress Report</span>
              <strong>Courier cash and parcel exposure</strong>
            </button>
            <button type="button" @click="router.push('/reports/returns')">
              <span>Return Report</span>
              <strong>Returned parcels, products, cities, couriers</strong>
            </button>
            <button type="button" @click="router.push('/reports/cancel')">
              <span>Cancel Report</span>
              <strong>Cancellation risk by product and city</strong>
            </button>
            <button type="button" @click="router.push('/reports/products')">
              <span>Product Report</span>
              <strong>Product performance by status and courier</strong>
            </button>
          </div>
        </section>
      </div>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import OrderPerformanceService from '../services/OrderPerformanceService';

const router = useRouter();
const loading = ref(false);
const summaryMode = ref('source');
const localDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
const currentMonthRange = () => {
  const today = new Date();

  return {
    date_from: localDateValue(new Date(today.getFullYear(), today.getMonth(), 1)),
    date_to: localDateValue(today),
  };
};
const filters = reactive({
  brand_id: '',
  courier_integration_id: '',
  ...currentMonthRange(),
  source: '',
});
const data = ref({
  summary: {},
  order_flow: [],
  status_mix: [],
  in_progress: {},
  couriers: [],
  products: [],
  sources: [],
  brands: [],
  trend: [],
  cancelled: {},
  returns: {},
  filters: { brands: [], couriers: [], sources: [] },
  generated_at: null,
});

const kpis = computed(() => {
  const summary = data.value.summary || {};
  const inProgress = data.value.in_progress || {};
  const dispatchedOrders = Math.max(0,
    Number(summary.total_orders || 0)
    - statusCount('cancel_by_shipper')
    - statusCount('hold')
    - statusCount('error')
    - statusCount('pending_confirmation')
  );
  const dispatchedCod = Math.max(0,
    Number(summary.total_cod || 0)
    - statusCod('cancel_by_shipper')
    - statusCod('hold')
    - statusCod('error')
    - statusCod('pending_confirmation')
  );
  const dispatchedDeliveryRate = percentage(statusCount('delivered'), dispatchedOrders);
  const dispatchedReturnRate = percentage(statusCount('returned_to_shipper'), dispatchedOrders);

  return [
    { key: 'total', label: 'Total Orders', value: formatNumber(summary.total_orders), note: formatMoney(summary.total_revenue), tone: '' },
    { key: 'dispatched', label: 'Dispatched', value: formatNumber(dispatchedOrders), note: `${formatMoney(dispatchedCod)} COD`, tone: 'indigo' },
    { key: 'open', label: 'Open Orders', value: formatNumber(summary.open_orders), note: 'Not delivered, returned, or cancelled', tone: 'blue' },
    { key: 'in-progress', label: 'With Couriers', value: formatNumber(inProgress.orders), note: `${formatMoney(inProgress.cod)} COD`, tone: 'teal' },
    { key: 'return-risk', label: 'Return Exposure', value: formatNumber(summary.return_exposure_orders), note: formatMoney(summary.return_exposure_cod), tone: 'amber' },
    { key: 'delivery-rate', label: 'Delivery Rate', value: `${formatPercent(dispatchedDeliveryRate)}%`, note: `${formatPercent(dispatchedReturnRate)}% return (dispatched) · ${formatPercent(summary.cancel_rate)}% cancel`, tone: 'green' },
  ];
});

const orderFlowWithHold = computed(() => [
  {
    key: 'hold',
    label: 'On Hold',
    orders: statusCount('hold'),
    cod: statusCod('hold'),
  },
  ...data.value.order_flow,
]);
const maxFlowOrders = computed(() => Math.max(...orderFlowWithHold.value.map(row => row.orders), 1));
const topStatusRows = computed(() => data.value.status_mix.slice(0, 7));
const trendChart = computed(() => {
  const rows = data.value.trend || [];
  const plot = { left: 54, right: 700, top: 22, bottom: 198 };
  const maxOrders = Math.max(...rows.map(row => Number(row.orders || 0)), 1);
  const tickStep = Math.max(1, Math.ceil(maxOrders / 4));
  const yMax = tickStep * 4;
  const span = Math.max(rows.length - 1, 1);
  const xForIndex = index => plot.left + ((plot.right - plot.left) * index) / span;
  const yForOrders = orders => plot.bottom - ((plot.bottom - plot.top) * Number(orders || 0)) / yMax;
  const points = rows.map((row, index) => ({
    ...row,
    x: xForIndex(index),
    y: yForOrders(row.orders),
  }));
  const labelEvery = rows.length > 20 ? Math.ceil(rows.length / 10) : 1;

  return {
    plot,
    points,
    linePoints: points.map(point => `${point.x},${point.y}`).join(' '),
    yTicks: [4, 3, 2, 1, 0].map(multiplier => ({
      value: tickStep * multiplier,
      y: yForOrders(tickStep * multiplier),
    })),
    xLabels: points.filter((_, index) => index === 0 || index === points.length - 1 || index % labelEvery === 0),
  };
});
const summaryLabel = computed(() => summaryMode.value === 'brand' ? 'Brand' : 'Source');
const summaryRows = computed(() => {
  const rows = summaryMode.value === 'brand' ? data.value.brands : data.value.sources;

  return rows.map(row => ({
    key: summaryMode.value === 'brand' ? `brand:${row.brand_id || row.brand_name}` : `source:${row.source}`,
    name: summaryMode.value === 'brand' ? row.brand_name : row.source,
    orders: row.orders,
    dispatched: row.dispatched,
    delivered: row.delivered,
    delivery_rate: row.delivery_rate,
    returned: row.returned,
    return_rate: row.return_rate,
    cancelled: row.cancelled,
    cancel_rate: row.cancel_rate,
    cod: row.cod,
  }));
});

const statusPalette = {
  hold: '#475569',
  pending_confirmation: '#64748b',
  merchant_warehouse: '#2563eb',
  dispatched: '#0f766e',
  out_for_delivery: '#7c3aed',
  delivered: '#16a34a',
  ready_for_return: '#f59e0b',
  out_for_return: '#ea580c',
  returned_to_shipper: '#dc2626',
  cancel_by_shipper: '#991b1b',
  duplicate: '#9333ea',
  error: '#b91c1c',
  other: '#94a3b8',
};

const statusColor = key => statusPalette[key] || '#94a3b8';
const statusDonut = computed(() => {
  const rows = topStatusRows.value;
  const total = rows.reduce((sum, row) => sum + Number(row.orders || 0), 0);
  if (!total) return 'conic-gradient(#e2e8f0 0 100%)';

  let cursor = 0;
  const stops = rows.map((row) => {
    const start = cursor;
    cursor += (Number(row.orders || 0) / total) * 100;
    return `${statusColor(row.key)} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
});

const requestParams = () => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== null && value !== '')
);
const statusRow = key => data.value.status_mix.find(row => row.key === key) || {};
const statusCount = key => Number(statusRow(key).orders || 0);
const statusCod = key => Number(statusRow(key).cod || 0);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await OrderPerformanceService.getOverview(requestParams());
    data.value = {
      ...data.value,
      ...(res.data.data || {}),
      filters: {
        brands: res.data.data?.filters?.brands || data.value.filters.brands,
        couriers: res.data.data?.filters?.couriers || data.value.filters.couriers,
        sources: res.data.data?.filters?.sources || data.value.filters.sources,
      },
    };
  } finally {
    loading.value = false;
  }
};

const formatNumber = value => Number(value || 0).toLocaleString();
const formatMoney = value => `PKR ${Number(value || 0).toLocaleString()}`;
const formatPercent = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
const countWithPercent = (count, percent) => `${formatNumber(count)} (${formatPercent(percent)}%)`;
const percentage = (part, total) => Number(total || 0) > 0 ? (Number(part || 0) / Number(total || 0)) * 100 : 0;
const barPercent = (part, total) => Math.max(Number(part || 0) > 0 ? 6 : 0, Math.round((Number(part || 0) / Number(total || 1)) * 100));
const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

onMounted(fetchData);
</script>

<style scoped>
.overview-page {
  min-height: 100vh;
  padding: 28px;
  background: #f1f5f9;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #0f172a;
  font-size: 26px;
  font-weight: 900;
}

.page-head p:last-child {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
}

.refresh-btn,
.filter-btn,
.panel-head button,
.shortcut-grid button {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.refresh-btn,
.panel-head button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
  padding: 9px 13px;
}

.filter-btn {
  align-self: end;
  min-height: 38px;
  border: 0;
  background: #2563eb;
  color: #fff;
}

.refresh-btn:disabled,
.filter-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters-panel,
.kpi-card,
.flow-panel,
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.filters-panel {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) 96px;
  gap: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

label span {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

input,
select {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
  color: #0f172a;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.kpi-card {
  padding: 14px;
  border-top: 4px solid #94a3b8;
}

.kpi-card.blue { border-top-color: #2563eb; }
.kpi-card.indigo { border-top-color: #4f46e5; }
.kpi-card.teal { border-top-color: #0f766e; }
.kpi-card.amber { border-top-color: #f59e0b; }
.kpi-card.green { border-top-color: #16a34a; }

.kpi-card span,
.kpi-card small {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.kpi-card strong {
  display: block;
  margin-top: 7px;
  color: #0f172a;
  font-size: 24px;
}

.kpi-card small {
  margin-top: 5px;
}

.flow-panel,
.panel {
  overflow: hidden;
  margin-bottom: 16px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-head h2 {
  color: #172554;
  font-size: 16px;
}

.panel-head span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.panel-select {
  width: 130px;
  height: 38px;
  font-weight: 800;
}

.flow-track {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 10px;
  padding: 16px;
  min-height: 190px;
}

.flow-step {
  display: grid;
  grid-template-rows: 96px auto auto auto;
  align-items: end;
  gap: 5px;
  min-width: 0;
  text-align: center;
}

.flow-bar {
  display: flex;
  align-items: end;
  justify-content: center;
  height: 96px;
  border-radius: 7px;
  background: #f1f5f9;
}

.flow-bar span {
  display: block;
  width: 68%;
  min-height: 4px;
  border-radius: 7px 7px 0 0;
  background: #2563eb;
}

.flow-step strong {
  color: #0f172a;
  font-size: 18px;
}

.flow-step span,
.flow-step small {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
}

.dashboard-grid.bottom {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
}

.reports-table-grid {
  grid-template-columns: 1fr;
}

.pie-layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 18px;
  align-items: center;
  padding: 18px;
}

.donut {
  display: grid;
  place-items: center;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  position: relative;
}

.donut::after {
  content: '';
  position: absolute;
  width: 102px;
  height: 102px;
  border-radius: 50%;
  background: #fff;
}

.donut span {
  position: relative;
  z-index: 1;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.legend-list,
.bar-list {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.legend-row {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  align-items: center;
  gap: 9px;
  color: #475569;
  font-size: 13px;
}

.legend-row i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-row strong {
  color: #0f172a;
}

.trend-chart {
  height: 240px;
  padding: 14px 16px 10px;
}

.trend-chart svg {
  display: block;
  width: 100%;
  height: 100%;
}

.trend-grid line {
  stroke: #e2e8f0;
  stroke-width: 1;
}

.trend-grid text,
.trend-labels text {
  fill: #64748b;
  font-size: 10px;
  font-weight: 700;
  vector-effect: non-scaling-stroke;
}

.trend-grid text {
  text-anchor: end;
}

.trend-axis {
  stroke: #94a3b8;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.trend-line {
  fill: none;
  stroke: #0f766e;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
}

.trend-point {
  fill: #0f766e;
  stroke: #fff;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.bar-row {
  display: grid;
  gap: 8px;
}

.bar-copy {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.bar-copy strong {
  color: #0f172a;
}

.bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0f766e;
}

.empty-line {
  color: #64748b;
  font-size: 13px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

.table-scroll {
  overflow-x: auto;
}

th,
td {
  padding: 11px 12px;
  border-bottom: 1px solid #edf2f7;
  color: #334155;
  font-size: 13px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f8fafc;
  color: #475569;
  font-weight: 800;
  white-space: nowrap;
}

td small {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.strong {
  max-width: 300px;
  overflow: hidden;
  color: #0f172a;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shortcut-grid {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.shortcut-grid button {
  display: grid;
  gap: 4px;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 14px;
  color: #0f172a;
  text-align: left;
}

.shortcut-grid button:hover {
  border-color: #2563eb;
}

.shortcut-grid span {
  color: #2563eb;
  font-weight: 900;
}

.shortcut-grid strong {
  color: #334155;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .filters-panel,
  .kpi-grid,
  .dashboard-grid,
  .dashboard-grid.bottom,
  .pie-layout {
    grid-template-columns: 1fr;
  }

  .flow-track {
    overflow-x: auto;
    grid-template-columns: repeat(9, 120px);
  }

  .panel {
    overflow-x: auto;
  }
}
</style>
