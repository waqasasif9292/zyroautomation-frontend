<template>
  <section class="results-panel">
    <div class="hero-result" :class="{ loss: totals.final_profit < 0 }">
      <span>{{ totals.final_profit >= 0 ? 'Final Profit' : 'Final Loss' }}</span>
      <strong>{{ money(Math.abs(totals.final_profit)) }}</strong>
      <div v-if="zeroDcCount" class="zero-dc-badge">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.3 21a2 2 0 0 0 3.4 0" />
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        </svg>
        <span>{{ zeroDcCount }} {{ zeroDcCount === 1 ? 'order has' : 'orders have' }} 0 DC</span>
      </div>
    </div>

    <div class="breakdown">
      <h2>Profit/Loss Summary</h2>

      <section v-for="section in summarySections" :key="section.title" class="summary-section">
        <h3>{{ section.title }}</h3>
        <dl>
          <div v-for="row in section.rows" :key="row.label" :class="{ highlight: row.highlight }">
            <dt>
              {{ row.label }}
              <small v-if="row.note">{{ row.note }}</small>
            </dt>
            <dd :class="row.className">{{ row.value }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  results: {
    type: Object,
    default: () => ({ summary: {}, totals: {} }),
  },
});

const summary = computed(() => props.results.summary || {});
const totals = computed(() => props.results.totals || {});
const zeroDcCount = computed(() => Number(summary.value.zero_dc_count || 0));
const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const percent = (value) => `${Number(value || 0).toLocaleString()}%`;
const adTaxPercent = computed(() => {
  const spend = Number(totals.value.total_ad_spend || 0);
  if (!spend) return 0;
  return Number(((Number(totals.value.ads_tax_amount || 0) / spend) * 100).toFixed(2));
});

const summarySections = computed(() => [
  {
    title: 'Revenue & Costs',
    rows: [
      { label: 'Total Revenue (Delivered)', value: money(totals.value.total_revenue), className: 'positive' },
      { label: 'Total Product Cost', value: `-${money(totals.value.total_product_cost)}`, className: 'negative' },
      { label: 'Total Delivery Charges', value: `-${money(totals.value.total_dc)}`, className: 'negative' },
      { label: 'Total Fuel Surcharge', value: `-${money(totals.value.total_fuel)}`, className: 'negative' },
      { label: 'Total GST', value: `-${money(totals.value.total_gst)}`, className: 'negative' },
      { label: 'Total Packing', value: `-${money(totals.value.total_packing)}`, className: 'negative' },
      { label: 'Courier Withholding Tax', value: `-${money(totals.value.total_tax)}`, className: 'negative' },
      { label: 'Return Loss (DC + Packing)', value: `-${money(totals.value.total_return_loss)}`, className: 'negative' },
      {
        label: 'Profit Before Ads',
        value: money(totals.value.total_profit_before_ads),
        className: totals.value.total_profit_before_ads >= 0 ? 'positive' : 'negative',
        highlight: true,
      },
    ],
  },
  {
    title: 'Ads & Bank Charges',
    rows: [
      { label: 'Total Ad Spend', value: `-${money(totals.value.total_ad_spend)}`, className: 'negative' },
      { label: `Bank Charges (${adTaxPercent.value}% of ads)`, value: `-${money(totals.value.ads_tax_amount)}`, className: 'negative' },
      { label: 'Total Ads + Bank', value: `-${money(totals.value.total_ad_with_tax)}`, className: 'negative', highlight: true },
    ],
  },
  {
    title: 'Pending Amount',
    rows: [
      { label: 'Pending Orders Amount', value: money(totals.value.pending_amount), className: 'warning', note: 'Not included in profit calc' },
    ],
  },
]);
</script>

<style scoped>
.results-panel {
  display: grid;
  gap: 16px;
}

.hero-result {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 22px;
  border-radius: 8px;
  background: #14532d;
  color: #fff;
  text-align: center;
}

.hero-result.loss {
  background: #991b1b;
}

.hero-result span {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-result strong {
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

.breakdown {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.breakdown h2 {
  margin: 0;
  padding: 16px;
  color: #0f172a;
  font-size: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.summary-section {
  padding: 14px 16px 4px;
}

.summary-section h3 {
  margin: 0 0 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

dl {
  margin: 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 0;
  border-bottom: 1px solid #f1f5f9;
}

dl div:last-child {
  border-bottom: 0;
}

dl div.highlight {
  margin: 2px 0 0;
  border-bottom: 0;
  background: #d1d5db;
  padding: 10px 12px;
}

dt {
  display: grid;
  gap: 4px;
}

dt small {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-transform: none;
}

dd {
  margin: 0;
  color: #1e293b;
  font-size: 13px;
  font-weight: 900;
  text-align: right;
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

</style>
