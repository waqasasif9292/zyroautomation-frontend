<template>
  <AppLayout>
    <main class="page">
      <div v-if="loading" class="loading">Loading calculation...</div>
      <template v-else-if="calculation">
        <section class="header-panel">
          <div>
            <h1>{{ calculation.name }}</h1>
            <p>{{ calculation.start_date }} to {{ calculation.end_date }}</p>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" type="button" @click="router.push('/profit-loss-calculations')">Back</button>
            <button class="primary-btn" type="button" @click="router.push(`/profit-loss-calculations/${calculation.id}/edit`)">Edit</button>
          </div>
        </section>

        <div class="layout">
          <section class="main-panel">
            <div class="cards">
              <article v-for="card in cards" :key="card.label" class="summary-card">
                <div>
                  <span>{{ card.label }}</span>
                  <strong>
                    {{ card.value }}
                    <small v-if="card.percent" :class="card.tone">{{ card.percent }}</small>
                  </strong>
                </div>
                <div :class="['card-icon', card.tone]" v-html="card.icon"></div>
              </article>
            </div>

            <section class="table-section">
              <h2>Courier Performance</h2>
              <table>
                <thead>
                  <tr>
                    <th>Courier</th>
                    <th>Dispatched</th>
                    <th>Delivered</th>
                    <th>Returned</th>
                    <th>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="courier in calculation.results.couriers" :key="courier.name">
                    <td>{{ courier.name }}</td>
                    <td>{{ number(courier.dispatched) }}</td>
                    <td>{{ number(courier.delivered) }} ({{ percent(courier.delivered_percentage) }})</td>
                    <td>{{ number(courier.returned) }} ({{ percent(courier.returned_percentage) }})</td>
                    <td>{{ number(courier.pending) }} ({{ percent(courier.pending_percentage) }})</td>
                  </tr>
                  <tr v-if="!calculation.results.couriers.length">
                    <td colspan="5">No dispatched courier data found.</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="table-section">
              <h2>Delivered Orders</h2>
              <OrderTable :rows="calculation.results.details.delivered" mode="delivered" />
            </section>

            <section class="table-section">
              <h2>Returned Orders</h2>
              <OrderTable :rows="calculation.results.details.returned" mode="returned" />
            </section>

            <section class="table-section">
              <h2>Pending Orders</h2>
              <OrderTable :rows="calculation.results.details.pending" mode="pending" />
            </section>
          </section>

          <ProfitLossResultsPanel :results="calculation.results" />
        </div>
      </template>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProfitLossResultsPanel from '../../components/profit-loss/ProfitLossResultsPanel.vue';
import { useProfitLossCalculationStore } from '../../stores/profitLossCalculationStore';

const OrderTable = defineComponent({
  props: { rows: { type: Array, default: () => [] }, mode: { type: String, default: 'delivered' } },
  setup(props) {
    const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
    return () => h('div', { class: 'detail-table-wrap' }, [
      h('table', { class: 'detail-table' }, [
        h('thead', h('tr', [
          'Order', 'Status', 'Courier', 'Qty', 'COD', 'DC', 'Fuel', 'GST',
          props.mode === 'returned' ? 'Loss' : props.mode === 'pending' ? 'Pending COD' : 'Profit',
        ].map(label => h('th', label)))),
        h('tbody', props.rows.length
          ? props.rows.map(row => h('tr', [
            h('td', { class: 'order-cell' }, row.order_name || row.id),
            h('td', row.status),
            h('td', row.courier_name || 'Unassigned'),
            h('td', { class: 'number-cell' }, Number(row.quantity || 0).toLocaleString()),
            h('td', { class: 'money-cell' }, money(row.sale_price)),
            h('td', { class: 'money-cell' }, money(row.dc)),
            h('td', { class: 'money-cell' }, money(row.fuel)),
            h('td', { class: 'money-cell' }, money(row.gst)),
            h('td', { class: ['money-cell', props.mode === 'delivered' && row.profit >= 0 ? 'success' : 'danger'] }, money(row.loss ?? row.profit ?? row.sale_price)),
          ]))
          : h('tr', h('td', { class: 'empty-cell', colspan: 9 }, 'No orders found.'))),
      ]),
    ]);
  },
});

const router = useRouter();
const route = useRoute();
const store = useProfitLossCalculationStore();
const calculation = ref(null);
const loading = ref(true);
const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();
const percent = (value) => `${Number(value || 0).toLocaleString()}%`;

