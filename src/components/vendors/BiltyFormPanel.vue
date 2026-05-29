<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="show" class="panel-backdrop" @click.self="$emit('close')">
        <aside class="slide-panel">
          <header class="panel-head"><div><h2>{{ bilty?.id ? 'Edit Bilty' : 'Add Bilty' }}</h2><p>Cargo dispatch record.</p></div><button type="button" class="icon-close" @click="$emit('close')">×</button></header>
          <form class="panel-body" @submit.prevent="submit">
            <label><span>Vendor</span><select v-model="form.vendor_id" required><option value="">Select vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
            <label><span>Link to Invoice</span><select v-model="form.invoice_id"><option value="">No invoice</option><option v-for="invoice in invoiceOptions" :key="invoice.id" :value="invoice.id">{{ invoice.invoice_number || 'Invoice' }}</option></select></label>
            <label><span>Bilty Number</span><input v-model="form.bilty_number" required></label>
            <label><span>Transport Company</span><input v-model="form.transport_company"></label>
            <div class="field-row"><label><span>From City</span><input v-model="form.from_city"></label><label><span>To City</span><input v-model="form.to_city"></label></div>
            <div class="field-row"><label><span>Dispatch Date</span><input v-model="form.dispatch_date" type="date"></label><label><span>Expected Arrival</span><input v-model="form.expected_date" type="date"></label></div>
            <label><span>Status</span><select v-model="form.status"><option value="in_transit">In Transit</option><option value="ready_for_pickup">Ready for Pickup</option><option value="picked_up">Picked Up</option><option value="received">Received</option><option value="issue">Issue</option></select></label>
            <div v-if="['picked_up','received'].includes(form.status)" class="field-row"><label><span>Rider Name</span><input v-model="form.rider_name"></label><label><span>Pickup Date</span><input v-model="form.pickup_date" type="date"></label></div>
            <VendorLineItemsEditor v-model="form.items" mode="bilty" />
            <label><span>Notes</span><textarea v-model="form.notes" rows="2"></textarea></label>
            <footer class="panel-actions"><button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button><button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Bilty' }}</button></footer>
          </form>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import VendorLineItemsEditor from './VendorLineItemsEditor.vue';

const props = defineProps({ show: Boolean, bilty: Object, vendors: { type: Array, default: () => [] }, invoices: { type: Array, default: () => [] }, vendorId: { type: String, default: '' }, saving: Boolean });
const emit = defineEmits(['close', 'save']);
const blank = () => ({ vendor_id: props.vendorId || '', invoice_id: '', bilty_number: '', transport_company: '', from_city: '', to_city: '', dispatch_date: '', expected_date: '', pickup_date: '', rider_name: '', status: 'in_transit', items: [{ product_name: '', quantity: 1 }], notes: '' });
const form = reactive(blank());
const invoiceOptions = computed(() => props.invoices.filter(invoice => !form.vendor_id || invoice.vendor_id === form.vendor_id));

watch(() => [props.show, props.bilty, props.vendorId], () => {
  Object.assign(form, blank(), props.bilty ? { ...props.bilty, invoice_id: props.bilty.invoice_id || '', items: (props.bilty.items || []).map(item => ({ ...item })) } : {});
}, { immediate: true });

const submit = () => emit('save', { ...form, invoice_id: form.invoice_id || null, items: form.items.map(item => ({ ...item })) });
</script>

<style scoped>
@import './vendor-panel.css';
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
