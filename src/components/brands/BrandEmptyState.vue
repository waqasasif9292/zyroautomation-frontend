<template>
  <div class="empty-state">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
    <p class="empty-title">No brands yet</p>
    <p class="empty-sub">Add your first brand to get started.</p>
    <button type="button" class="btn-add" @click="$emit('add')">+ Add Brand</button>
  </div>
</template>

<script setup>
defineEmits(['add']);
</script>

<style scoped>
.empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.empty-sub {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.btn-add {
  margin-top: 6px;
  padding: 9px 18px;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-add:hover {
  background: #1f2937;
}
</style>
