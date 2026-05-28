<template>
  <AppLayout>
    <main class="page">
      <section class="panel">
        <header class="panel-header">
          <div>
            <h1>Overall Profit/Loss Report</h1>
            <p>{{ stepSubtitle }}</p>
          </div>
          <div class="header-tools">
            <div class="steps">
              <button type="button" :class="{ active: step === 1, done: step > 1 }" @click="step = 1">
                <span>1</span>
                <strong>Scope</strong>
              </button>
              <button type="button" :class="{ active: step === 2, done: step > 2 }" :disabled="!products.length" @click="step = 2">
                <span>2</span>
                <strong>Products</strong>
              </button>
              <button type="button" :class="{ active: step === 3 }" :disabled="!products.length" @click="step = 3">
                <span>3</span>
                <strong>Costs</strong>
              </button>
            </div>
            <button class="close-btn" type="button" aria-label="Exit report form" title="Exit report form" @click="exitForm">×</button>
          </div>
        </header>

        <div v-if="loadingOptions" class="loading">Loading options...</div>

        <template v-else>
          <section v-if="step === 1" class="step-body">
            <div class="form-grid">
              <label class="form-group">
                <span>Report Name</span>
                <input v-model="filters.name" class="form-input" type="text">
                <small v-if="errors.name">{{ errors.name }}</small>
              </label>
              <label class="form-group">
                <span>Start Date</span>
                <input v-model="filters.start_date" class="form-input" type="date">
                <small v-if="errors.start_date">{{ errors.start_date }}</small>
              </label>
              <label class="form-group">
                <span>End Date</span>
                <input v-model="filters.end_date" class="form-input" type="date">
                <small v-if="errors.end_date">{{ errors.end_date }}</small>
              </label>
              <label class="form-group">
                <span>Brand</span>
                <select v-model="filters.brand_id" class="form-input">
                  <option value="">All brands</option>
                  <option v-for="brand in options.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
                </select>
              </label>
              <label class="form-group">
                <span>Source</span>
                <select v-model="filters.source" class="form-input">
                  <option value="">All sources</option>
                  <option v-for="source in options.sources" :key="source" :value="source">{{ source }}</option>
                </select>
              </label>
              <label class="form-group">
                <span>Courier</span>
                <select v-model="filters.courier_integration_id" class="form-input">
                  <option value="">All couriers</option>
                  <option v-for="courier in options.couriers" :key="courier.id" :value="courier.id">{{ courier.name }}</option>
                </select>
              </label>
            </div>

            <div class="actions">
              <button class="secondary-btn" type="button" @click="router.push('/overall-profit-loss')">Cancel</button>
              <button class="primary-btn" type="button" :disabled="fetching" @click="goToProducts">
                {{ fetching ? 'Fetching Products...' : 'Next' }}
              </button>
            </div>
          </section>

          <section v-else-if="step === 2" class="step-body">
            <div class="summary-strip">
              <article>
                <span>Orders</span>
                <strong>{{ number(summary.orders_count) }}</strong>
              </article>
              <article>
                <span>Products</span>
                <strong>{{ number(summary.products_count) }}</strong>
              </article>
              <article>
                <span>Total Quantity</span>
                <strong>{{ number(summary.total_quantity) }}</strong>
              </article>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Orders</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!products.length">
                    <td colspan="7">No products found for these filters.</td>
                  </tr>
                  <tr v-for="(product, index) in products" :key="product.key">
                    <td>{{ index + 1 }}</td>
                    <td>
                      <span class="product-name">{{ product.name }}</span>
                      <small v-if="product.variant_id">Variant: {{ product.variant_id }}</small>
                    </td>
                    <td>{{ product.sku || '-' }}</td>
                    <td>{{ number(product.order_count) }}</td>
                    <td>{{ number(product.quantity) }}</td>
                    <td>
                      <input
                        v-model.number="productCosts[product.key]"
                        class="cost-input"
                        type="number"
                        min="0"
                        step="0.01"
                      >
                    </td>
                    <td class="money-cell">{{ money(product.quantity * Number(productCosts[product.key] || 0)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="footer-total">
              <span>Total Product Cost</span>
              <strong>{{ money(totalProductCost) }}</strong>
            </div>

            <div class="actions">
              <button class="secondary-btn" type="button" :disabled="fetching" @click="step = 1">Back</button>
              <button class="primary-btn" type="button" :disabled="!products.length" @click="step = 3">Next</button>
            </div>
          </section>

          <section v-else class="step-body">
            <div class="form-grid">
              <label class="form-group">
                <span>Packing Cost Per Order</span>
                <input v-model.number="costs.packing_cost" class="form-input" type="number" min="0" step="0.01">
                <small v-if="errors.packing_cost">{{ errors.packing_cost }}</small>
              </label>
              <label class="form-group">
                <span>Total Ad Spend</span>
                <input v-model.number="costs.total_ad_spend" class="form-input" type="number" min="0" step="0.01">
                <small v-if="errors.total_ad_spend">{{ errors.total_ad_spend }}</small>
              </label>
              <label class="form-group">
                <span>Ad Tax %</span>
                <input v-model.number="costs.ads_tax_percentage" class="form-input" type="number" min="0" max="100" step="0.01">
                <small v-if="errors.ads_tax_percentage">{{ errors.ads_tax_percentage }}</small>
              </label>
            </div>

            <section class="sub-panel">
              <h2>Courier Withholding Tax</h2>
              <div v-if="options.couriers.length" class="courier-tax-grid">
                <article v-for="courier in options.couriers" :key="courier.id" class="courier-tax-card">
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
              <p v-else class="empty-row">No couriers configured.</p>
            </section>

            <section class="sub-panel">
              <div class="section-heading-row">
                <h2>Custom Expenses Per Order</h2>
                <button class="secondary-btn small-btn" type="button" @click="addExtraExpense">Add Expense</button>
              </div>
              <div v-if="costs.extra_expenses.length" class="expense-list">
                <div v-for="(expense, index) in costs.extra_expenses" :key="expense.key" class="expense-row">
                  <label class="form-group">
                    <span>Label</span>
                    <input v-model="expense.label" class="form-input" type="text">
                    <small v-if="expenseError(index, 'label')">{{ expenseError(index, 'label') }}</small>
                  </label>
                  <label class="form-group">
                    <span>Amount Per Order</span>
                    <input v-model.number="expense.value" class="form-input" type="number" min="0" step="0.01">
                    <small v-if="expenseError(index, 'value')">{{ expenseError(index, 'value') }}</small>
                  </label>
                  <button class="secondary-btn remove-btn" type="button" @click="removeExtraExpense(index)">Remove</button>
                </div>
              </div>
              <p v-else class="empty-row">No custom per-order expenses added.</p>
            </section>

            <section class="sub-panel">
              <div class="section-heading-row">
                <h2>One Time Expenses</h2>
                <button class="secondary-btn small-btn" type="button" @click="addOneTimeExpense">Add Expense</button>
              </div>
              <div v-if="costs.one_time_expenses.length" class="expense-list">
                <div v-for="(expense, index) in costs.one_time_expenses" :key="expense.key" class="expense-row">
                  <label class="form-group">
                    <span>Label</span>
                    <input v-model="expense.label" class="form-input" type="text">
                    <small v-if="oneTimeExpenseError(index, 'label')">{{ oneTimeExpenseError(index, 'label') }}</small>
                  </label>
                  <label class="form-group">
                    <span>Amount</span>
                    <input v-model.number="expense.value" class="form-input" type="number" min="0" step="0.01">
                    <small v-if="oneTimeExpenseError(index, 'value')">{{ oneTimeExpenseError(index, 'value') }}</small>
                  </label>
                  <button class="secondary-btn remove-btn" type="button" @click="removeOneTimeExpense(index)">Remove</button>
                </div>
              </div>
              <p v-else class="empty-row">No one-time expenses added.</p>
            </section>

            <div class="actions">
              <button class="secondary-btn" type="button" :disabled="saving" @click="exitForm">Cancel</button>
              <button class="secondary-btn" type="button" :disabled="saving" @click="step = 2">Back</button>
              <button class="primary-btn" type="button" :disabled="saving" @click="saveReport">
                {{ saving ? 'Saving...' : finalActionLabel }}
              </button>
            </div>
          </section>
        </template>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProfitLossCalculationService from '../../services/ProfitLossCalculationService';
import OverallProfitLossService from '../../services/OverallProfitLossService';

const router = useRouter();
const route = useRoute();
const reportId = route.params.id;
const isEdit = computed(() => Boolean(reportId));
const finalActionLabel = computed(() => (isEdit.value ? 'Save Changes & View Results' : 'Create Report & View Results'));
const stepSubtitle = computed(() => {
  if (step.value === 1) return 'Choose the order filters for this report.';
  if (step.value === 2) return 'Add product costs for all matched order products.';
  return 'Add operating costs, tax, and extra expenses for this report.';
});
const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const step = ref(1);
const loadingOptions = ref(true);
const fetching = ref(false);
const saving = ref(false);
const options = ref({ brands: [], couriers: [], sources: [] });
const products = ref([]);
const summary = ref({ orders_count: 0, products_count: 0, total_quantity: 0 });
const productCosts = reactive({});
const errors = reactive({});
const filters = reactive({
  name: '',
  start_date: monthStart,
  end_date: today,
  brand_id: '',
  source: '',
  courier_integration_id: '',
});
const costs = reactive({
  packing_cost: 0,
  total_ad_spend: 0,
  ads_tax_percentage: 8,
  courier_taxes: {},
  extra_expenses: [],
  one_time_expenses: [],
});

const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();

const totalProductCost = computed(() => products.value.reduce((sum, product) => (
  sum + (Number(product.quantity || 0) * Number(productCosts[product.key] || 0))
), 0));

const payload = computed(() => ({
  name: filters.name,
  start_date: filters.start_date,
  end_date: filters.end_date,
  brand_id: filters.brand_id,
  source: filters.source,
  courier_integration_id: filters.courier_integration_id,
  summary: {
    ...summary.value,
    total_product_cost: totalProductCost.value,
  },
  products: products.value.map(product => ({
    key: product.key,
    product_id: product.product_id || '',
    shopify_product_id: product.shopify_product_id || '',
    variant_id: product.variant_id || '',
    sku: product.sku || '',
    name: product.name,
    quantity: Number(product.quantity || 0),
    order_count: Number(product.order_count || 0),
    unit_cost: Number(productCosts[product.key] || 0),
    total_cost: Number(product.quantity || 0) * Number(productCosts[product.key] || 0),
  })),
  packing_cost: Number(costs.packing_cost || 0),
  total_ad_spend: Number(costs.total_ad_spend || 0),
  ads_tax_percentage: Number(costs.ads_tax_percentage || 0),
  courier_taxes: options.value.couriers.map(courier => ({
    courier_integration_id: courier.id,
    tax_percentage: Number(costs.courier_taxes[courier.id] || 0),
  })),
  extra_expenses: activeExtraExpenses.value,
  one_time_expenses: activeOneTimeExpenses.value,
}));

const normalizeExpenses = (expenses = []) => (
  Array.isArray(expenses) ? expenses : []
).map((expense) => ({
  key: crypto.randomUUID(),
  label: String(expense.label || ''),
  value: Number(expense.value || 0),
}));

const normalizeCourierTaxes = (courierTaxes = []) => {
  return Object.fromEntries((courierTaxes || []).map(row => [
    row.courier_integration_id,
    Number(row.tax_percentage || 0),
  ]));
};

const activeExtraExpenses = computed(() => costs.extra_expenses
  .map(expense => ({
    label: String(expense.label || '').trim(),
    value: Number(expense.value || 0),
  }))
  .filter(expense => expense.label || expense.value > 0));

const activeOneTimeExpenses = computed(() => costs.one_time_expenses
  .map(expense => ({
    label: String(expense.label || '').trim(),
    value: Number(expense.value || 0),
  }))
  .filter(expense => expense.label || expense.value > 0));

const syncCourierTaxDefaults = () => {
  options.value.couriers.forEach((courier) => {
    if (costs.courier_taxes[courier.id] === undefined) {
      costs.courier_taxes[courier.id] = 4;
    }
  });
};

const courierTaxValue = (id) => Number(costs.courier_taxes[id] ?? 4);

const setCourierTax = (id, value) => {
  costs.courier_taxes[id] = Number(value || 0);
};

const addExtraExpense = () => {
  costs.extra_expenses.push({ key: crypto.randomUUID(), label: '', value: 0 });
};

const removeExtraExpense = (index) => {
  costs.extra_expenses.splice(index, 1);
};

const addOneTimeExpense = () => {
  costs.one_time_expenses.push({ key: crypto.randomUUID(), label: '', value: 0 });
};

const removeOneTimeExpense = (index) => {
  costs.one_time_expenses.splice(index, 1);
};

const expenseError = (index, field) => errors[`extra_expenses.${index}.${field}`] || '';
const oneTimeExpenseError = (index, field) => errors[`one_time_expenses.${index}.${field}`] || '';

const setErrors = (err) => {
  Object.keys(errors).forEach(key => delete errors[key]);
  const data = err.response?.data;
  if (data?.errors) {
    Object.assign(errors, Object.fromEntries(Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])));
  } else {
    errors.start_date = data?.message || 'Failed to fetch products.';
  }
};

const exitForm = () => {
  router.push(isEdit.value ? `/overall-profit-loss/${reportId}` : '/overall-profit-loss');
};

const goToProducts = async () => {
  Object.keys(errors).forEach(key => delete errors[key]);

  if (!String(filters.name || '').trim()) {
    errors.name = 'Report name is required.';
    return;
  }

  fetching.value = true;

  try {
    const res = await OverallProfitLossService.getProducts({
      start_date: filters.start_date,
      end_date: filters.end_date,
      brand_id: filters.brand_id,
      source: filters.source,
      courier_integration_id: filters.courier_integration_id,
    });
    products.value = res.data.data.products;
    summary.value = res.data.data.summary;
    Object.keys(productCosts).forEach(key => delete productCosts[key]);
    products.value.forEach((product) => {
      productCosts[product.key] = Number(product.default_cost || 0);
    });
    step.value = 2;
  } catch (err) {
    setErrors(err);
  } finally {
    fetching.value = false;
  }
};

const saveReport = async () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  saving.value = true;

  try {
    if (isEdit.value) {
      const res = await OverallProfitLossService.updateReport(reportId, payload.value);
      router.push(`/overall-profit-loss/${res.data.data.report.id}`);
    } else {
      const res = await OverallProfitLossService.createReport(payload.value);
      router.push(`/overall-profit-loss/${res.data.data.report.id}`);
    }
  } catch (err) {
    setErrors(err);
    if (err.response?.data?.errors?.name) {
      step.value = 1;
    }
  } finally {
    saving.value = false;
  }
};

