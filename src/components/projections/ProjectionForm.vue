<template>
  <div class="projection-form-layout">
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
          <section class="form-section expense-section">
            <h2>Product</h2>
            <div class="form-group">
              <label class="form-label">Product Name</label>
              <input v-model="form.product_name" class="form-input" :class="{ 'input-error': errors.product_name }" type="text" placeholder="e.g. Rechargeable Hammer Torch">
              <span v-if="errors.product_name" class="field-error">{{ errors.product_name }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Product Image</label>
              <div v-if="currentImage" class="current-image">
                <img :src="currentImage" :alt="form.product_name">
                <span>Current image</span>
              </div>
              <input class="file-input" :class="{ 'input-error': errors.product_image }" type="file" accept="image/png,image/jpeg,image/webp" @change="setImage">
              <span v-if="errors.product_image" class="field-error">{{ errors.product_image }}</span>
            </div>
          </section>

          <section class="form-section expense-section">
            <h2>Pricing & Costs</h2>
            <div class="form-grid">
              <NumberField v-model="form.sale_price" label="Sale Price" :error="errors.sale_price" />
              <NumberField v-model="form.product_cost" label="Product Cost" :error="errors.product_cost" />
              <NumberField v-model="form.bulity_cost" label="Bulity Cost Per Order" :error="errors.bulity_cost" />
              <NumberField v-model="form.packing_cost" label="Packing Cost Per Order" :error="errors.packing_cost" />
              <NumberField v-model="form.delivery_charges" label="Delivery Charges (DC) Per Order" :error="errors.delivery_charges" />
              <NumberField v-model="form.tax_percentage" label="Courier Withholding Tax %" :error="errors.tax_percentage" />
              <NumberField v-model="form.ads_cost_per_day" label="Ads Cost Per Day" :error="errors.ads_cost_per_day" />
              <NumberField v-model="form.ads_tax_percentage" label="Ads Tax %" :error="errors.ads_tax_percentage" />
              <NumberField v-model="form.cpc" label="Ad Cost Per Order (CPC)" :error="errors.cpc" />
            </div>
          </section>

          <section class="form-section expense-section">
            <div class="section-header">
              <h2>Extra Expenses Per Order</h2>
              <button class="btn-secondary compact" type="button" @click="addExtraExpense">Add Expense</button>
            </div>

            <div v-if="form.extra_expenses.length" class="extra-expenses">
              <div v-for="(expense, index) in form.extra_expenses" :key="expense.key" class="extra-expense-row">
                <div class="form-group">
                  <label class="form-label">Expense Label <span class="required-mark">*</span></label>
                  <input
                    v-model="expense.label"
                    class="form-input"
                    :class="{ 'input-error': expenseError(index, 'label') }"
                    type="text"
                    placeholder="e.g. Staff handling"
                  >
                  <span v-if="expenseError(index, 'label')" class="field-error">{{ expenseError(index, 'label') }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Cost Per Order <span class="required-mark">*</span></label>
                  <input
                    v-model.number="expense.value"
                    class="form-input"
                    :class="{ 'input-error': expenseError(index, 'value') }"
                    type="number"
                    min="0"
                    step="0.01"
                  >
                  <span v-if="expenseError(index, 'value')" class="field-error">{{ expenseError(index, 'value') }}</span>
                </div>
                <button class="btn-secondary icon-action" type="button" aria-label="Remove expense" @click="removeExtraExpense(index)">Remove</button>
              </div>
            </div>
          </section>

          <section class="form-section expense-section">
            <div class="section-header">
              <h2>One Time Expenses</h2>
              <button class="btn-secondary compact" type="button" @click="addOneTimeExpense">Add Expense</button>
            </div>

            <div v-if="form.one_time_expenses.length" class="extra-expenses">
              <div v-for="(expense, index) in form.one_time_expenses" :key="expense.key" class="extra-expense-row">
                <div class="form-group">
                  <label class="form-label">Expense Label <span class="required-mark">*</span></label>
                  <input
                    v-model="expense.label"
                    class="form-input"
                    :class="{ 'input-error': oneTimeExpenseError(index, 'label') }"
                    type="text"
                    placeholder="e.g. Rent"
                  >
                  <span v-if="oneTimeExpenseError(index, 'label')" class="field-error">{{ oneTimeExpenseError(index, 'label') }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">One Time Cost <span class="required-mark">*</span></label>
                  <input
                    v-model.number="expense.value"
                    class="form-input"
                    :class="{ 'input-error': oneTimeExpenseError(index, 'value') }"
                    type="number"
                    min="0"
                    step="0.01"
                  >
                  <span v-if="oneTimeExpenseError(index, 'value')" class="field-error">{{ oneTimeExpenseError(index, 'value') }}</span>
                </div>
                <button class="btn-secondary icon-action" type="button" aria-label="Remove expense" @click="removeOneTimeExpense(index)">Remove</button>
              </div>
            </div>
          </section>

          <section class="form-section expense-section">
            <h2>Order Assumptions</h2>
            <div class="form-grid">
              <NumberField v-model="form.cancel_rate" label="Cancel Rate %" :error="errors.cancel_rate" max="100" />
              <NumberField v-model="form.return_rate" label="Return Rate %" :error="errors.return_rate" max="100" />
            </div>
          </section>

          <div class="actions">
            <button class="btn-secondary" type="button" :disabled="saving" @click="$emit('cancel')">Cancel</button>
            <button class="btn-primary" type="submit" :disabled="saving">
              <span v-if="saving" class="spinner"></span>
              <span v-else>{{ submitLabel }}</span>
            </button>
          </div>
        </template>
      </div>
    </form>

    <ProjectionResultsPanel :calculations="calculations" />
  </div>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import ProjectionResultsPanel from './ProjectionResultsPanel.vue';

const NumberField = defineComponent({
  props: {
    modelValue: { type: Number, default: 0 },
    label: { type: String, required: true },
    error: { type: String, default: '' },
    max: { type: String, default: null },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'form-group' }, [
      h('label', { class: 'form-label' }, [
        props.label,
        h('span', { class: 'required-mark' }, ' *'),
      ]),
      h('input', {
        class: ['form-input', { 'input-error': props.error }],
        type: 'number',
        min: '0',
        max: props.max,
        step: '0.01',
        value: props.modelValue,
        onInput: event => emit('update:modelValue', Number(event.target.value || 0)),
      }),
      props.error ? h('span', { class: 'field-error' }, props.error) : null,
    ]);
  },
});

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  initialProjection: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    default: 'Save Projection',
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['submit', 'cancel']);

