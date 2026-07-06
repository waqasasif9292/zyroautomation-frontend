<template>
  <form class="form-panel" @submit.prevent="submit">
    <div class="panel-header">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
    </div>

    <div class="panel-body">
      <div v-if="loading" class="loading-block"></div>
      <template v-else>
        <section class="form-section">
          <h2>Product Wise Profit Loss Scope</h2>
          <div class="form-grid">
            <Field label="Report Name" :error="errors.name">
              <input v-model="form.name" class="form-input" type="text">
            </Field>
            <Field label="Start Date" :error="errors.start_date">
              <input v-model="form.start_date" class="form-input" type="date">
            </Field>
            <Field label="End Date" :error="errors.end_date">
              <input v-model="form.end_date" class="form-input" type="date">
            </Field>
            <Field label="Brand">
              <select v-model="form.brand_id" class="form-input">
                <option value="">All brands</option>
                <option v-for="brand in options.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
              </select>
            </Field>
            <Field label="Source">
              <select v-model="form.source" class="form-input">
                <option value="">All sources</option>
                <option v-for="source in options.sources" :key="source" :value="source">{{ source }}</option>
              </select>
            </Field>
            <Field label="Courier">
              <select v-model="form.courier_integration_id" class="form-input">
                <option value="">All couriers</option>
                <option v-for="courier in options.couriers" :key="courier.id" :value="courier.id">{{ courier.name }}</option>
              </select>
            </Field>
          </div>
        </section>

        <section class="form-section product-section">
          <h2>Products & Costs</h2>
          <Field label="Products" :error="errors.product_ids">
            <div class="multi-select" @focusout="handleProductsBlur">
              <button class="multi-select-trigger" type="button" @click="productsOpen = !productsOpen">
                <span>{{ selectedProductsLabel }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div v-if="productsOpen" class="multi-select-menu">
                <div class="multi-select-search-wrap">
                  <input
                    v-model="productSearch"
                    class="multi-select-search"
                    type="search"
                    placeholder="Search products"
                    @keydown.stop
                  >
                </div>
                <label v-for="product in filteredProducts" :key="product.id" class="multi-select-option">
                  <input v-model="form.product_ids" type="checkbox" :value="product.id">
                  <span>
                    <strong>{{ product.name }}</strong>
                    <small>Base: {{ money(product.cost) }} · Inventory: {{ money(product.inventory_cost) }}</small>
                  </span>
                </label>
                <p v-if="!options.products.length" class="empty-products">No products found.</p>
                <p v-else-if="!filteredProducts.length" class="empty-products">No matching products found.</p>
              </div>
            </div>
          </Field>
          <div v-if="selectedProducts.length" class="selected-products">
            <article v-for="product in selectedProducts" :key="product.id" class="selected-product-card">
              <div>
                <h3>{{ product.name }}</h3>
                <p>Choose inventory allocation cost or enter a manual unit cost.</p>
                <p v-if="productCostSource(product.id) === 'inventory' && needsReconcile(product)" class="warning-text">
                  {{ number(product.unbatched_allocation_quantity) }} unit(s) need reconcile in Inventory. Until then, those orders use base product cost.
                </p>
              </div>
              <div class="cost-source-control">
                <label class="radio-option">
                  <input
                    :checked="productCostSource(product.id) === 'inventory'"
                    type="radio"
                    :name="`cost-source-${product.id}`"
                    value="inventory"
                    @change="setProductCostSource(product, 'inventory')"
                  >
                  <span>Inventory</span>
                  <small>{{ money(product.inventory_cost) }}</small>
                </label>
                <label class="radio-option">
                  <input
                    :checked="productCostSource(product.id) === 'manual'"
                    type="radio"
                    :name="`cost-source-${product.id}`"
                    value="manual"
                    @change="setProductCostSource(product, 'manual')"
                  >
                  <span>Manual</span>
                  <small>Custom</small>
                </label>
              </div>
              <label>
                <span>Product Cost</span>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  :disabled="productCostSource(product.id) === 'inventory'"
                  :value="productCostValue(product.id)"
                  @input="setProductCost(product.id, $event.target.value)"
                >
              </label>
            </article>
          </div>
          <div class="form-grid">
            <NumberField v-model="form.packing_cost" label="Packing Cost Per Order" :error="errors.packing_cost" />
          </div>
        </section>

        <section class="form-section ads-section">
          <h2>Ads Values</h2>
          <div class="form-grid two-col">
            <NumberField v-model="form.total_ad_spend" label="Total Ad Spend" :error="errors.total_ad_spend" />
            <NumberField v-model="form.ads_tax_percentage" label="Ad Tax %" :error="errors.ads_tax_percentage" max="100" />
          </div>
        </section>

        <section class="form-section">
          <h2>Courier Withholding Tax</h2>
          <div v-if="visibleCouriers.length" class="courier-tax-grid">
            <article v-for="courier in visibleCouriers" :key="courier.id" class="courier-tax-card">
              <div>
                <h3>{{ courier.name }}</h3>
                <p>Applied to delivered parcels for this courier.</p>
              </div>
              <label>
                <span>Withholding Tax %</span>
                <input
                  class="form-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  :value="courierTaxValue(courier.id)"
                  @input="setCourierTax(courier.id, $event.target.value)"
                >
              </label>
            </article>
          </div>
          <p v-else class="empty-products">No couriers configured.</p>
        </section>

        <section class="form-section">
          <div class="section-heading-row">
            <h2>Custom Expenses Per Order</h2>
            <button class="btn-secondary small-btn" type="button" @click="addExtraExpense">Add Expense</button>
          </div>
          <div v-if="form.extra_expenses.length" class="expense-list">
            <div v-for="(expense, index) in form.extra_expenses" :key="expense.key" class="expense-row">
              <Field label="Label" :error="expenseError(index, 'label')">
                <input v-model="expense.label" class="form-input" type="text">
              </Field>
              <NumberField v-model="expense.value" label="Amount Per Order" :error="expenseError(index, 'value')" />
              <button class="btn-secondary remove-btn" type="button" @click="removeExtraExpense(index)">Remove</button>
            </div>
          </div>
          <p v-else class="empty-products">No custom per-order expenses added.</p>
        </section>

        <section class="form-section">
          <div class="section-heading-row">
            <h2>One Time Expenses</h2>
            <button class="btn-secondary small-btn" type="button" @click="addOneTimeExpense">Add Expense</button>
          </div>
          <div v-if="form.one_time_expenses.length" class="expense-list">
            <div v-for="(expense, index) in form.one_time_expenses" :key="expense.key" class="expense-row">
              <Field label="Label" :error="oneTimeExpenseError(index, 'label')">
                <input v-model="expense.label" class="form-input" type="text">
              </Field>
              <NumberField v-model="expense.value" label="Amount" :error="oneTimeExpenseError(index, 'value')" />
              <button class="btn-secondary remove-btn" type="button" @click="removeOneTimeExpense(index)">Remove</button>
            </div>
          </div>
          <p v-else class="empty-products">No one-time expenses added.</p>
        </section>

        <div class="actions">
          <button class="btn-secondary" type="button" :disabled="saving" @click="$emit('cancel')">Cancel</button>
          <button class="btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : submitLabel }}</button>
        </div>
      </template>
    </div>
  </form>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';

const Field = defineComponent({
  props: { label: String, error: { type: String, default: '' } },
  setup(props, { slots }) {
    return () => h('label', { class: 'form-group' }, [
      h('span', { class: 'form-label' }, props.label),
      slots.default?.(),
      props.error ? h('span', { class: 'field-error' }, props.error) : null,
    ]);
  },
});

const NumberField = defineComponent({
  props: {
    modelValue: { type: Number, default: 0 },
    label: { type: String, required: true },
    error: { type: String, default: '' },
    max: { type: String, default: null },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h(Field, { label: props.label, error: props.error }, {
      default: () => h('input', {
        class: 'form-input',
        type: 'number',
        min: '0',
        max: props.max,
        step: '0.01',
        value: props.modelValue,
        onInput: event => emit('update:modelValue', Number(event.target.value || 0)),
      }),
    });
  },
});

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  initialCalculation: { type: Object, default: null },
  options: { type: Object, default: () => ({ brands: [], couriers: [], sources: [], products: [] }) },
  loading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'Save Report' },
  errors: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['submit', 'cancel']);
