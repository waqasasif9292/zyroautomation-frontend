<template>
  <AppLayout>
    <main class="product-report-page">
      <section class="page-head">
        <div>
          <p class="eyebrow">Reports</p>
          <h1>Product Report</h1>
          <p>Analyze product order performance by brand, source, date, status, courier returns, and delivery charges.</p>
        </div>
        <button class="run-btn" type="button" :disabled="loading || !selectedProductIds.length" @click="fetchReport">
          {{ loading ? 'Running...' : 'Run Report' }}
        </button>
      </section>

      <section class="filters-panel">
        <div class="filter-row">
          <label>
            <span>Date From</span>
            <input v-model="filters.date_from" type="date">
          </label>
          <label>
            <span>Date To</span>
            <input v-model="filters.date_to" type="date">
          </label>
          <label>
            <span>Brand</span>
            <select v-model="filters.brand_id">
              <option value="">All brands</option>
              <option v-for="brand in brandStore.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
            </select>
          </label>
          <label>
            <span>Source</span>
            <select v-model="filters.source">
              <option value="">All sources</option>
              <option v-for="source in sourceOptions" :key="source" :value="source">{{ source }}</option>
            </select>
          </label>
        </div>

        <div class="product-selector">
          <div class="product-selector-head">
            <div>
              <span>Products</span>
              <strong>{{ selectedProductIds.length }} selected</strong>
            </div>
            <button type="button" @click="clearProducts">Clear</button>
          </div>

          <div class="product-search">
            <input
              v-model="productSearch"
              type="search"
              placeholder="Search products to add"
              @focus="productSearchFocused = true"
              @blur="closeProductSearch"
              @keydown.esc="closeProductSearch"
            >
            <div v-if="showProductOptions" class="product-options">
              <button
                v-for="product in searchResults"
                :key="product.id"
                type="button"
                class="product-option"
                @mousedown.prevent="selectProduct(product)"
              >
                <span>{{ product.name }}</span>
                <small>{{ product.sku || product.shopify_product_id || 'No SKU' }}</small>
              </button>
              <div v-if="!searchResults.length" class="empty-inline">No products found.</div>
            </div>
          </div>

          <div v-if="selectedProducts.length" class="selected-products">
            <div v-for="product in selectedProducts" :key="product.id" class="selected-product">
              <div>
                <strong>{{ product.name }}</strong>
                <span>{{ product.sku || product.shopify_product_id || 'No SKU' }}</span>
              </div>
              <button type="button" aria-label="Remove product" @click="removeProduct(product.id)">Remove</button>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
      </section>

      <section v-if="report" class="report-results">
        <div class="summary-grid">
          <div v-for="metric in summaryMetrics" :key="metric.key" class="metric">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small v-if="metric.note">{{ metric.note }}</small>
          </div>
        </div>

        <div class="panel-grid">
          <section class="panel">
            <div class="panel-head">
              <h2>Status Breakdown</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Dispatched Orders</th>
                  <th>Units</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.status_breakdown" :key="row.key">
                  <td>{{ row.label }}</td>
                  <td>{{ formatNumber(row.orders) }}</td>
                  <td>{{ formatNumber(row.units) }}</td>
                  <td>{{ row.percentage }}%</td>
                </tr>
                <tr v-if="!report.status_breakdown.length"><td colspan="4">No matching orders.</td></tr>
              </tbody>
            </table>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>Courier Return Report</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Dispatched</th>
                  <th>Delivered</th>
                  <th>Returned</th>
                  <th>Return %</th>
                  <th>Charges</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.courier_returns" :key="row.courier_id || 'unassigned'">
                  <td>{{ row.courier_name }}</td>
                  <td>{{ formatNumber(row.total_orders) }}</td>
                  <td>{{ formatNumber(row.delivered_orders) }}</td>
                  <td>{{ formatNumber(row.returned_orders) }}</td>
                  <td>{{ row.return_rate }}%</td>
                  <td>{{ formatMoney(row.delivery_charges) }}</td>
                </tr>
                <tr v-if="!report.courier_returns.length"><td colspan="6">No courier data.</td></tr>
              </tbody>
            </table>
          </section>
        </div>

        <section class="panel">
          <div class="panel-head">
            <h2>Product Breakdown</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Dispatched Orders</th>
                <th>Units</th>
                <th>Revenue</th>
                <th>Delivered</th>
                <th>Returned</th>
                <th>Return %</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.product_breakdown" :key="row.product_id">
                <td>{{ row.product_name }}</td>
                <td>{{ formatNumber(row.orders) }}</td>
                <td>{{ formatNumber(row.units) }}</td>
                <td>{{ formatMoney(row.revenue) }}</td>
                <td>{{ formatNumber(row.delivered_orders) }}</td>
                <td>{{ formatNumber(row.returned_orders) }}</td>
                <td>{{ row.return_rate }}%</td>
              </tr>
              <tr v-if="!report.product_breakdown.length"><td colspan="7">No product performance found.</td></tr>
            </tbody>
          </table>
        </section>

        <div class="panel-grid">
          <section class="panel">
            <div class="panel-head">
              <h2>Brand Breakdown</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Dispatched Orders</th>
                  <th>Units</th>
                  <th>Revenue</th>
                  <th>Returned</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.brand_breakdown" :key="row.brand_id || 'unassigned'">
                  <td>{{ row.brand_name }}</td>
                  <td>{{ formatNumber(row.orders) }}</td>
                  <td>{{ formatNumber(row.units) }}</td>
                  <td>{{ formatMoney(row.revenue) }}</td>
                  <td>{{ formatNumber(row.returned_orders) }}</td>
                </tr>
                <tr v-if="!report.brand_breakdown.length"><td colspan="5">No brand data.</td></tr>
              </tbody>
            </table>
          </section>

          <section class="panel">
            <div class="panel-head">
              <h2>Source Breakdown</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Dispatched Orders</th>
                  <th>Units</th>
                  <th>Revenue</th>
                  <th>Returned</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in report.source_breakdown" :key="row.source">
                  <td>{{ row.source }}</td>
                  <td>{{ formatNumber(row.orders) }}</td>
                  <td>{{ formatNumber(row.units) }}</td>
                  <td>{{ formatMoney(row.revenue) }}</td>
                  <td>{{ formatNumber(row.returned_orders) }}</td>
                </tr>
                <tr v-if="!report.source_breakdown.length"><td colspan="5">No source data.</td></tr>
              </tbody>
            </table>
          </section>
        </div>

        <section class="panel">
          <div class="panel-head">
            <h2>Recent Matching Orders</h2>
            <span>{{ report.recent_orders.length }} shown</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Brand</th>
                <th>Source</th>
                <th>Courier</th>
                <th>Status</th>
                <th>Units</th>
                <th>Revenue</th>
                <th>Charges</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in report.recent_orders" :key="order.id">
                <td>{{ order.order_name || order.id }}</td>
                <td>{{ order.date || '-' }}</td>
                <td>{{ order.brand_name }}</td>
                <td>{{ order.source }}</td>
                <td>{{ order.courier_name }}</td>
                <td>{{ order.status }}</td>
                <td>{{ formatNumber(order.units) }}</td>
                <td>{{ formatMoney(order.product_revenue) }}</td>
                <td>{{ formatMoney(order.delivery_charges) }}</td>
              </tr>
              <tr v-if="!report.recent_orders.length"><td colspan="9">No matching orders found.</td></tr>
            </tbody>
          </table>
        </section>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import ProductReportService from '../services/ProductReportService';