const cards = computed(() => {
  const summary = calculation.value?.results?.summary || {};
  const dispatchedPercentage = summary.total_orders
    ? percent((Number(summary.dispatched_count || 0) / Number(summary.total_orders || 1)) * 100)
    : '';
  return [
    { label: 'Total Orders', value: number(summary.total_orders), tone: 'total', icon: icons.box },
    { label: 'Dispatched', value: number(summary.dispatched_count), percent: dispatchedPercentage, tone: 'dispatched', icon: icons.send },
    { label: 'Delivered', value: number(summary.delivered_count), percent: percent(summary.delivered_percentage), tone: 'delivered', icon: icons.check },
    { label: 'Returned', value: number(summary.returned_count), percent: percent(summary.returned_percentage), tone: 'returned', icon: icons.returned },
    { label: 'Pending', value: number(summary.pending_count), percent: percent(summary.pending_percentage), tone: 'pending', icon: icons.clock },
    { label: 'Cancelled', value: number(summary.cancelled_count), percent: percent(summary.cancelled_percentage), tone: 'cancelled', icon: icons.x },
  ];
});

const icons = {
  box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8.5 12 4 4 8.5v7L12 20l8-4.5v-7Z"/><path d="M8 6.5v5l4 2.2 4-2.2v-5"/><path d="M4.4 8.7 12 13l7.6-4.3"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-8.5 18-2.4-7.1L3 11.5 21 3Z"/><path d="m10.1 13.9 4.6-4.6"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4L18 8"/></svg>',
  returned: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H5v4"/><path d="M5 11a8 8 0 1 1 2.4 5.7"/><path d="m5 7 5.2 5.2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/><path d="M7 3 4 6"/><path d="m17 3 3 3"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 9 6 6"/><path d="m15 9-6 6"/></svg>',
};

onMounted(async () => {
  try {
    calculation.value = await store.fetchCalculation(route.params.id);
  } catch {
    router.push('/profit-loss-calculations');
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
.main-panel,
.table-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
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

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 18px;
  align-items: start;
}

.main-panel {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 88px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}

.cards span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.cards strong {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 7px;
  color: #0f172a;
  font-size: 18px;
}

.cards small {
  font-size: 11px;
  font-weight: 800;
}

.card-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  color: #fff;
}

.card-icon :deep(svg) {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.card-icon.total {
  background: #6d5de7;
}

.card-icon.dispatched {
  background: #0ea5e9;
}

.card-icon.delivered {
  background: #2dd4bf;
}

.card-icon.returned {
  background: linear-gradient(135deg, #ff674d, #fb923c);
}

.card-icon.pending {
  background: linear-gradient(135deg, #22d3ee, #0f8de8);
}

.card-icon.cancelled {
  background: #ff4046;
}

small.delivered,
small.dispatched {
  color: #16a34a;
}

small.returned,
small.cancelled {
  color: #ef4444;
}

small.pending {
  color: #0284c7;
}

.table-section {
  overflow: hidden;
}

.table-section h2 {
  padding: 15px 16px;
  color: #0f172a;
  font-size: 15px;
  border-bottom: 1px solid #e2e8f0;
}

table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 11px 14px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 13px;
}

th {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

:deep(.detail-table-wrap) {
  width: 100%;
  overflow-x: auto;
}

:deep(.detail-table) {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  table-layout: fixed;
}

:deep(.detail-table th),
:deep(.detail-table td) {
  padding: 11px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 13px;
  text-align: left;
  vertical-align: middle;
}

:deep(.detail-table th) {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  background: #f8fafc;
}

:deep(.detail-table tbody tr:hover) {
  background: #f9fafb;
}

:deep(.detail-table th:nth-child(1)),
:deep(.detail-table td:nth-child(1)) {
  width: 150px;
}

:deep(.detail-table th:nth-child(2)),
:deep(.detail-table td:nth-child(2)) {
  width: 120px;
}

:deep(.detail-table th:nth-child(3)),
:deep(.detail-table td:nth-child(3)) {
  width: 105px;
}

:deep(.detail-table th:nth-child(4)),
:deep(.detail-table td:nth-child(4)) {
  width: 58px;
}

:deep(.detail-table .order-cell) {
  color: #0f172a;
  font-weight: 800;
  overflow-wrap: anywhere;
}

:deep(.detail-table .number-cell),
:deep(.detail-table .money-cell) {
  white-space: nowrap;
}

:deep(.detail-table .empty-cell) {
  color: #64748b;
  font-weight: 700;
  text-align: center;
}

:deep(.success) {
  color: #16a34a;
}

:deep(.danger) {
  color: #dc2626;
}

.loading {
  border-radius: 8px;
  background: #fff;
  padding: 24px;
}

@media (max-width: 1150px) {
  .layout,
  .cards {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1151px) and (max-width: 1500px) {
  .cards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