const fillReport = (report) => {
  Object.assign(filters, {
    name: report.name || '',
    start_date: report.start_date || monthStart,
    end_date: report.end_date || today,
    brand_id: report.brand_id || '',
    source: report.source || '',
    courier_integration_id: report.courier_integration_id || '',
  });
  summary.value = report.summary || { orders_count: 0, products_count: 0, total_quantity: 0 };
  products.value = report.products || [];
  Object.keys(productCosts).forEach(key => delete productCosts[key]);
  products.value.forEach((product) => {
    productCosts[product.key] = Number(product.unit_cost ?? product.default_cost ?? 0);
  });
  Object.assign(costs, {
    packing_cost: Number(report.packing_cost || 0),
    total_ad_spend: Number(report.total_ad_spend || 0),
    ads_tax_percentage: Number(report.ads_tax_percentage ?? 8),
    courier_taxes: normalizeCourierTaxes(report.courier_taxes),
    extra_expenses: normalizeExpenses(report.extra_expenses),
    one_time_expenses: normalizeExpenses(report.one_time_expenses),
  });
  syncCourierTaxDefaults();
  step.value = 2;
};

onMounted(async () => {
  try {
    const res = await ProfitLossCalculationService.getOptions();
    options.value = res.data.data.options;
    syncCourierTaxDefaults();
    if (isEdit.value) {
      const reportRes = await OverallProfitLossService.getReport(reportId);
      fillReport(reportRes.data.data.report);
    }
  } finally {
    loadingOptions.value = false;
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.panel {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

h1,
p {
  margin: 0;
}

h1 {
  color: #0f172a;
  font-size: 21px;
}

p {
  margin-top: 5px;
  color: #64748b;
  font-size: 14px;
}

.steps {
  display: flex;
  gap: 10px;
}

.steps button {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  padding: 6px 11px 6px 6px;
  cursor: pointer;
}

.steps button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.steps span {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-weight: 900;
}

.steps strong {
  color: inherit;
  font-size: 12px;
  font-weight: 900;
}

.steps button.active,
.steps button.done {
  border-color: #1e293b;
  background: #1e293b;
  color: #fff;
}

.steps button.active span,
.steps button.done span {
  background: #fff;
  color: #1e293b;
}

.close-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: #fff;
  color: #475569;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.close-btn:hover {
  border-color: #94a3b8;
  color: #0f172a;
}

.step-body,
.loading {
  display: grid;
  gap: 20px;
  padding: 24px 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.sub-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.sub-panel h2 {
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

.form-group {
  display: grid;
  gap: 7px;
}

.form-group span {
  color: #42537a;
  font-size: 14px;
  font-weight: 800;
}

.form-group small {
  color: #dc2626;
  font-size: 12px;
  font-weight: 700;
}

.courier-tax-grid,
.expense-list {
  display: grid;
  gap: 12px;
}

.courier-tax-card,
.expense-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px auto;
  gap: 14px;
  align-items: end;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.courier-tax-card {
  grid-template-columns: minmax(0, 1fr) 220px;
}

.courier-tax-card h3,
.courier-tax-card p {
  margin: 0;
}

.courier-tax-card h3 {
  color: #0f172a;
  font-size: 14px;
}

.courier-tax-card p {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.courier-tax-card label {
  display: grid;
  gap: 7px;
}

.courier-tax-card label span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.empty-row {
  margin: 0;
  padding: 18px;
  color: #64748b;
  text-align: center;
}

.form-input,
.cost-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 44px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  padding: 11px 12px;
  color: #1e293b;
  font-size: 14px;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-strip article,
.footer-total {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
}

.summary-strip span,
.footer-total span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.summary-strip strong,
.footer-total strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 20px;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

th,
td {
  padding: 13px 14px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 14px;
}

th {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
}

td .product-name,
td small {
  display: block;
}

td .product-name {
  color: #0f172a;
  font-weight: 600;
}

td small {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.money-cell {
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}

.footer-total {
  justify-self: end;
  min-width: 260px;
  text-align: right;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary-btn,
.secondary-btn {
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.primary-btn {
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
}

.primary-btn:disabled {
  border-color: #94a3b8;
  background: #94a3b8;
  cursor: not-allowed;
}

.secondary-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.small-btn {
  min-height: 36px;
  padding: 8px 12px;
  white-space: nowrap;
}

.remove-btn {
  min-height: 44px;
}

@media (max-width: 950px) {
  .form-grid,
  .summary-strip,
  .courier-tax-card,
  .expense-row {
    grid-template-columns: 1fr;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-tools {
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
  }

  .steps {
    flex-wrap: wrap;
  }

  .footer-total {
    justify-self: stretch;
  }
}
</style>
