<template>
  <section class="detail-section">
    <h3>{{ title }}</h3>
    <div class="rows">
      <div v-for="row in rows" :key="row.label" class="detail-row">
        <span>{{ row.label }}</span>
        <strong>{{ row.value || '—' }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  rows: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.detail-section {
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid #f1f5f9;
}

.detail-section:first-child {
  padding-top: 0;
  margin-top: 0;
  border-top: none;
}

h3 {
  margin: 0 0 12px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 800;
}

.rows {
  display: grid;
  gap: 9px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  color: #64748b;
  font-size: 14px;
}

.detail-row strong {
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}
</style>