const image = ref(null);
const currentImage = ref('');

const form = reactive({
  product_name: '',
  sale_price: 0,
  product_cost: 0,
  bulity_cost: 0,
  packing_cost: 0,
  delivery_charges: 0,
  tax_percentage: 0,
  ads_cost_per_day: 0,
  ads_tax_percentage: 0,
  cpc: 0,
  cancel_rate: 0,
  return_rate: 0,
  extra_expenses: [],
  one_time_expenses: [],
});

const fillForm = (projection) => {
  if (!projection) return;
  Object.keys(form).forEach((key) => {
    if (key === 'extra_expenses') {
      form.extra_expenses = normalizeExpenses(projection.extra_expenses);
      return;
    }
    if (key === 'one_time_expenses') {
      form.one_time_expenses = normalizeExpenses(projection.one_time_expenses);
      return;
    }
    form[key] = key === 'product_name' ? (projection[key] || '') : Number(projection[key] || 0);
  });
  currentImage.value = projection.product_image_url || '';
};

watch(() => props.initialProjection, fillForm, { immediate: true });

const calculations = computed(() => {
  const monthlyAdSpend = form.ads_cost_per_day * 30;
  const adSpendAfterTax = monthlyAdSpend * (1 + (form.ads_tax_percentage / 100));
  const ordersPerDay = form.cpc > 0 ? Math.floor(adSpendAfterTax / form.cpc / 30) : 0;
  const totalOrders = ordersPerDay * 30;
  const cancelOrders = totalOrders * (form.cancel_rate / 100);
  const dispatchedOrders = totalOrders - cancelOrders;
  const returnOrders = dispatchedOrders * (form.return_rate / 100);
  const deliveredOrders = dispatchedOrders - returnOrders;
  const totalSales = dispatchedOrders * form.sale_price;
  const deliveredSales = deliveredOrders * form.sale_price;
  const totalProductCost = form.product_cost * deliveredOrders;
  const totalBulityCost = form.bulity_cost * dispatchedOrders;
  const totalPackingCost = form.packing_cost * dispatchedOrders;
  const totalDeliveryCost = form.delivery_charges * dispatchedOrders;
  const extraExpenseBreakdown = activeExtraExpenses.value.map(expense => ({
    label: expense.label,
    value: expense.value,
    total: expense.value * dispatchedOrders,
  }));
  const totalExtraExpenses = extraExpenseBreakdown.reduce((sum, expense) => sum + expense.total, 0);
  const oneTimeExpenseBreakdown = activeOneTimeExpenses.value.map(expense => ({
    label: expense.label,
    value: expense.value,
    total: expense.value,
  }));
  const totalOneTimeExpenses = oneTimeExpenseBreakdown.reduce((sum, expense) => sum + expense.total, 0);
  const totalAdCost = adSpendAfterTax;
  const taxAmount = deliveredSales * (form.tax_percentage / 100);
  const profit = deliveredSales - totalProductCost - totalBulityCost - totalPackingCost - totalDeliveryCost - totalExtraExpenses - totalOneTimeExpenses - totalAdCost - taxAmount;

  return {
    monthly_ad_spend: monthlyAdSpend,
    ad_spend_after_tax: adSpendAfterTax,
    orders_per_day: ordersPerDay,
    total_orders: totalOrders,
    cancel_orders: cancelOrders,
    dispatched_orders: dispatchedOrders,
    return_orders: returnOrders,
    delivered_orders: deliveredOrders,
    total_sales: totalSales,
    delivered_sales: deliveredSales,
    total_product_cost: totalProductCost,
    total_bulity_cost: totalBulityCost,
    total_packing_cost: totalPackingCost,
    total_delivery_cost: totalDeliveryCost,
    extra_expenses: extraExpenseBreakdown,
    total_extra_expenses: totalExtraExpenses,
    one_time_expenses: oneTimeExpenseBreakdown,
    total_one_time_expenses: totalOneTimeExpenses,
    total_ad_cost: totalAdCost,
    tax_amount: taxAmount,
    profit,
  };
});

