<template>
  <aside class="results-panel">
    <section class="summary" :class="{ loss: calculations.profit < 0 }">
      <span>{{ calculations.profit >= 0 ? 'Estimated Monthly Profit' : 'Estimated Monthly Loss' }}</span>
      <strong>{{ formatMoney(calculations.profit) }}</strong>
    </section>

    <section v-for="group in groups" :key="group.title" class="result-group">
      <h2>{{ group.title }}</h2>
      <dl>
        <div v-for="item in group.items" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd :class="item.className">{{ item.money ? formatMoney(item.value) : formatNumber(item.value) }}</dd>
        </div>
      </dl>
    </section>
  </aside>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  calculations: {
    type: Object,
    required: true,
  },
});

const groups = computed(() => [
  {
    title: 'Ad Spend',
    items: [
      { label: 'Monthly Ad Spend', value: props.calculations.monthly_ad_spend, money: true },
      { label: 'Ad Spend After Tax', value: props.calculations.ad_spend_after_tax, money: true },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'Total Orders', value: props.calculations.total_orders },
      { label: 'Orders Per Day', value: props.calculations.orders_per_day },
      { label: 'Cancel Orders', value: props.calculations.cancel_orders, className: 'danger' },
      { label: 'Dispatched Orders', value: props.calculations.dispatched_orders },
    ],
  },
  {
    title: 'Returns & Delivery',
    items: [
      { label: 'Return Orders', value: props.calculations.return_orders, className: 'warning' },
      { label: 'Delivered Orders', value: props.calculations.delivered_orders, className: 'success' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Total Sales', value: props.calculations.total_sales, money: true },
      { label: 'Delivered Sales', value: props.calculations.delivered_sales, money: true, className: 'success' },
    ],
  },
  {
    title: 'Cost Breakdown',
    items: [
      { label: 'Total Product Cost', value: props.calculations.total_product_cost, money: true },
      { label: 'Total Bulity Cost', value: props.calculations.total_bulity_cost, money: true },
      { label: 'Total Packing Cost', value: props.calculations.total_packing_cost, money: true },
      { label: 'Total DC Cost', value: props.calculations.total_delivery_cost, money: true },
      { label: 'Total Ad Cost', value: props.calculations.total_ad_cost, money: true },
      { label: 'Tax Amount', value: props.calculations.tax_amount, money: true },
    ],
  },
]);

const rounded = (value) => Math.round(Number(value || 0));
const formatNumber = (value) => rounded(value).toLocaleString();
const formatMoney = (value) => `PKR ${rounded(value).toLocaleString()}`;
</script>

<style scoped>
.results-panel {
  display: grid;
  gap: 12px;
  align-content: start;
}

.summary,
.result-group {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.summary {
  padding: 20px;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.summary.loss {
  border-color: #fecaca;
  background: #fef2f2;
}

.summary span {
  display: block;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.summary strong {
  display: block;
  margin-top: 4px;
  color: #15803d;
  font-size: 28px;
  line-height: 1.1;
}

.summary.loss strong {
  color: #dc2626;
}

.result-group {
  overflow: hidden;
}

.result-group h2 {
  margin: 0;
  padding: 11px 14px;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}

dl {
  margin: 0;
  padding: 8px 14px;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 7px 0;
  border-bottom: 1px solid #f1f5f9;
}

dl div:last-child {
  border-bottom: 0;
}

dt {
  color: #64748b;
  font-size: 13px;
}

dd {
  margin: 0;
  color: #1e293b;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
}

.success {
  color: #16a34a;
}

.warning {
  color: #d97706;
}

.danger {
  color: #dc2626;
}
</style>
