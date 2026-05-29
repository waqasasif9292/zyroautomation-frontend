<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="show" class="panel-backdrop" @click.self="$emit('close')">
        <aside class="slide-panel">
          <header class="panel-head">
            <div><h2>{{ invoice?.id ? 'Edit Invoice' : 'Add Invoice' }}</h2><p>Purchase invoice and line items.</p></div>
            <button type="button" class="icon-close" @click="$emit('close')">×</button>
          </header>
          <form class="panel-body" @submit.prevent="submit">
            <label><span>Vendor</span><select v-model="form.vendor_id" required><option value="">Select vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
            <label><span>Invoice Number</span><input v-model="form.invoice_number"></label>
            <div class="field-row"><label><span>Invoice Date</span><input v-model="form.invoice_date" type="date" required></label><label><span>Due Date</span><input v-model="form.due_date" type="date"></label></div>
            <label><span>Notes</span><textarea v-model="form.notes" rows="2"></textarea></label>
            <VendorLineItemsEditor v-model="form.items" mode="invoice" />
            <div class="running-total">Total: PKR {{ money(total) }}</div>
            <footer class="panel-actions"><button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button><button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Invoice' }}</button></footer>
          </form>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import VendorLineItemsEditor from './VendorLineItemsEditor.vue';

const props = defineProps({ show: Boolean, invoice: Object, vendors: { type: Array, default: () => [] }, vendorId: { type: String, default: '' }, saving: Boolean });
const emit = defineEmits(['close', 'save']);
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ vendor_id: props.vendorId || '', invoice_number: '', invoice_date: today(), due_date: '', notes: '', items: [{ product_name: '', quantity: 1, unit_price: 0 }] });
const form = reactive(blank());
const total = computed(() => form.items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0));
const money = value => Number(value || 0).toLocaleString();

watch(() => [props.show, props.invoice, props.vendorId], () => {
  Object.assign(form, blank(), props.invoice ? { ...props.invoice, items: (props.invoice.items || []).map(item => ({ ...item })) } : {});
  if (!form.vendor_id && props.vendorId) form.vendor_id = props.vendorId;
}, { immediate: true });

const submit = () => emit('save', { ...form, items: form.items.map(item => ({ ...item })) });
</script>

<style scoped>
@import './vendor-panel.css';
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.running-total { align-self: flex-end; color: #172554; font-size: 16px; font-weight: 900; }
</style>