const normalizeExpenses = (expenses = []) => (
  Array.isArray(expenses) ? expenses : []
).map((expense) => ({
  key: createExpenseKey(),
  label: String(expense.label || ''),
  value: Number(expense.value || 0),
}));

function createExpenseKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

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
    key: createExpenseKey(),
    label: '',
    value: 0,
  });
};

const removeExtraExpense = (index) => {
  form.extra_expenses.splice(index, 1);
};

const addOneTimeExpense = () => {
  form.one_time_expenses.push({
    key: createExpenseKey(),
    label: '',
    value: 0,
  });
};

const removeOneTimeExpense = (index) => {
  form.one_time_expenses.splice(index, 1);
};

const expenseError = (index, field) => props.errors[`extra_expenses.${index}.${field}`] || '';
const oneTimeExpenseError = (index, field) => props.errors[`one_time_expenses.${index}.${field}`] || '';

const setImage = (event) => {
  image.value = event.target.files?.[0] || null;
};

const submit = () => {
  const payload = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    if (['extra_expenses', 'one_time_expenses'].includes(key)) return;
    payload.append(key, key === 'product_name' ? String(value).trim() : value);
  });
  activeExtraExpenses.value.forEach((expense, index) => {
    payload.append(`extra_expenses[${index}][label]`, expense.label);
    payload.append(`extra_expenses[${index}][value]`, expense.value);
  });
  activeOneTimeExpenses.value.forEach((expense, index) => {
    payload.append(`one_time_expenses[${index}][label]`, expense.label);
    payload.append(`one_time_expenses[${index}][value]`, expense.value);
  });
  if (image.value) payload.append('product_image', image.value);
  emit('submit', payload);
};
</script>

<style scoped>
.projection-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 18px;
  align-items: start;
}

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
}

.expense-section {
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 30px;
  row-gap: 28px;
}

.extra-expenses {
  display: grid;
  gap: 14px;
}

.extra-expense-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 260px) auto;
  gap: 14px;
  align-items: start;
  padding: 16px 14px;
  border: 1px solid #d5e0ee;
  border-radius: 8px;
  background: #fff;
}

.extra-expense-row:hover {
  border-color: #aebfd4;
  background: #fbfdff;
}

:deep(.form-group),
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.form-label),
.form-label {
  color: #42537a;
  font-size: 14px;
  font-weight: 700;
}

:deep(.required-mark),
.required-mark {
  color: #f43f5e;
}

:deep(.form-input),
.file-input {
  min-width: 0;
  width: 100%;
  height: 46px;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #1e293b;
  padding: 12px;
  font-size: 14px;
  outline: none;
}

:deep(.form-input:focus),
.file-input:focus {
  border-color: #1e293b;
}

:deep(.input-error),
.input-error {
  border-color: #ef4444;
}

:deep(.field-error),
.field-error {
  color: #ef4444;
  font-size: 12.5px;
}

:deep(.form-input::-webkit-outer-spin-button),
:deep(.form-input::-webkit-inner-spin-button) {
  margin: 0;
}

.current-image {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.current-image img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-secondary,
.btn-primary {
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.btn-secondary {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-secondary.compact,
.icon-action {
  min-height: 36px;
  padding: 8px 12px;
  white-space: nowrap;
}

.icon-action {
  align-self: end;
  min-height: 46px;
}

.btn-primary {
  min-width: 136px;
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
}

.loading-block {
  height: 420px;
  border-radius: 8px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1180px) {
  .projection-form-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-header,
  .extra-expense-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
