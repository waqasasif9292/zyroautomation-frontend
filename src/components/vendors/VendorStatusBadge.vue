<template>
  <span :class="['vendor-status', tone, { pulse }]">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  type: { type: String, default: 'invoice' },
  status: { type: String, default: '' },
});

const labels = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  in_transit: 'In Transit',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  received: 'Received',
  issue: 'Issue',
  complete: 'Complete',
  partial: 'Partial',
  damaged: 'Damaged',
  mixed: 'Mixed',
};

const label = computed(() => labels[props.status] || props.status || 'Unknown');
const pulse = computed(() => props.status === 'ready_for_pickup');
const tone = computed(() => {
  if (['paid', 'received', 'complete'].includes(props.status)) return 'green';
  if (['partially_paid', 'ready_for_pickup', 'partial'].includes(props.status)) return 'amber';
  if (['unpaid', 'issue', 'damaged', 'mixed'].includes(props.status)) return 'red';
  if (props.status === 'picked_up') return 'purple';
  return 'blue';
});
</script>

<style scoped>
.vendor-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 850;
  white-space: nowrap;
}

.green { background: #dcfce7; color: #166534; }
.amber { background: #fef3c7; color: #92400e; }
.red { background: #fee2e2; color: #991b1b; }
.blue { background: #dbeafe; color: #1e40af; }
.purple { background: #ede9fe; color: #5b21b6; }

.pulse {
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.28); }
  50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
}
</style>
