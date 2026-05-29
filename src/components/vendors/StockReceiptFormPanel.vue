<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="show" class="panel-backdrop" @click.self="$emit('close')">
        <aside class="slide-panel wide-panel">
          <header class="panel-head"><div><h2>{{ receipt?.id ? 'Edit Receipt' : 'Add Receipt' }}</h2><p>Goods received note.</p></div><button type="button" class="icon-close" @click="$emit('close')">×</button></header>
          <form class="panel-body" @submit.prevent="submit">
            <label><span>Vendor</span><select v-model="form.vendor_id" required><option value="">Select vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
            <div class="field-row"><label><span>Link to Bilty</span><select v-model="form.bilty_id"><option value="">No bilty</option><option v-for="bilty in biltyOptions" :key="bilty.id" :value="bilty.id">{{ bilty.bilty_number }}</option></select></label><label><span>Link to Invoice</span><select v-model="form.invoice_id"><option value="">No invoice</option><option v-for="invoice in invoiceOptions" :key="invoice.id" :value="invoice.id">{{ invoice.invoice_number || 'Invoice' }}</option></select></label></div>
            <div class="field-row"><label><span>Receipt Date</span><input v-model="form.receipt_date" type="date" required></label><label><span>Rider Name</span><input v-model="form.rider_name"></label></div>
            <VendorLineItemsEditor v-model="form.items" mode="receipt" />
            <div class="running-total">Expected: {{ summary.expected }} units · Received: {{ summary.received }} units · Damaged: {{ summary.damaged }} units · Good: {{ summary.good }} units</div>
            <label><span>Notes</span><textarea v-model="form.notes" rows="2"></textarea></label>
            <footer class="panel-actions"><button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button><button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Receipt' }}</button></footer>
          </form>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import VendorLineItemsEditor from './VendorLineItemsEditor.vue';

const props = defineProps({ show: Boolean, receipt: Object, vendors: { type: Array, default: () => [] }, invoices: { type: Array, default: () => [] }, bilties: { type: Array, default: () => [] }, vendorId: { type: String, default: '' }, saving: Boolean });
const emit = defineEmits(['close', 'save']);
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ vendor_id: props.vendorId || '', bilty_id: '', invoice_id: '', receipt_date: today(), rider_name: '', items: [{ product_name: '', expected_quantity: 0, received_quantity: 0, damaged_quantity: 0, unit_price: 0, notes: '' }], notes: '' });
const form = reactive(blank());
const invoiceOptions = computed(() => props.invoices.filter(invoice => !form.vendor_id || invoice.vendor_id === form.vendor_id));
const biltyOptions = computed(() => props.bilties.filter(bilty => !form.vendor_id || bilty.vendor_id === form.vendor_id));
const summary = computed(() => form.items.reduce((totals, item) => {
  const expected = Number(item.expected_quantity || 0);
  const received = Number(item.received_quantity || 0);
  const damaged = Number(item.damaged_quantity || 0);
  totals.expected += expected;
  totals.received += received;
  totals.damaged += damaged;
  totals.good += Math.max(received - damaged, 0);
  return totals;
}, { expected: 0, received: 0, damaged: 0, good: 0 }));

watch(() => [props.show, props.receipt, props.vendorId], () => {
  Object.assign(form, blank(), props.receipt ? { ...props.receipt, bilty_id: props.receipt.bilty_id || '', invoice_id: props.receipt.invoice_id || '', items: (props.receipt.items || []).map(item => ({ ...item })) } : {});
}, { immediate: true });

const submit = () => emit('save', { ...form, bilty_id: form.bilty_id || null, invoice_id: form.invoice_id || null, items: form.items.map(item => ({ ...item })) });
</script>

<style scoped>
@import './vendor-panel.css';
.wide-panel { width: min(520px, 100%); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.running-total { color: #172554; font-size: 13px; font-weight: 850; }
</style>
