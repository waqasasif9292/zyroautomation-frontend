<template>
  <AppLayout>
    <main class="in-progress-page">
      <section class="page-head">
        <div>
          <p class="eyebrow">Reports</p>
          <h1>In Progress Orders</h1>
          <p>Measure parcels currently handed over to couriers: COD, product value, returns, and courier exposure.</p>
        </div>
      </section>

      <section class="filters-panel">
        <div class="filters-grid">
          <label>
            <span>Booking From</span>
            <input v-model="filters.date_from" type="date">
          </label>
          <label>
            <span>Booking To</span>
            <input v-model="filters.date_to" type="date">
          </label>
          <label>
            <span>Brand</span>
            <select v-model="filters.brand_id">
              <option value="">All brands</option>
              <option v-for="brand in brandStore.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
            </select>
          </label>
          <label>
            <span>Courier</span>
            <select v-model="filters.courier_integration_id">
              <option value="">All couriers</option>
              <option v-for="integration in integrationStore.integrations" :key="integration.id" :value="integration.id">
                {{ integration.name }}
              </option>
            </select>
          </label>
          <label>
            <span>Source</span>
            <select v-model="filters.source">
              <option value="">All sources</option>
              <option v-for="source in sourceOptions" :key="source" :value="source">{{ source }}</option>
            </select>
          </label>
        </div>
        <div class="filter-actions">
          <button class="secondary-btn" type="button" :disabled="loading" @click="clearReport">Clear</button>
          <button class="run-btn" type="button" :disabled="loading" @click="createReport">
            {{ loading ? 'Creating...' : 'Create Report' }}
          </button>
        </div>
      </section>

      <section v-if="!hasRun && !errorMessage" class="empty-prompt">
        <h2>Create an in progress report</h2>
        <p>Select optional filters, then create the report to see parcels, COD, product value, return exposure, and courier workload.</p>
      </section>

      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

      <template v-if="hasRun && report">
        <section class="summary-grid">
          <div v-for="metric in summaryMetrics" :key="metric.key" class="metric">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small>{{ metric.note }}</small>
          </div>
        </section>

        <section class="insight-strip">
          <div>
            <span>Return Exposure</span>
            <strong>{{ returnExposureText }}</strong>
          </div>
          <div>
            <span>Cash Still With Courier Flow</span>
            <strong>{{ formatMoney(report.summary.total_cod) }}</strong>
          </div>
          <div>
            <span>Highest Courier Load</span>
            <strong>{{ topCourierText }}</strong>
          </div>
        </section>

        <div class="panel-grid">
          <section class="panel">
            <div class="panel-head">
              <h2>Status Exposure</h2>
              <span>{{ formatDateTime(report.generated_at) }}</span>
            </div>
            <div class="bar-list">
              <div v-for="row in report.status_breakdown" :key="row.key" class="bar-row">
                <div class="bar-copy">
                  <strong>{{ row.label }}</strong>
                  <span>{{ formatNumber(row.orders) }} parcels · {{ formatMoney(row.total_cod) }} COD</span>
                </div>
                <div class="bar-track" aria-hidden="true">
                  <span :style="{ width: `${barPercent(row.orders, maxStatusOrders)}%` }"></span>
                </div>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>Courier Load</h2>
            </div>
            <div class="bar-list">
              <div v-for="row in topCourierRows" :key="row.courier_id || row.courier_name" class="bar-row">
                <div class="bar-copy">
                  <strong>{{ row.courier_name }}</strong>
                  <span>{{ formatNumber(row.parcels) }} parcels · {{ formatMoney(row.total_cod) }} COD</span>
                </div>
                <div class="bar-track courier" aria-hidden="true">
                  <span :style="{ width: `${barPercent(row.parcels, maxCourierParcels)}%` }"></span>
                </div>
              </div>
              <div v-if="!topCourierRows.length" class="empty-line">No courier data.</div>
            </div>
          </section>
        </div>

        <section class="panel">
          <div class="panel-head">
            <h2>Courier Summary</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Courier</th>
                <th>Parcels</th>
                <th>Product Value</th>
                <th>Total COD</th>
                <th>In Transit</th>
                <th>Out For Delivery</th>
                <th>Ready For Return</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.courier_breakdown" :key="row.courier_id || 'unassigned'">
                <td>{{ row.courier_name }}</td>
                <td>{{ formatNumber(row.parcels) }}</td>
                <td>{{ formatMoney(row.product_value) }}</td>
                <td>{{ formatMoney(row.total_cod) }}</td>
                <td>{{ formatNumber(row.in_transit) }}</td>
                <td>{{ formatNumber(row.out_for_delivery) }}</td>
                <td>{{ formatNumber(row.ready_for_return) }}</td>
              </tr>
              <tr v-if="!report.courier_breakdown.length"><td colspan="7">No courier data.</td></tr>
            </tbody>
          </table>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Product Exposure</h2>
            <span>COD is allocated by product value share</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Orders</th>
                <th>Units</th>
                <th>Product Value</th>
                <th>Total COD</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.product_breakdown" :key="row.key">
                <td>
                  <div class="strong">{{ row.product_name }}</div>
                  <small>{{ row.sku || 'No SKU' }}</small>
                </td>
                <td>{{ formatNumber(row.orders) }}</td>
                <td>{{ formatNumber(row.units) }}</td>
                <td>{{ formatMoney(row.product_value) }}</td>
                <td>{{ formatMoney(row.total_cod) }}</td>
              </tr>
              <tr v-if="!report.product_breakdown.length"><td colspan="5">No product data.</td></tr>
            </tbody>
          </table>
        </section>
      </template>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import InProgressOrderReportService from '../services/InProgressOrderReportService';
