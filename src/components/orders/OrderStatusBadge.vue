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
  HOLD: 'On Hold',
  Hold: 'On Hold',
  'On Hold': 'On Hold',
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
  voided: 'Voided',
  partially_paid: 'Partially paid',
  partially_refunded: 'Partially refunded',
};

const statusText = computed(() => {
  if (typeof props.status === 'string') return props.status;
  if (typeof props.status === 'number') return String(props.status);
  if (props.status && typeof props.status === 'object') {
    return props.status.name || props.status.label || props.status.title || props.status.status || props.status.message || props.status.text || '';
  }
  return '';
});
const label = computed(() => labels[statusText.value] || statusText.value || '—');
const statusClass = computed(() => `status-${(statusText.value || 'unknown').toLowerCase().replace(/\s+/g, '-')}`);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-pending-confirmation,
.status-pending { background: #fef3c7; color: #92400e; }
.status-cancel-by-shipper { background: #fee2e2; color: #991b1b; }
.status-hold,
.status-on-hold { background: #f1f5f9; color: #475569; }
.status-paid { background: #dcfce7; color: #166534; }
.status-refunded,
.status-partially_refunded { background: #fee2e2; color: #991b1b; }
.status-voided,
.status-unknown { background: #f1f5f9; color: #64748b; }
.status-partially_paid { background: #dbeafe; color: #1e40af; }
</style>
