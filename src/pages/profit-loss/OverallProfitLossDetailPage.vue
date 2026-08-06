<template>
  <AppLayout>
    <main class="page">
      <div v-if="loading" class="loading">Loading report...</div>
      <template v-else-if="report">
        <section class="header-panel">
          <div>
            <h1>{{ report.name }}</h1>
            <p>{{ report.start_date }} to {{ report.end_date }}</p>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" type="button" @click="router.push('/overall-profit-loss')">Back</button>
            <button class="primary-btn" type="button" @click="router.push(`/overall-profit-loss/${report.id}/edit`)">Edit</button>
          </div>
        </section>

        <section class="result-panel" :class="{ loss: results.totals?.final_profit < 0 }">
          <span>{{ results.totals?.final_profit >= 0 ? 'Final Profit' : 'Final Loss' }}</span>
          <strong>{{ money(Math.abs(Number(results.totals?.final_profit || 0))) }}</strong>
          <div v-if="zeroDcCount" class="zero-dc-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.3 21a2 2 0 0 0 3.4 0" />
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            </svg>
            <span>{{ zeroDcCount }} {{ zeroDcCount === 1 ? 'parcel has' : 'parcels have' }} 0 DC</span>
          </div>
        </section>

        <section class="cards">
          <article>
            <span>Dispatched Orders</span>
            <strong>{{ number(results.summary?.total_orders) }}</strong>
          </article>
          <article>
            <span>Delivered</span>
            <strong>{{ number(results.summary?.delivered_count) }}</strong>
            <small>{{ percentOfTotal(results.summary?.delivered_count) }} of dispatched</small>
          </article>
          <article>
            <span>Returned</span>
            <strong>{{ number(results.summary?.returned_count) }}</strong>
            <small>{{ percentOfTotal(results.summary?.returned_count) }} of dispatched</small>
          </article>
          <article>
            <span>Pending</span>
            <strong>{{ number(results.summary?.pending_count) }}</strong>
            <small>{{ percentOfTotal(results.summary?.pending_count) }} of dispatched</small>
          </article>
          <article>
            <span>Products</span>
            <strong>{{ number(report.summary?.products_count) }}</strong>
          </article>
          <article>
            <span>Total Quantity</span>
            <strong>{{ number(report.summary?.total_quantity) }}</strong>
          </article>
        </section>

        <section class="cards input-cards">
          <article>
            <span>Packing / Order</span>
            <strong>{{ money(report.packing_cost) }}</strong>
          </article>
          <article>
            <span>Ad Spend</span>
            <strong>{{ money(report.total_ad_spend) }}</strong>
          </article>
          <article>
            <span>Ad Tax</span>
            <strong>{{ percent(report.ads_tax_percentage) }}</strong>
          </article>
        </section>

        <section class="chart-grid">
          <article class="chart-card">
            <header>
              <h2>Order Status Mix</h2>
            </header>
            <div class="donut-layout">
              <div class="donut" :style="{ background: statusDonutGradient }">
                <span>{{ number(results.summary?.dispatched_count) }}</span>
              </div>
              <dl class="legend-list">
                <div v-for="item in statusChart" :key="item.label">
                  <dt><i :style="{ background: item.color }"></i>{{ item.label }}</dt>
                  <dd>{{ number(item.value) }} <small>{{ percent(item.percent) }}</small></dd>
                </div>
              </dl>
            </div>
          </article>

          <article class="chart-card">
            <header>
              <h2>Cost Breakdown</h2>
            </header>
            <div class="bar-list">
              <div v-for="item in costBreakdown" :key="item.label" class="bar-row">
                <div>
                  <span>{{ item.label }}</span>
                  <strong>{{ money(item.value) }}</strong>
                </div>
                <div class="bar-track">
                  <span :style="{ width: `${item.percent}%`, background: item.color }"></span>
                </div>
              </div>
            </div>
          </article>

          <article class="chart-card wide-chart">
            <header>
              <h2>Top Product Costs</h2>
            </header>
            <div class="bar-list product-bars">
              <div v-for="item in topProductCosts" :key="item.key" class="bar-row">
                <div>
                  <span>{{ item.name }}</span>
                  <strong>{{ money(item.total_cost) }}</strong>
                </div>
                <div class="bar-track">
                  <span :style="{ width: `${item.percent}%`, background: '#2563eb' }"></span>
                </div>
              </div>
              <p v-if="!topProductCosts.length" class="empty-chart">No product costs saved.</p>
            </div>
          </article>
        </section>

        <section class="table-section">
          <h2>Profit/Loss Calculation</h2>
          <div class="calc-grid">
            <article>
              <h3>Revenue & Order Costs</h3>
              <dl>
                <div><dt>Delivered Parcel COD</dt><dd class="positive">{{ money(results.totals?.total_revenue) }}</dd></div>
                <div><dt>Delivered Product Cost</dt><dd class="negative">-{{ money(results.totals?.total_product_cost) }}</dd></div>
                <div><dt>Dispatched Packing</dt><dd class="negative">-{{ money(results.totals?.total_packing) }}</dd></div>
                <div><dt>Dispatched Delivery Charges</dt><dd class="negative">-{{ money(results.totals?.total_dc) }}</dd></div>
                <div><dt>Dispatched Fuel Surcharge</dt><dd class="negative">-{{ money(results.totals?.total_fuel) }}</dd></div>
                <div><dt>Dispatched GST</dt><dd class="negative">-{{ money(results.totals?.total_gst) }}</dd></div>
                <div><dt>Delivered Courier Tax</dt><dd class="negative">-{{ money(results.totals?.total_tax) }}</dd></div>
                <div class="highlight"><dt>Profit Before Ads</dt><dd>{{ money(results.totals?.total_profit_before_ads) }}</dd></div>
              </dl>
            </article>
            <article>
              <h3>Ads & Expenses</h3>
              <dl>
                <div><dt>Total Ad Spend</dt><dd class="negative">-{{ money(results.totals?.total_ad_spend) }}</dd></div>
                <div><dt>Ad Tax</dt><dd class="negative">-{{ money(results.totals?.ads_tax_amount) }}</dd></div>
                <div><dt>Total Ads + Tax</dt><dd class="negative">-{{ money(results.totals?.total_ad_with_tax) }}</dd></div>
                <div><dt>Custom Per-Order Expenses</dt><dd class="negative">-{{ money(results.totals?.total_extra_expenses) }}</dd></div>
                <div><dt>One Time Expenses</dt><dd class="negative">-{{ money(results.totals?.total_one_time_expenses) }}</dd></div>
                <div><dt>Pending Amount</dt><dd class="warning">{{ money(results.totals?.pending_amount) }}</dd></div>
                <div class="highlight"><dt>Final Profit/Loss</dt><dd>{{ money(results.totals?.final_profit) }}</dd></div>
              </dl>
            </article>
          </div>
        </section>

        <section class="table-section">
          <h2>Courier COD & Charges</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Delivered</th>
                  <th>Dispatched</th>
                  <th>Delivery</th>
                  <th>Fuel</th>
                  <th>GST</th>
                  <th>Courier Tax</th>
                  <th>Total Charges</th>
                  <th>Delivered Product Cost</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in courierBreakdown" :key="row.courier_integration_id">
                  <td>{{ courierName(row.courier_integration_id) }}</td>
                  <td>{{ number(row.delivered_count) }}</td>
                  <td>{{ number(row.dispatched_count) }}</td>
                  <td class="money-cell danger">-{{ money(row.delivery_charges) }}</td>
                  <td class="money-cell danger">-{{ money(row.fuel_charges) }}</td>
                  <td class="money-cell danger">-{{ money(row.gst) }}</td>
                  <td class="money-cell danger">-{{ money(row.courier_tax) }}</td>
                  <td class="money-cell danger">-{{ money(row.total_courier_cost) }}</td>
                  <td class="money-cell danger">-{{ money(row.delivered_product_cost) }}</td>
                  <td :class="['money-cell', row.profit >= 0 ? 'success' : 'danger']">
                    {{ money(row.profit) }}
                  </td>
                </tr>
                <tr v-if="!courierBreakdown.length">
                  <td colspan="10">No courier data found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="table-section">
          <h2>Taxes & Expenses</h2>
          <div class="expense-grid">
            <article>
              <h3>Courier Withholding Tax</h3>
              <dl>
                <div v-for="tax in report.courier_taxes" :key="tax.courier_integration_id">
                  <dt>{{ courierName(tax.courier_integration_id) }}</dt>
                  <dd>{{ percent(tax.tax_percentage) }}</dd>
                </div>
                <div v-if="!report.courier_taxes.length">
                  <dt>No courier taxes saved</dt>
                  <dd>-</dd>
                </div>
              </dl>
            </article>
            <article>
              <h3>Custom Expenses Per Order</h3>
              <dl>
                <div v-for="expense in report.extra_expenses" :key="expense.label">
                  <dt>{{ expense.label }}</dt>
                  <dd>{{ money(expense.value) }}</dd>
                </div>
                <div v-if="!report.extra_expenses.length">
                  <dt>No expenses saved</dt>
                  <dd>-</dd>
                </div>
              </dl>
            </article>
            <article>
              <h3>One Time Expenses</h3>
              <dl>
                <div v-for="expense in report.one_time_expenses" :key="expense.label">
                  <dt>{{ expense.label }}</dt>
                  <dd>{{ money(expense.value) }}</dd>
                </div>
                <div v-if="!report.one_time_expenses.length">
                  <dt>No expenses saved</dt>
                  <dd>-</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>

        <section class="table-section">
          <h2>Product Costs</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Dispatched</th>
                  <th>Delivered</th>
                  <th>Returned</th>
                  <th>Delivered Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total Cost Delivered</th>
                  <th>Other Cost</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(product, index) in report.products" :key="product.key">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <span class="product-name">{{ product.name }}</span>
                    <small v-if="product.variant_id">Variant: {{ product.variant_id }}</small>
                  </td>
                  <td>{{ number(product.dispatched_count) }}</td>
                  <td>{{ number(product.delivered_count) }} ({{ percent(product.delivered_percentage) }})</td>
                  <td>{{ number(product.returned_count) }} ({{ percent(product.returned_percentage) }})</td>
                  <td>{{ number(product.delivered_quantity) }}</td>
                  <td>{{ money(product.unit_cost) }}</td>
                  <td>{{ money(product.profit_product_cost) }}</td>
                  <td class="money-cell danger">-{{ money(product.other_cost) }}</td>
                  <td :class="['money-cell', Number(product.profit || 0) >= 0 ? 'success' : 'danger']">
                    {{ money(product.profit) }}
                  </td>
                </tr>
                <tr v-if="!report.products.length">
                  <td colspan="10">No product rows saved.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import OverallProfitLossService from '../../services/OverallProfitLossService';
