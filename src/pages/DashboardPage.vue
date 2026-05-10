<template>
  <AppLayout>
    <div class="dashboard-body">
      <div class="dashboard-card">
        <h2 class="dashboard-title">Dashboard</h2>
        <p class="dashboard-sub">Welcome to Zyro Automation. This is your main dashboard.</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../layouts/AppLayout.vue';
</script>

<style scoped>
.dashboard-body {
  padding: 40px 36px;
}

.dashboard-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 32px;
}

.dashboard-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.dashboard-sub {
  font-size: 14px;
  color: #6b7280;
}
</style>
