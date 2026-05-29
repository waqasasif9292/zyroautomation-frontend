<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="show" class="panel-backdrop" @click.self="$emit('close')">
        <aside class="slide-panel">
          <header class="panel-head">
            <div><h2>Add Payment</h2><p>Record vendor payment or advance.</p></div>
            <button type="button" class="icon-close" @click="$emit('close')">×</button>
          </header>
          <form class="panel-body" @submit.prevent="submit">
            <label><span>Vendor</span><select v-model="form.vendor_id" required><option value="">Select vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
            <label><span>Link to Invoice</span><select v-model="form.invoice_id"><option value="">No specific invoice (lump sum)</option><option v-for="invoice in invoiceOptions" :key="invoice.id" :value="invoice.id">{{ invoice.invoice_number || 'Invoice' }} · Balance: PKR {{ money(invoice.balance) }}</option></select></label>
            <label><span>Amount</span><input v-model.number="form.amount" type="number" min="0.01" step="0.01" required></label>
            <label><span>Payment Method</span><select v-model="form.payment_method" required><option v-for="method in methods" :key="method.value" :value="method.value">{{ method.label }}</option></select></label>
            <label><span>Payment Date</span><input v-model="form.payment_date" type="date" required></label>
            <label><span>Reference</span><input v-model="form.reference"></label>
            <label><span>Notes</span><textarea v-model="form.notes" rows="2"></textarea></label>
            <footer class="panel-actions"><button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button><button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Payment' }}</button></footer>
          </form>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';

const props = defineProps({ show: Boolean, vendors: { type: Array, default: () => [] }, invoices: { type: Array, default: () => [] }, vendorId: { type: String, default: '' }, invoiceId: { type: String, default: '' }, saving: Boolean });
const emit = defineEmits(['close', 'save']);
const methods = [{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'easypaisa', label: 'EasyPaisa' }, { value: 'jazzcash', label: 'JazzCash' }, { value: 'cheque', label: 'Cheque' }, { value: 'other', label: 'Other' }];
const today = () => new Date().toISOString().slice(0, 10);
const form = reactive({ vendor_id: '', invoice_id: '', amount: 0, payment_method: 'cash', payment_date: today(), reference: '', notes: '' });
const invoiceOptions = computed(() => props.invoices.filter(invoice => (!form.vendor_id || invoice.vendor_id === form.vendor_id) && Number(invoice.balance || 0) > 0));
const money = value => Number(value || 0).toLocaleString();

watch(() => [props.show, props.vendorId, props.invoiceId], () => {
  Object.assign(form, { vendor_id: props.vendorId || '', invoice_id: props.invoiceId || '', amount: 0, payment_method: 'cash', payment_date: today(), reference: '', notes: '' });
}, { immediate: true });

watch(() => form.vendor_id, () => {
  if (form.invoice_id && !invoiceOptions.value.some(invoice => invoice.id === form.invoice_id)) form.invoice_id = '';
});

const submit = () => emit('save', { ...form, invoice_id: form.invoice_id || null });
</script>

<style scoped>
@import './vendor-panel.css';
</style>