const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();
const productsOpen = ref(false);
const productSearch = ref('');

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const form = reactive({
  name: '',
  start_date: monthStart,
  end_date: today,
  brand_id: '',
  source: '',
  courier_integration_id: '',
  product_ids: [],
  product_costs: {},
  product_cost_sources: {},
  packing_cost: 0,
  total_ad_spend: 0,
  ads_tax_percentage: 8,
  courier_taxes: {},
  extra_expenses: [],
  one_time_expenses: [],
});

const normalizeProductCosts = (products = []) => {
  return Object.fromEntries((products || []).map(product => [
    product.product_id,
    Number(product.product_cost || 0),
  ]));
};

const normalizeProductCostSources = (products = []) => {
  return Object.fromEntries((products || []).map(product => [
    product.product_id,
    product.cost_source || 'manual',
  ]));
};

const normalizeCourierTaxes = (courierTaxes = []) => {
  return Object.fromEntries((courierTaxes || []).map(row => [
    row.courier_integration_id,
    Number(row.tax_percentage || 0),
  ]));
};

const normalizeExpenses = (expenses = []) => (
  Array.isArray(expenses) ? expenses : []
).map((expense) => ({
  key: crypto.randomUUID(),
  label: String(expense.label || ''),
  value: Number(expense.value || 0),
}));

