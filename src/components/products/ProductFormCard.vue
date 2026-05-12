<template>
  <div class="form-card">
    <div class="form-header">
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>
    <div class="form-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
});
</script>

<style scoped>
.form-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.form-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.form-header h1 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
  font-weight: 800;
}

.form-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.form-body {
  display: grid;
  gap: 18px;
  padding: 26px 28px;
}
</style>
