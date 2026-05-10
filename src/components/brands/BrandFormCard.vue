<template>
  <div class="content-panel">
    <div class="panel-header">
      <h2 class="panel-title">{{ title }}</h2>
      <p class="panel-subtitle">{{ subtitle }}</p>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<style scoped>
.content-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  padding: 24px 28px 20px;
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

.panel-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
</style>