import ProfitLossCalculationService from '../../services/ProfitLossCalculationService';

const router = useRouter();
const route = useRoute();
const report = ref(null);
const options = ref({ couriers: [] });
const loading = ref(true);
const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();
const percent = (value) => `${Number(value || 0).toLocaleString()}%`;
const percentOfTotal = (value) => {
  const total = Number(results.value.summary?.total_orders || 0);
  if (!total) return '0%';

  return `${Number(((Number(value || 0) / total) * 100).toFixed(1)).toLocaleString()}%`;
};
const courierName = (id) => {
  if (id === 'self_pickup') return 'Self Pickup';
  if (!id || id === 'unknown') return 'Unknown Courier';

  return options.value.couriers.find(courier => courier.id === id)?.name || 'Courier';
};
const results = computed(() => report.value?.results || { summary: {}, totals: {} });
const zeroDcCount = computed(() => Number(results.value.summary?.zero_dc_count || 0));
const courierBreakdown = computed(() => Array.isArray(results.value.courier_breakdown) ? results.value.courier_breakdown : []);
const statusChart = computed(() => {
  const summary = results.value.summary || {};
  const rows = [
    { label: 'Delivered', value: Number(summary.delivered_count || 0), color: '#16a34a' },
    { label: 'Returned', value: Number(summary.returned_count || 0), color: '#dc2626' },
    { label: 'Pending', value: Number(summary.pending_count || 0), color: '#d97706' },
  ];
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  return rows.map(item => ({
    ...item,
    percent: total ? Number(((item.value / total) * 100).toFixed(1)) : 0,
  }));
});
const statusDonutGradient = computed(() => {
  let start = 0;
  const segments = statusChart.value
    .filter(item => item.percent > 0)
    .map((item) => {
      const end = start + item.percent;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

  return segments.length ? `conic-gradient(${segments.join(', ')})` : '#e2e8f0';
});
const costBreakdown = computed(() => {
  const totals = results.value.totals || {};
  const rows = [
    { label: 'Delivered Product Cost', value: Number(totals.total_product_cost || 0), color: '#2563eb' },
    { label: 'Dispatched Delivery + Fuel + GST', value: Number(totals.total_dc || 0) + Number(totals.total_fuel || 0) + Number(totals.total_gst || 0), color: '#0891b2' },
    { label: 'Dispatched Packing', value: Number(totals.total_packing || 0), color: '#7c3aed' },
    { label: 'Delivered Courier Tax', value: Number(totals.total_tax || 0), color: '#db2777' },
    { label: 'Ads + Tax', value: Number(totals.total_ad_with_tax || 0), color: '#ea580c' },
    { label: 'Custom Expenses', value: Number(totals.total_extra_expenses || 0) + Number(totals.total_one_time_expenses || 0), color: '#475569' },
  ].filter(item => item.value > 0);
  const max = Math.max(...rows.map(item => item.value), 1);
  return rows.map(item => ({
    ...item,
    percent: Math.max(4, Number(((item.value / max) * 100).toFixed(2))),
  }));
});
const topProductCosts = computed(() => {
  const rows = [...(report.value?.products || [])]
    .map(product => ({
      ...product,
      total_cost: Number(product.total_cost || 0),
    }))
    .filter(product => product.total_cost > 0)
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 8);
  const max = Math.max(...rows.map(item => item.total_cost), 1);
  return rows.map(item => ({
    ...item,
    percent: Math.max(4, Number(((item.total_cost / max) * 100).toFixed(2))),
  }));
});

onMounted(async () => {
  try {
    const [res, optionsRes] = await Promise.all([
      OverallProfitLossService.getReport(route.params.id),
      ProfitLossCalculationService.getOptions(),
    ]);
    report.value = res.data.data.report;
    options.value = optionsRes.data.data.options;
  } catch {
    router.push('/overall-profit-loss');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.header-panel,
.table-section,
.cards article {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.header-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  margin-bottom: 18px;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #0f172a;
  font-size: 21px;
}

p {
  margin-top: 5px;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.primary-btn,
.secondary-btn {
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.primary-btn {
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
}

.secondary-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.result-panel {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-bottom: 18px;
  border-radius: 8px;
  background: #14532d;
  color: #fff;
  padding: 20px;
  text-align: center;
}

.result-panel.loss {
  background: #991b1b;
}

.result-panel span {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.result-panel strong {
  font-size: 30px;
}

.zero-dc-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  border-radius: 999px;
  background: #fee2e2;
  color: #0f172a;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.zero-dc-badge svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.input-cards {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.cards article {
  padding: 16px;
}

.cards span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.cards strong {
  display: block;
  margin-top: 7px;
  color: #0f172a;
  font-size: 20px;
}

.cards small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 18px;
  margin-bottom: 18px;
}

.chart-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.chart-card header {
  padding: 15px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.chart-card h2 {
  color: #0f172a;
  font-size: 15px;
}

.wide-chart {
  grid-column: 1 / -1;
}

.donut-layout {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  padding: 18px;
}

.donut {
  position: relative;
  display: grid;
  place-items: center;
  width: 168px;
  height: 168px;
  border-radius: 50%;
}

.donut::after {
  position: absolute;
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: #fff;
  content: '';
}

.donut span {
  position: relative;
  z-index: 1;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.legend-list {
  display: grid;
  gap: 8px;
  margin: 0;
}

.legend-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f1f5f9;
  padding: 7px 0;
}

.legend-list dt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend-list i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.legend-list small {
  color: #64748b;
  font-weight: 800;
}

.bar-list {
  display: grid;
  gap: 13px;
  padding: 16px;
}

.bar-row {
  display: grid;
  gap: 7px;
}

.bar-row > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.bar-row span {
  min-width: 0;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-row strong {
  color: #0f172a;
  font-size: 13px;
  white-space: nowrap;
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
}

.empty-chart {
  margin: 0;
  padding: 14px;
  color: #64748b;
  text-align: center;
}

.table-section {
  overflow: hidden;
  margin-bottom: 18px;
}

.table-section h2 {
  padding: 16px 18px;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
  font-size: 16px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

th,
td {
  padding: 13px 14px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 14px;
}

th {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
}

td .product-name,
td small {
  display: block;
}

td .product-name {
  color: #0f172a;
  font-weight: 600;
}

.source-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 900;
}

.source-badge.inventory {
  background: #dcfce7;
  color: #166534;
}

.source-badge.manual {
  background: #f1f5f9;
  color: #475569;
}

.expense-grid,
.calc-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 16px;
}

.calc-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.expense-grid article,
.calc-grid article {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}

.expense-grid h3,
.calc-grid h3 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 14px;
}

dl {
  margin: 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

dl div:last-child {
  border-bottom: 0;
}

dt,
dd {
  margin: 0;
  font-size: 13px;
}

dt {
  color: #64748b;
  font-weight: 800;
}

dd {
  color: #0f172a;
  font-weight: 900;
}

dl div.highlight {
  margin-top: 4px;
  border-bottom: 0;
  background: #f1f5f9;
  border-radius: 6px;
  padding: 10px;
}

.positive {
  color: #16a34a;
}

.negative {
  color: #dc2626;
}

.warning {
  color: #d97706;
}

td small {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.loading {
  color: #64748b;
}

@media (max-width: 950px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .expense-grid,
  .calc-grid,
  .chart-grid,
  .donut-layout {
    grid-template-columns: 1fr;
  }

  .wide-chart {
    grid-column: auto;
  }

  .donut {
    justify-self: center;
  }
}
</style>
