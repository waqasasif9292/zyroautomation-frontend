<template>
  <div v-if="pagination && pagination.total > 0" class="pagination-row">
    <span class="pagination-summary">Showing {{ from }}-{{ to }} of {{ pagination.total }} orders</span>
    <div class="pagination-controls">
      <button class="page-btn" :disabled="!pagination.has_prev" @click="$emit('page-change', pagination.current_page - 1)">&lt; Prev</button>
      <button
        v-for="item in pageItems"
        :key="item.key"
        :class="['page-btn', { active: item.page === pagination.current_page, ellipsis: item.ellipsis }]"
        :disabled="item.ellipsis"
        @click="!item.ellipsis && $emit('page-change', item.page)"
      >
        {{ item.label }}
      </button>
      <button class="page-btn" :disabled="!pagination.has_next" @click="$emit('page-change', pagination.current_page + 1)">Next &gt;</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pagination: {
    type: Object,
    default: null,
  },
});

defineEmits(['page-change']);

const from = computed(() => ((props.pagination.current_page - 1) * props.pagination.per_page) + 1);
const to = computed(() => Math.min(props.pagination.current_page * props.pagination.per_page, props.pagination.total));

const pageItems = computed(() => {
  const total = props.pagination.total_pages;
  const current = props.pagination.current_page;
  const pages = new Set([1, total, current - 1, current, current + 1].filter(page => page >= 1 && page <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const items = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push({ key: `ellipsis-${page}`, label: '...', ellipsis: true });
    }
    items.push({ key: page, label: page, page });
  });

  return items;
});
</script>

<style scoped>
.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
}

.pagination-summary {
  color: #64748b;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.page-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.page-btn.active {
  background: #1e293b;
  border-color: #1e293b;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-btn.ellipsis {
  border-color: transparent;
  background: transparent;
}

@media (max-width: 760px) {
  .pagination-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
