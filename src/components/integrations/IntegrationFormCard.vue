<template>
  <div class="content-panel">
    <div class="panel-header">
      <h2 class="panel-title">{{ title }}</h2>
      <p class="panel-subtitle">{{ subtitle }}</p>
    </div>

    <div class="panel-body">
      <div v-if="loading" class="card-skeleton">
        <div class="skeleton-block" v-for="i in 4" :key="i"></div>
      </div>
      <div v-else>
        <slot></slot>
      </div>
    </div>

    <div class="panel-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  loading: { type: Boolean, default: false },
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
  font-size: 14px;
  color: #6b7280;
}

.panel-body {
  padding: 28px;
}

.panel-footer {
  padding: 0 28px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.card-skeleton {
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-block {
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: pulse 1.4s ease infinite;
}

@keyframes pulse {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
