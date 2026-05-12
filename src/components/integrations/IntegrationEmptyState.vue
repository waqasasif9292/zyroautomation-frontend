<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20" />
        <path d="M5 9l7-7 7 7" />
      </svg>
    </div>
    <h3>No integrations yet</h3>
    <p>Connect a courier service to get started.</p>
    <slot></slot>
  </div>
</template>

<style scoped>
.empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 40px 20px;
}

.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

h3 {
  font-size: 16px;
  color: #374151;
  margin: 0;
}

p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
}
</style>