const syncCourierTaxDefaults = (couriers) => {
  couriers.forEach((courier) => {
    if (form.courier_taxes[courier.id] === undefined) {
      form.courier_taxes[courier.id] = 4;
    }
  });

  Object.keys(form.courier_taxes).forEach((id) => {
    if (!couriers.some(courier => courier.id === id)) {
      delete form.courier_taxes[id];
    }
  });
};

watch(() => props.initialCalculation, (calculation) => {
  if (!calculation) return;
  Object.assign(form, {
    name: calculation.name || '',
    start_date: calculation.start_date || monthStart,
    end_date: calculation.end_date || today,
    brand_id: calculation.brand_id || '',
    source: calculation.source || '',
    courier_integration_id: calculation.courier_integration_id || '',
    product_ids: calculation.product_ids || [],
    product_costs: normalizeProductCosts(calculation.products),
    product_cost_sources: normalizeProductCostSources(calculation.products),
    packing_cost: Number(calculation.packing_cost || 0),
    total_ad_spend: Number(calculation.total_ad_spend || 0),
    ads_tax_percentage: Number(calculation.ads_tax_percentage ?? 8),
    courier_taxes: normalizeCourierTaxes(calculation.courier_taxes),
    extra_expenses: normalizeExpenses(calculation.extra_expenses),
    one_time_expenses: normalizeExpenses(calculation.one_time_expenses),
  });
  syncCourierTaxDefaults(props.options.couriers);
}, { immediate: true });

watch(() => props.options.couriers, (couriers) => {
  syncCourierTaxDefaults(couriers);
}, { immediate: true });

watch(() => form.product_ids.slice(), (ids) => {
  ids.forEach((id) => {
    if (form.product_costs[id] === undefined) {
      const product = props.options.products.find(item => item.id === id);
      form.product_cost_sources[id] = 'inventory';
      form.product_costs[id] = Number(product?.inventory_cost ?? product?.cost ?? 0);
    }
    if (form.product_cost_sources[id] === undefined) {
      form.product_cost_sources[id] = 'inventory';
    }
  });

  Object.keys(form.product_costs).forEach((id) => {
    if (!ids.includes(id)) {
      delete form.product_costs[id];
      delete form.product_cost_sources[id];
    }
  });
});

