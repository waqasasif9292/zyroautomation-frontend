<template>
  <div class="empty-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
    <p class="empty-title">No products yet</p>
    <p class="empty-sub">Create products to track inventory, cost, and sale pricing.</p>
    <button class="empty-btn" type="button" @click="$emit('add')">Add Product</button>
  </div>
</template>

<script setup>
defineEmits(['add']);
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
  color: #374151;
  font-size: 16px;
  font-weight: 700;
}

.empty-sub {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.empty-btn {
  margin-top: 8px;
  border: none;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  padding: 9px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
