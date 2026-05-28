<template>
  <span :class="['status-badge', statusClass]">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: [String, Number, Object],
    default: null,
  },
});

const labels = {
  'Pending Confirmation': 'Pending Confirmation',
  'cancel by shipper': 'Cancel by Shipper',
  cancel_by_shipper: 'Cancel by Shipper',
  HOLD: 'On Hold',
  Hold: 'On Hold',
  'On Hold': 'On Hold',
  hold: 'On Hold',
  pending: 'Pending',
  pending_confirmation: 'Pending Confirmation',
  duplicate: 'Duplicate',
  Duplicate: 'Duplicate',
  paid: 'Paid',
  refunded: 'Refunded',
  voided: 'Voided',
  partially_paid: 'Partially paid',
  partially_refunded: 'Partially refunded',
  merchant_warehouse: 'Merchant Warehouse',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out For Delivery',
  delivered: 'Delivered',
  ready_for_return: 'Ready For Return',
  returned_to_shipper: 'Returned to Shipper',
};

const statusText = computed(() => {
  if (typeof props.status === 'string') return props.status;
  if (typeof props.status === 'number') return String(props.status);
  if (props.status && typeof props.status === 'object') {
    return props.status.name || props.status.label || props.status.title || props.status.status || props.status.message || props.status.text || '';
  }
  return '';
});
const label = computed(() => {
  if (labels[statusText.value]) return labels[statusText.value];
  if (!statusText.value) return '—';
  return statusText.value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
});
const statusClass = computed(() => `status-${(statusText.value || 'unknown').toLowerCase().replace(/[\s_]+/g, '-')}`);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.status-pending-confirmation,
.status-pending { background: #fef3c7; color: #92400e; }
.status-cancel-by-shipper,
.status-duplicate,
.status-error,
.status-returned-to-shipper,
.status-ready-for-return { background: #fee2e2; color: #991b1b; }
.status-hold,
.status-on-hold,
.status-merchant-warehouse { background: #f1f5f9; color: #475569; }
.status-paid,
.status-delivered { background: #dcfce7; color: #166534; }
.status-dispatched,
.status-out-for-delivery { background: #dbeafe; color: #1e40af; }
.status-refunded,
.status-partially-refunded { background: #fee2e2; color: #991b1b; }
.status-voided,
.status-unknown { background: #f1f5f9; color: #64748b; }
.status-partially-paid { background: #dbeafe; color: #1e40af; }
</style>