const submit = () => emit('submit', {
  name: form.name,
  start_date: form.start_date,
  end_date: form.end_date,
  brand_id: form.brand_id,
  source: form.source,
  courier_integration_id: form.courier_integration_id,
  products: form.product_ids.map(id => ({
    product_id: id,
    product_cost: Number(form.product_costs[id] || 0),
    cost_source: productCostSource(id),
  })),
  packing_cost: form.packing_cost,
  total_ad_spend: form.total_ad_spend,
  ads_tax_percentage: form.ads_tax_percentage,
  courier_taxes: visibleCouriers.value.map(courier => ({
    courier_integration_id: courier.id,
    tax_percentage: Number(form.courier_taxes[courier.id] || 0),
  })),
  extra_expenses: activeExtraExpenses.value,
  one_time_expenses: activeOneTimeExpenses.value,
});

const filteredProducts = computed(() => {
  const term = productSearch.value.trim().toLowerCase();

  if (!term) {
    return props.options.products;
  }

  return props.options.products.filter((product) => {
    const searchable = [
      product.name,
      product.cost,
      product.inventory_cost,
    ].join(' ').toLowerCase();

    return searchable.includes(term);
  });
});

const selectedProducts = computed(() => props.options.products.filter(product => form.product_ids.includes(product.id)));

const visibleCouriers = computed(() => {
  if (!form.courier_integration_id) {
    return props.options.couriers;
  }

  return props.options.couriers.filter(courier => courier.id === form.courier_integration_id);
});

const productCostValue = (id) => Number(form.product_costs[id] || 0);
const productCostSource = (id) => form.product_cost_sources[id] || 'inventory';

const setProductCost = (id, value) => {
  form.product_costs[id] = Number(value || 0);
};

const setProductCostSource = (product, source) => {
  form.product_cost_sources[product.id] = source;
  if (source === 'inventory') {
    form.product_costs[product.id] = Number(product.inventory_cost ?? product.cost ?? 0);
  }
};

const needsReconcile = (product) => Number(product.unbatched_allocation_quantity || 0) > 0;

const courierTaxValue = (id) => Number(form.courier_taxes[id] ?? 4);

const setCourierTax = (id, value) => {
  form.courier_taxes[id] = Number(value || 0);
};

const activeExtraExpenses = computed(() => form.extra_expenses
  .map(expense => ({
    label: String(expense.label || '').trim(),
    value: Number(expense.value || 0),
  }))
  .filter(expense => expense.label || expense.value > 0));

const activeOneTimeExpenses = computed(() => form.one_time_expenses
  .map(expense => ({
    label: String(expense.label || '').trim(),
    value: Number(expense.value || 0),
  }))
  .filter(expense => expense.label || expense.value > 0));

const addExtraExpense = () => {
  form.extra_expenses.push({
    key: crypto.randomUUID(),
    label: '',
    value: 0,
  });
};

const removeExtraExpense = (index) => {
  form.extra_expenses.splice(index, 1);
};

const addOneTimeExpense = () => {
  form.one_time_expenses.push({
    key: crypto.randomUUID(),
    label: '',
    value: 0,
  });
};

const removeOneTimeExpense = (index) => {
  form.one_time_expenses.splice(index, 1);
};

const expenseError = (index, field) => props.errors[`extra_expenses.${index}.${field}`] || '';
const oneTimeExpenseError = (index, field) => props.errors[`one_time_expenses.${index}.${field}`] || '';

const selectedProductsLabel = computed(() => {
  const selected = props.options.products.filter(product => form.product_ids.includes(product.id));
  if (!selected.length) return 'Select products';
  if (selected.length <= 2) return selected.map(product => product.name).join(', ');
  return `${selected.length} products selected`;
});

const handleProductsBlur = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    productsOpen.value = false;
    productSearch.value = '';
  }
};
</script>

<style scoped>
.form-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  padding: 22px 26px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h1 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
}

.panel-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.panel-body {
  display: grid;
  gap: 20px;
  padding: 24px 26px;
}

.form-section {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1.5px dashed #b6c6dc;
  border-radius: 8px;
  background: #f3f8ff;
}

