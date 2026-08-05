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

      <label class="date-filter-control" :class="{ 'has-value': draft.date_from }">
        <input
          v-model="draft.date_from"
          class="filter-control"
          type="date"
          aria-label="Date From"
        >
        <span class="date-filter-placeholder">Date From</span>
      </label>

      <label class="date-filter-control" :class="{ 'has-value': draft.date_to }">
        <input
          v-model="draft.date_to"
          class="filter-control"
          type="date"
          aria-label="Date To"
        >
        <span class="date-filter-placeholder">Date To</span>
      </label>

      <MultiSelectFilter
        v-model="draft.statuses"
        placeholder="Select Status"
        :options="statusOptions"
      />

      <MultiSelectFilter
        v-model="draft.brand_ids"
        placeholder="Select Shipper"
        :options="brandOptions"
      />

      <MultiSelectFilter
        v-model="draft.sources"
        placeholder="Select Source"
        :options="sourceSelectOptions"
      />

      <MultiSelectFilter
        v-model="draft.courier_integration_ids"
        placeholder="Select Courier"
        :options="courierOptions"
      />

      <select v-model="draft.sort" class="filter-control">
        <option value="created_at_desc">Newest First</option>
        <option value="created_at_asc">Oldest First</option>
      </select>

      <div class="filter-actions">
        <button class="btn-search" type="button" @click="applyFilters">Search</button>
        <button class="btn-clear" type="button" @click="clearFilters">Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';

const MultiSelectFilter = defineComponent({
  props: {
    modelValue: { type: Array, default: () => [] },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'Select' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const open = ref(false);
    const selectedValues = computed(() => Array.isArray(props.modelValue) ? props.modelValue : []);
    const selectedLabels = computed(() => props.options
      .filter(option => selectedValues.value.includes(option.value))
      .map(option => option.label));
    const chips = computed(() => {
      if (selectedLabels.value.length <= 2) return selectedLabels.value;
      return [selectedLabels.value[0], selectedLabels.value[1], `+${selectedLabels.value.length - 2}`];
    });

    const toggleSelection = (value) => {
      const next = [...selectedValues.value];
      const index = next.indexOf(value);

      if (index === -1) {
        next.push(value);
      } else {
        next.splice(index, 1);
      }

      emit('update:modelValue', next);
    };

    const closeOnBlur = (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        open.value = false;
      }
    };

    return () => h('div', { class: 'multi-select', onFocusout: closeOnBlur }, [
      h('button', {
        class: ['multi-select-trigger', { 'is-open': open.value }],
        type: 'button',
        'aria-expanded': open.value,
        onClick: () => { open.value = !open.value; },
      }, [
        chips.value.length
          ? h('span', { class: 'selection-chips' }, chips.value.map(chip => h('span', { class: 'selection-chip', key: chip }, chip)))
          : h('span', { class: 'multi-select-placeholder' }, props.placeholder),
        h('span', { class: 'multi-select-caret' }, '⌄'),
      ]),
      open.value ? h('div', { class: 'multi-select-menu' }, [
        props.options.length
          ? props.options.map(option => h('div', {
            key: option.value,
            class: ['multi-select-option', { 'is-selected': selectedValues.value.includes(option.value) }],
            role: 'checkbox',
            'aria-checked': selectedValues.value.includes(option.value),
            onMousedown: (event) => {
              event.preventDefault();
              toggleSelection(option.value);
            },
            onClick: event => event.preventDefault(),
          }, [
            h('input', {
              checked: selectedValues.value.includes(option.value),
              tabindex: '-1',
              type: 'checkbox',
              'aria-hidden': 'true',
              onClick: event => event.preventDefault(),
            }),
            h('span', option.label),
          ]))
          : h('p', { class: 'multi-select-empty' }, 'No options found.'),
      ]) : null,
    ]);
  },
});

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

const normalizeSelection = (values, fallback = '') => {
  const rows = Array.isArray(values) ? values : [];
  const normalized = rows.map(value => String(value || '').trim()).filter(Boolean);
  const fallbackValue = String(fallback || '').trim();

  return [...new Set(fallbackValue ? [...normalized, fallbackValue] : normalized)];
};

const statusOptions = [
  { value: 'hold', label: 'On Hold' },
  { value: 'pending_confirmation', label: 'Pending Confirmation' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'cancel_by_shipper', label: 'Cancel by Shipper' },
  { value: 'error', label: 'Error' },
  { value: 'merchant_warehouse', label: 'Merchant Warehouse' },
  { value: 'dispatched', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out For Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'ready_for_return', label: 'Ready For Return' },
  { value: 'out_for_return', label: 'Out For Return' },
  { value: 'returned_to_shipper', label: 'Returned to Shipper' },
];

