<template>
  <div class="filters-bar">
    <div class="filters-left">
      <select class="filter-control" :value="filters.brand_id || ''" @change="$emit('brand-change', $event.target.value || null)">
        <option value="">All Brands</option>
        <option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
      </select>

      <div class="search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="localSearch"
          class="search-input"
          type="text"
          placeholder="Search by order #, name, or phone..."
        >
        <button v-if="localSearch" class="clear-search" type="button" @click="clearSearch">×</button>
      </div>
    </div>

    <span class="results-count">{{ total }} {{ total === 1 ? 'order' : 'orders' }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  brands: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['brand-change', 'search-change']);
const localSearch = ref(props.filters.search || '');
let searchTimer = null;

watch(() => props.filters.search, (value) => {
  if ((value || '') !== localSearch.value) {
    localSearch.value = value || '';
  }
});

watch(localSearch, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => emit('search-change', value), 400);
});

const clearSearch = () => {
  localSearch.value = '';
};
</script>

<style scoped>
.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.filters-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-control,
.search-input {
  height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 14px;
  outline: none;
}

.filter-control {
  min-width: 150px;
  padding: 0 32px 0 10px;
}

.filter-control:focus,
.search-input:focus {
  border-color: #1e293b;
}

.search-wrap {
  position: relative;
  width: 280px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 11px;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0 32px 0 34px;
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 7px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.results-count {
  color: #64748b;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .filters-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .filters-left,
  .filter-control,
  .search-wrap {
    width: 100%;
  }
}
</style>