.form-section h2 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 18px;
  row-gap: 18px;
}

.form-grid.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-group {
  display: grid;
  gap: 6px;
}

.form-label {
  color: #42537a;
  font-size: 14px;
  font-weight: 700;
}

:deep(.form-input) {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  padding: 12px;
  color: #1e293b;
  font-size: 14px;
}

:deep(.field-error) {
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

:deep(.form-input:focus) {
  outline: none;
  border-color: #1e293b;
  box-shadow: none;
}

:deep(.form-input:disabled) {
  background: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

.multi-select {
  position: relative;
}

.multi-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #1e293b;
  padding: 12px;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.multi-select-trigger span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.multi-select-trigger:focus {
  outline: none;
  border-color: #1e293b;
  box-shadow: none;
}

.multi-select-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  display: grid;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.14);
}

.multi-select-search-wrap {
  position: sticky;
  top: -8px;
  z-index: 1;
  background: #fff;
  padding: 0 0 6px;
}

.multi-select-search {
  box-sizing: border-box;
  width: 100%;
  min-height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  color: #1e293b;
  padding: 9px 10px;
  font-size: 14px;
}

.multi-select-search:focus {
  outline: none;
  border-color: #1e293b;
  background: #fff;
}

.multi-select-option {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  border-radius: 7px;
  padding: 10px;
  cursor: pointer;
}

.multi-select-option:hover {
  background: #eff6ff;
}

.multi-select-option input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: #1e293b;
}

.multi-select-option strong,
.multi-select-option small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-products,
.courier-tax-grid,
.expense-list {
  display: grid;
  gap: 12px;
}

.expense-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px auto;
  gap: 14px;
  align-items: end;
  border: 1px solid #d5e0ee;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.expense-row:hover {
  border-color: #aebfd4;
  background: #fbfdff;
}

.selected-product-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px 220px;
  gap: 16px;
  align-items: end;
  border: 1px solid #d5e0ee;
  border-radius: 8px;
  background: #fff;
  padding: 16px 14px;
}

.courier-tax-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
  align-items: end;
  border: 1px solid #d5e0ee;
  border-radius: 8px;
  background: #fff;
  padding: 16px 14px;
}

.selected-product-card:hover,
.courier-tax-card:hover {
  border-color: #aebfd4;
  background: #fbfdff;
}

.selected-product-card h3,
.courier-tax-card h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
}

.selected-product-card p,
.courier-tax-card p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.selected-product-card .warning-text {
  display: inline-flex;
  margin-top: 8px;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  background: #fffbeb;
  color: #92400e;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
}

.cost-source-control {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.radio-option {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-height: 58px;
  border: 1px solid #d5e0ee;
  border-radius: 8px;
  background: #fff;
  padding: 9px;
  cursor: pointer;
}

.radio-option:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.radio-option input {
  width: 16px;
  height: 16px;
  accent-color: #1e293b;
}

.radio-option span,
.radio-option small {
  display: block;
  min-width: 0;
}

.radio-option span {
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
}

.radio-option small {
  margin-top: 2px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.selected-product-card label,
.courier-tax-card label {
  display: grid;
  gap: 7px;
}

.selected-product-card label span,
.courier-tax-card label span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.multi-select-option strong {
  color: #0f172a;
  font-size: 13px;
}

.multi-select-option small {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.empty-products {
  grid-column: 1 / -1;
  margin: 0;
  padding: 18px;
  color: #64748b;
  text-align: center;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.btn-secondary,
.btn-primary {
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.small-btn {
  min-height: 36px;
  padding: 8px 12px;
  white-space: nowrap;
}

.remove-btn {
  min-height: 46px;
}

.btn-secondary {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-primary {
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
}

.loading-block {
  height: 360px;
  border-radius: 8px;
  background: #e2e8f0;
}

@media (max-width: 950px) {
  .form-grid,
  .form-grid.two-col,
  .selected-product-card,
  .courier-tax-card,
  .expense-row {
    grid-template-columns: 1fr;
  }
}
</style>
