<template>
  <div class="empty-state">
    <svg v-if="variant === 'filtered'" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
    <p class="empty-title">{{ variant === 'filtered' ? 'No orders found' : 'No orders yet' }}</p>
    <p class="empty-sub">
      {{ variant === 'filtered' ? 'Try adjusting your filters or search term.' : 'Orders will appear here once your Shopify webhook starts sending data.' }}
    </p>
    <button v-if="variant === 'filtered'" class="clear-btn" @click="$emit('clear')">Clear Filters</button>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'empty',
  },
});

defineEmits(['clear']);
</script>

<style scoped>
.empty-state {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  text-align: center;
}

.empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.empty-sub {
  margin: 0;
  max-width: 360px;
  font-size: 14px;
  color: #64748b;
}

.clear-btn {
  margin-top: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