const filterSnapshot = () => ({
  brand_ids: normalizeSelection(props.filters.brand_ids, props.filters.brand_id),
  courier_integration_ids: normalizeSelection(props.filters.courier_integration_ids, props.filters.courier_integration_id),
  date_from: props.filters.date_from || '',
  date_to: props.filters.date_to || '',
  search: props.filters.search || '',
  sort: props.filters.sort || 'created_at_desc',
  sources: normalizeSelection(props.filters.sources, props.filters.source),
  statuses: normalizeSelection(props.filters.statuses, props.filters.status),
});

const draft = reactive(filterSnapshot());

const sourceOptions = computed(() => {
  const defaults = ['Website', 'WhatsApp', 'Abandoned', 'Social'];
  const brandSources = props.brands.flatMap(brand => brand.sources || []);
  return [...new Set([...defaults, ...brandSources].filter(Boolean))];
});

const brandOptions = computed(() => props.brands.map(brand => ({ value: brand.id, label: brand.name })));
const courierOptions = computed(() => [
  { value: 'self_pickup', label: 'Self Pickup / Bykea' },
  ...props.integrations.map(integration => ({ value: integration.id, label: integration.name })),
]);
const sourceSelectOptions = computed(() => sourceOptions.value.map(source => ({ value: source, label: source })));

watch(() => props.filters, () => {
  Object.assign(draft, filterSnapshot());
}, { deep: true });

const appliedPayload = () => ({
  brand_id: draft.brand_ids[0] || null,
  brand_ids: draft.brand_ids,
  courier_integration_id: draft.courier_integration_ids[0] || null,
  courier_integration_ids: draft.courier_integration_ids,
  date_from: draft.date_from || null,
  date_to: draft.date_to || null,
  search: draft.search.trim(),
  sort: draft.sort || 'created_at_desc',
  source: draft.sources[0] || null,
  sources: draft.sources,
  status: draft.statuses[0] || null,
  statuses: draft.statuses,
});

const applyFilters = () => {
  emit('apply', appliedPayload());
};

const clearFilters = () => {
  Object.assign(draft, {
    brand_ids: [],
    courier_integration_ids: [],
    date_from: '',
    date_to: '',
    search: '',
    sort: 'created_at_desc',
    sources: [],
    statuses: [],
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

.date-filter-control {
  position: relative;
  display: block;
  min-width: 0;
}

.date-filter-control .filter-control {
  padding-right: 36px;
}

.date-filter-control:not(.has-value):not(:focus-within) .filter-control::-webkit-datetime-edit {
  color: transparent;
}

.date-filter-placeholder {
  position: absolute;
  top: 50%;
  left: 12px;
  color: #8393aa;
  font-size: 14px;
  pointer-events: none;
  transform: translateY(-50%);
}

.date-filter-control.has-value .date-filter-placeholder,
.date-filter-control:focus-within .date-filter-placeholder {
  display: none;
}

select.filter-control {
  appearance: auto;
  color: #8393aa;
}

.multi-select {
  position: relative;
}

:deep(.multi-select-trigger) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #334155;
  padding: 8px 12px;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

:deep(.multi-select-trigger:focus),
:deep(.multi-select-trigger:hover) {
  border-color: #94a3b8;
  outline: none;
}

:deep(.multi-select-trigger.is-open) {
  border-color: #64748b;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.12);
}

:deep(.multi-select-placeholder) {
  min-width: 0;
  overflow: hidden;
  color: #8393aa;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.multi-select-caret) {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  transition: transform 0.16s ease;
}

:deep(.multi-select-trigger.is-open .multi-select-caret) {
  transform: rotate(180deg);
}

:deep(.selection-chips) {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 5px;
  min-width: 0;
}

:deep(.selection-chip) {
  max-width: 130px;
  overflow: hidden;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  background: #eef2ff;
  color: #27366f;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.multi-select-menu) {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 40;
  display: grid;
  gap: 0;
  max-height: 322px;
  overflow-y: auto;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  padding: 4px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  animation: multi-select-enter 0.14s ease-out;
  transform-origin: top;
}

:deep(.multi-select-option) {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 27px;
  border-radius: 4px;
  padding: 3px 10px;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

:deep(.multi-select-option:hover) {
  background: #e8f1ff;
}

:deep(.multi-select-option.is-selected) {
  background: #f1f5ff;
}

:deep(.multi-select-option input) {
  width: 14px;
  height: 14px;
  accent-color: #334155;
}

:deep(.multi-select-option span) {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  font-size: 14px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.multi-select-option.is-selected span) {
  color: #1e3a8a;
  font-weight: 600;
}

:deep(.multi-select-empty) {
  margin: 0;
  padding: 14px;
  color: #64748b;
  text-align: center;
}

@keyframes multi-select-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scaleY(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
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