import { useBrandStore } from '../stores/brandStore';
import { useIntegrationStore } from '../stores/integrationStore';

const brandStore = useBrandStore();
const integrationStore = useIntegrationStore();
const loading = ref(false);
const hasRun = ref(false);
const report = ref(null);
const errorMessage = ref('');
const filters = reactive({
  brand_id: '',
  courier_integration_id: '',
  date_from: '',
  date_to: '',
  source: '',
});

const sourceOptions = computed(() => {
  const defaults = ['Website', 'WhatsApp', 'Abandoned', 'Social'];
  const brandSources = brandStore.brands.flatMap(brand => brand.sources || []);
  return [...new Set([...defaults, ...brandSources].filter(Boolean))];
});

const summaryMetrics = computed(() => {
  const summary = report.value?.summary || {};
  const readyReturn = statusByKey.value.ready_for_return?.orders || 0;
  const ofd = statusByKey.value.out_for_delivery?.orders || 0;

  return [
    { key: 'orders', label: 'Remaining Parcels', value: formatNumber(summary.total_orders), note: 'Currently outside office' },
    { key: 'cod', label: 'Remaining COD', value: formatMoney(summary.total_cod), note: 'Cash value still open' },
    { key: 'product_value', label: 'Product Value', value: formatMoney(summary.product_value), note: 'Inventory value in courier flow' },
    { key: 'ofd', label: 'Out For Delivery', value: formatNumber(ofd), note: 'Parcels with riders' },
    { key: 'returns', label: 'Ready For Return', value: formatNumber(readyReturn), note: 'Return exposure' },
  ];
});

const statusByKey = computed(() => Object.fromEntries((report.value?.status_breakdown || []).map(row => [row.key, row])));
const maxStatusOrders = computed(() => Math.max(...(report.value?.status_breakdown || []).map(row => row.orders), 1));
const topCourierRows = computed(() => (report.value?.courier_breakdown || []).slice(0, 6));
const maxCourierParcels = computed(() => Math.max(...topCourierRows.value.map(row => row.parcels), 1));
const returnExposureText = computed(() => {
  const ready = statusByKey.value.ready_for_return?.orders || 0;
  const total = report.value?.summary?.total_orders || 0;
  return `${formatNumber(ready)} parcels (${percentage(ready, total)}%)`;
});
const topCourierText = computed(() => {
  const courier = topCourierRows.value[0];
  if (!courier) return 'No courier data';
  return `${courier.courier_name} · ${formatNumber(courier.parcels)} parcels`;
});

const requestParams = () => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== null && value !== '')
);

const createReport = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await InProgressOrderReportService.getReport(requestParams());
    report.value = res.data.data;
    hasRun.value = true;
  } catch (error) {
    report.value = null;
    hasRun.value = false;
    errorMessage.value = error.response?.data?.message || 'Unable to create in progress report.';
  } finally {
    loading.value = false;
  }
};

const clearReport = () => {
  Object.assign(filters, {
    brand_id: '',
    courier_integration_id: '',
    date_from: '',
    date_to: '',
    source: '',
  });
  report.value = null;
  hasRun.value = false;
  errorMessage.value = '';
};

const formatNumber = value => Number(value || 0).toLocaleString();
const formatMoney = value => `PKR ${Number(value || 0).toLocaleString()}`;
const percentage = (part, total) => total > 0 ? Math.round((Number(part || 0) / Number(total || 0)) * 100) : 0;
const barPercent = (part, total) => Math.max(4, percentage(part, total));
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

onMounted(async () => {
  await Promise.all([
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
    integrationStore.integrations.length ? Promise.resolve() : integrationStore.fetchIntegrations(),
  ]);
});
</script>

<style scoped>
.in-progress-page {
  min-height: 100vh;
  padding: 28px;
  background: #f1f5f9;
}

.page-head {
  margin-bottom: 18px;
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
  color: #172554;
  font-size: 24px;
}

.page-head p:last-child {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
}

.filters-panel,
.empty-prompt,
.metric,
.insight-strip,
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.filters-panel {
  padding: 16px;
  margin-bottom: 16px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
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

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.run-btn,
.secondary-btn {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 7px;
  cursor: pointer;
  font-weight: 800;
}

.run-btn {
  border: 0;
  background: #2563eb;
  color: #fff;
}

.secondary-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.run-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.empty-prompt {
  padding: 28px;
  color: #475569;
}

.empty-prompt h2 {
  margin-bottom: 7px;
  color: #172554;
  font-size: 18px;
}

.form-error {
  margin-bottom: 16px;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

.summary-grid,
.panel-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.summary-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.panel-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.metric {
  padding: 14px;
}

.metric span,
.metric small,
.insight-strip span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.metric strong,
.insight-strip strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 21px;
}

.metric small {
  margin-top: 5px;
}

.insight-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
  margin-bottom: 16px;
}

.panel {
  overflow: hidden;
  margin-bottom: 16px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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

.bar-list {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.bar-row {
  display: grid;
  gap: 8px;
}

.bar-copy {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
  font-size: 12px;
}

.bar-copy strong {
  color: #0f172a;
}

.bar-track {
  height: 11px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}

.bar-track.courier span {
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
  max-width: 420px;
  overflow: hidden;
  color: #0f172a;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .filters-grid,
  .summary-grid,
  .panel-grid,
  .insight-strip {
    grid-template-columns: 1fr;
  }

  .panel {
    overflow-x: auto;
  }
}
</style>
