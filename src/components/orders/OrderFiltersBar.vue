<template>
  <div class="filters-bar">
    <div class="filters-grid">
      <input
        v-model="draft.search"
        class="filter-control"
        type="text"
        placeholder="Search by id, name, contact"
        @keydown.enter="applyFilters"
      >

      <input
        v-model="draft.date_from"
        class="filter-control"
        type="date"
      >

      <input
        v-model="draft.date_to"
        class="filter-control"
        type="date"
      >

      <select v-model="draft.status" class="filter-control">
        <option value="">Select Status</option>
        <option value="hold">On Hold</option>
        <option value="pending_confirmation">Pending Confirmation</option>
        <option value="duplicate">Duplicate</option>
        <option value="cancel_by_shipper">Cancel by Shipper</option>
        <option value="error">Error</option>
        <option value="merchant_warehouse">Merchant Warehouse</option>
        <option value="dispatched">Dispatched</option>
        <option value="out_for_delivery">Out For Delivery</option>
        <option value="delivered">Delivered</option>
        <option value="ready_for_return">Ready For Return</option>
        <option value="returned_to_shipper">Returned to Shipper</option>
      </select>

      <select v-model="draft.brand_id" class="filter-control">
        <option value="">Select Shipper</option>
        <option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
      </select>

      <select v-model="draft.source" class="filter-control">
        <option value="">Select Source</option>
        <option v-for="source in sourceOptions" :key="source" :value="source">{{ source }}</option>
      </select>

      <select v-model="draft.courier_integration_id" class="filter-control">
        <option value="">Select Courier</option>
        <option v-for="integration in integrations" :key="integration.id" :value="integration.id">
          {{ integration.name }}
        </option>
      </select>

      <select v-model="draft.sort" class="filter-control">
        <option value="created_id_desc">DESC</option>
        <option value="created_id_asc">ASC</option>
        <option value="shopify_created_at_desc">Date DESC</option>
        <option value="shopify_created_at_asc">Date ASC</option>
      </select>

      <div class="filter-actions">
        <button class="btn-search" type="button" @click="applyFilters">Search</button>
        <button class="btn-clear" type="button" @click="clearFilters">Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  brands: {
    type: Array,
    default: () => [],
  },
  integrations: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['apply', 'clear']);

const filterSnapshot = () => ({
  brand_id: props.filters.brand_id || '',
  courier_integration_id: props.filters.courier_integration_id || '',
  date_from: props.filters.date_from || '',
  date_to: props.filters.date_to || '',
  search: props.filters.search || '',
  sort: props.filters.sort || 'created_id_desc',
  source: props.filters.source || '',
  status: props.filters.status || '',
});

const draft = reactive(filterSnapshot());

const sourceOptions = computed(() => {
  const defaults = ['Website', 'WhatsApp', 'Abandoned', 'Social'];
  const brandSources = props.brands.flatMap(brand => brand.sources || []);
  return [...new Set([...defaults, ...brandSources].filter(Boolean))];
});

watch(() => props.filters, () => {
  Object.assign(draft, filterSnapshot());
}, { deep: true });

const appliedPayload = () => ({
  brand_id: draft.brand_id || null,
  courier_integration_id: draft.courier_integration_id || null,
  date_from: draft.date_from || null,
  date_to: draft.date_to || null,
  search: draft.search.trim(),
  sort: draft.sort || 'created_id_desc',
  source: draft.source || null,
  status: draft.status || null,
});

const applyFilters = () => {
  emit('apply', appliedPayload());
};

const clearFilters = () => {
  Object.assign(draft, {
    brand_id: '',
    courier_integration_id: '',
    date_from: '',
    date_to: '',
    search: '',
    sort: 'created_id_desc',
    source: '',
    status: '',
  });
  emit('clear');
};
</script>

<style scoped>
.filters-bar {
  margin-bottom: 16px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(150px, 1fr));
  gap: 10px 30px;
  align-items: center;
}

.filter-control {
  width: 100%;
  height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #334155;
  font-size: 14px;
  outline: none;
  padding: 0 12px;
}

.filter-control:focus,
.filter-control:hover {
  border-color: #94a3b8;
}

.filter-control::placeholder {
  color: #94a3b8;
}

select.filter-control {
  appearance: auto;
  color: #8393aa;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-search,
.btn-clear {
  height: 28px;
  border: none;
  border-radius: 4px;
  background: #5865db;
  color: #fff;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(88, 101, 219, 0.28);
}

.btn-search:hover,
.btn-clear:hover {
  background: #4f5bd5;
}

@media (max-width: 760px) {
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
