<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="show" class="panel-backdrop" @click.self="$emit('close')">
        <aside class="slide-panel">
          <header class="panel-head">
            <div>
              <h2>{{ title }}</h2>
              <p>{{ subtitle }}</p>
            </div>
            <button type="button" class="icon-close" @click="$emit('close')">×</button>
          </header>

          <div class="panel-body">
            <template v-if="type === 'invoice'">
              <div class="info-grid">
                <div><span>Vendor</span><strong>{{ record.vendor_name || '—' }}</strong></div>
                <div><span>Status</span><VendorStatusBadge :status="record.status" /></div>
                <div><span>Date</span><strong>{{ date(record.invoice_date) }}</strong></div>
                <div><span>Due Date</span><strong>{{ date(record.due_date) }}</strong></div>
              </div>
              <LineItemsReadOnly :items="record.items" mode="invoice" />
              <div class="totals">
                <div><span>Total</span><strong>PKR {{ money(record.total_amount) }}</strong></div>
                <div><span>Paid</span><strong>PKR {{ money(record.paid_amount) }}</strong></div>
                <div><span>Balance</span><strong>PKR {{ money(record.balance) }}</strong></div>
              </div>
              <section>
                <h3>Payments</h3>
                <p v-if="!payments.length" class="muted">No payments linked.</p>
                <div v-for="payment in payments" :key="payment.id" class="mini-row">
                  <span>{{ date(payment.payment_date) }}</span>
                  <strong>PKR {{ money(payment.amount) }}</strong>
                </div>
              </section>
              <button class="btn-primary" type="button" @click="$emit('add-payment', record)">+ Add Payment</button>
            </template>

            <template v-else-if="type === 'bilty'">
              <div class="info-grid">
                <div><span>Vendor</span><strong>{{ record.vendor_name || '—' }}</strong></div>
                <div><span>Status</span><VendorStatusBadge :status="record.status" /></div>
                <div><span>Transport</span><strong>{{ record.transport_company || '—' }}</strong></div>
                <div><span>Route</span><strong>{{ routeText }}</strong></div>
                <div><span>Dispatch</span><strong>{{ date(record.dispatch_date) }}</strong></div>
                <div><span>Expected</span><strong>{{ date(record.expected_date) }}</strong></div>
              </div>
              <LineItemsReadOnly :items="record.items" mode="bilty" />
            </template>

            <template v-else>
              <div class="info-grid">
                <div><span>Vendor</span><strong>{{ record.vendor_name || '—' }}</strong></div>
                <div><span>Status</span><VendorStatusBadge :status="record.receipt_status" /></div>
                <div><span>Date</span><strong>{{ date(record.receipt_date) }}</strong></div>
                <div><span>Rider</span><strong>{{ record.rider_name || '—' }}</strong></div>
              </div>
              <LineItemsReadOnly :items="record.items" mode="receipt" />
              <div class="totals">
                <div><span>Expected</span><strong>{{ money(record.total_expected) }}</strong></div>
                <div><span>Received</span><strong>{{ money(record.total_received) }}</strong></div>
                <div><span>Damaged</span><strong>{{ money(record.total_damaged) }}</strong></div>
                <div><span>Good</span><strong>{{ money(record.total_good) }}</strong></div>
              </div>
            </template>
          </div>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import VendorStatusBadge from './VendorStatusBadge.vue';

const props = defineProps({
  show: Boolean,
  type: { type: String, default: 'invoice' },
  record: { type: Object, default: () => ({}) },
  payments: { type: Array, default: () => [] },
});

defineEmits(['close', 'add-payment']);

const title = computed(() => {
  if (props.type === 'invoice') return props.record.invoice_number || 'Invoice';
  if (props.type === 'bilty') return props.record.bilty_number || 'Bilty';
  return 'Stock Receipt';
});
const subtitle = computed(() => {
  if (props.type === 'invoice') return 'Invoice detail and payment history.';
  if (props.type === 'bilty') return 'Cargo consignment detail.';
  return 'Goods received detail.';
});
const routeText = computed(() => `${props.record.from_city || '—'} → ${props.record.to_city || '—'}`);
const money = value => Number(value || 0).toLocaleString();
const date = value => value ? new Date(value).toLocaleDateString('en-GB') : '—';
</script>

<script>
const LineItemsReadOnly = {
  props: { items: { type: Array, default: () => [] }, mode: { type: String, default: 'invoice' } },
  methods: {
    money(value) { return Number(value || 0).toLocaleString(); },
  },
  template: `
    <div class="readonly-wrap">
      <table class="readonly-table">
        <thead>
          <tr>
            <th>Product</th>
            <th v-if="mode === 'receipt'">Expected</th>
            <th v-if="mode === 'receipt'">Received</th>
            <th v-if="mode === 'receipt'">Damaged</th>
            <th v-if="mode === 'receipt'">Good</th>
            <th v-if="mode !== 'receipt'">Qty</th>
            <th v-if="mode === 'invoice' || mode === 'receipt'">Unit Price</th>
            <th v-if="mode === 'invoice'">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="index">
            <td>{{ item.product_name }}</td>
            <td v-if="mode === 'receipt'">{{ money(item.expected_quantity) }}</td>
            <td v-if="mode === 'receipt'">{{ money(item.received_quantity) }}</td>
            <td v-if="mode === 'receipt'">{{ money(item.damaged_quantity) }}</td>
            <td v-if="mode === 'receipt'">{{ money(item.good_quantity) }}</td>
            <td v-if="mode !== 'receipt'">{{ money(item.quantity) }}</td>
            <td v-if="mode === 'invoice' || mode === 'receipt'">PKR {{ money(item.unit_price) }}</td>
            <td v-if="mode === 'invoice'">PKR {{ money(item.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
};

export default { components: { LineItemsReadOnly } };
</script>

<style scoped>
@import './vendor-panel.css';
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-grid div, .totals div { border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 12px; }
.info-grid span, .totals span { display: block; margin-bottom: 5px; color: #64748b; font-size: 11px; font-weight: 850; text-transform: uppercase; }
.info-grid strong, .totals strong { color: #172554; font-size: 14px; }
.totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.readonly-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
.readonly-table { width: 100%; min-width: 520px; border-collapse: collapse; }
.readonly-table th, .readonly-table td { padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 12px; text-align: left; }
.readonly-table th { background: #f8fafc; color: #64748b; font-weight: 850; }
h3 { margin: 0 0 8px; color: #172554; font-size: 15px; }
.mini-row { display: flex; justify-content: space-between; border-bottom: 1px solid #edf2f7; padding: 9px 0; color: #334155; }
.muted { color: #64748b; font-size: 13px; }
.btn-primary { align-self: flex-start; border: none; border-radius: 8px; background: #1e293b; color: #fff; cursor: pointer; font-size: 13px; font-weight: 850; padding: 10px 14px; }
</style>