import { useBrandStore } from '../stores/brandStore';
import { useProductStore } from '../stores/productStore';

const brandStore = useBrandStore();
const productStore = useProductStore();
const loading = ref(false);
const errorMessage = ref('');
const report = ref(null);
const productSearch = ref('');
const productSearchFocused = ref(false);
const selectedProductIds = ref([]);
const filters = reactive({
  date_from: '',
  date_to: '',
  brand_id: '',
  source: '',
});

const sourceOptions = computed(() => {
  const defaults = ['Website', 'WhatsApp', 'Abandoned', 'Social'];
  const brandSources = brandStore.brands.flatMap(brand => brand.sources || []);
  return [...new Set([...defaults, ...brandSources].filter(Boolean))].sort();
});

const selectedProducts = computed(() => {
  const selected = new Set(selectedProductIds.value);
  return productStore.products.filter(product => selected.has(product.id));
});

const searchResults = computed(() => {
  const term = productSearch.value.trim().toLowerCase();
  if (!term) return [];
  const selected = new Set(selectedProductIds.value);

  return productStore.products
    .filter(product => !selected.has(product.id))
    .filter(product => [
      product.name,
      product.sku,
      product.shopify_product_id,
      product.shopify_variant_id,
    ].some(value => String(value || '').toLowerCase().includes(term)))
    .slice(0, 12);
});

const showProductOptions = computed(() => productSearchFocused.value && productSearch.value.trim().length > 0);

