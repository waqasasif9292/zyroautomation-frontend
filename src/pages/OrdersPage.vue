<template>
  <AppLayout>
    <div class="page-body">
      <div class="content-panel">
        <div class="panel-header">
          <h2 class="panel-title">Orders</h2>
          <p class="panel-subtitle">Your orders will appear here.</p>
        </div>
        <div class="empty-body">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p class="empty-title">Coming soon</p>
          <p class="empty-sub">Order management is under development.</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../layouts/AppLayout.vue';
</script>

<style scoped>
.page-body {
  padding: 36px;
}

.content-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  padding: 20px 28px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.panel-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.empty-body {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
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
</style>