const summaryMetrics = computed(() => {
  const summary = report.value?.summary || {};
  return [
    { key: 'total-orders', label: 'Total Orders', value: formatNumber(summary.total_orders) },
    { key: 'orders', label: 'Dispatched Orders', value: formatNumber(summary.dispatched_orders), note: 'Total minus cancelled' },
    { key: 'units', label: 'Units Sold', value: formatNumber(summary.dispatched_units), note: 'From dispatched orders' },
    { key: 'revenue', label: 'Product Revenue', value: formatMoney(summary.dispatched_product_revenue), note: 'From dispatched orders' },
    { key: 'delivered', label: 'Delivered', value: `${formatNumber(summary.delivered_orders)} (${summary.delivery_rate_from_dispatched || 0}%)`, note: 'From dispatched orders' },
    { key: 'returned', label: 'Returned', value: `${formatNumber(summary.returned_orders)} (${summary.return_rate_from_dispatched || 0}%)`, note: 'From dispatched orders' },
    { key: 'ofd', label: 'Out For Delivery', value: formatNumber(summary.out_for_delivery_orders), note: 'From dispatched orders' },
    { key: 'charges', label: 'Delivery Charges', value: formatMoney(summary.dispatched_delivery_charges), note: 'From dispatched orders' },
  ];
});

const formatNumber = value => Number(value || 0).toLocaleString();
const formatMoney = value => `PKR ${Number(value || 0).toLocaleString()}`;

const clearProducts = () => {
  selectedProductIds.value = [];
};

const closeProductSearch = () => {
  setTimeout(() => {
    productSearchFocused.value = false;
  }, 120);
};

const selectProduct = (product) => {
  if (!selectedProductIds.value.includes(product.id)) {
    selectedProductIds.value = [...selectedProductIds.value, product.id];
  }
  productSearch.value = '';
  productSearchFocused.value = true;
};

const removeProduct = (id) => {
  selectedProductIds.value = selectedProductIds.value.filter(productId => productId !== id);
};

const requestParams = () => {
  const params = {
    product_ids: selectedProductIds.value,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
    brand_id: filters.brand_id || undefined,
    source: filters.source || undefined,
  };

  return Object.fromEntries(Object.entries(params).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  }));
};

const fetchReport = async () => {
  if (!selectedProductIds.value.length) {
    errorMessage.value = 'Select at least one product to run the report.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await ProductReportService.getReport(requestParams());
    report.value = res.data.data;
  } catch (error) {
    report.value = null;
    errorMessage.value = error.response?.data?.message || 'Unable to run product report.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
    productStore.products.length ? Promise.resolve() : productStore.fetchProducts(),
  ]);
});
</script>

<style scoped>
.product-report-page {
  min-height: 100vh;
  padding: 28px;
  background: #f6f8fb;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.page-head h1 {
  margin: 0;
  color: #0f172a;
  font-size: 26px;
  font-weight: 900;
}

.page-head p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.run-btn,
.product-selector-head button {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  padding: 9px 13px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.run-btn {
  background: #1e293b;
  color: #fff;
  border-color: #1e293b;
}

.run-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.filters-panel,
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.filters-panel {
  padding: 18px;
  margin-bottom: 18px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

label span,
.product-selector-head span {
  display: block;
  margin-bottom: 7px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

input,
select {
  width: 100%;
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
  padding: 0 11px;
  outline: none;
}

.product-selector {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.product-selector-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.product-selector-head strong {
  color: #0f172a;
  font-size: 14px;
}

.product-search {
  position: relative;
}

.product-options {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.product-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;
}

.product-option:hover {
  background: #f8fafc;
}

.product-option span,
.selected-product strong {
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
  text-transform: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-option small {
  margin-left: auto;
  color: #64748b;
  font-size: 11px;
}

.selected-products {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.selected-product {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px 10px;
}

.selected-product div {
  min-width: 0;
}

.selected-product strong,
.selected-product span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-product span {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.selected-product button {
  flex: 0 0 auto;
  border: 1px solid #fecaca;
  border-radius: 7px;
  background: #fff;
  color: #dc2626;
  padding: 7px 9px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.form-error,
.empty-inline {
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
}

.empty-inline {
  color: #64748b;
  padding: 12px;
}

.report-results {
  display: grid;
  gap: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}

.metric span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.metric strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 24px;
  font-weight: 950;
}

.metric small {
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel {
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
  padding: 15px 16px;
}

.panel-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
}

.panel-head span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #f1f5f9;
  padding: 11px 13px;
  color: #334155;
  font-size: 13px;
  text-align: left;
  vertical-align: top;
}

th {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

tbody tr:hover {
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .filter-row,
  .summary-grid,
  .panel-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .selected-products {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .product-report-page {
    padding: 18px;
  }

  .page-head {
    flex-direction: column;
  }

  .filter-row,
  .summary-grid,
  .panel-grid,
  .selected-products {
    grid-template-columns: 1fr;
  }
}
</style>
