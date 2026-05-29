<template>
  <AppLayout>
    <main class="inventory-page">
      <section class="page-head">
        <div>
          <p class="eyebrow">Inventory</p>
          <h1>Stock Control</h1>
          <p>Available, booked, sold, and every stock movement.</p>
        </div>
        <button class="secondary-btn" type="button" :disabled="loading" @click="loadAll">Reload</button>
      </section>

      <section class="stats-grid">
        <div v-for="item in stats" :key="item.label" class="stat-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </section>

      <section class="inventory-tabs">
        <button :class="['tab-btn', { active: activeTab === 'products' }]" type="button" @click="activeTab = 'products'">
          Products
        </button>
        <button :class="['tab-btn', { active: activeTab === 'movements' }]" type="button" @click="activeTab = 'movements'">
          Movements
        </button>
      </section>

      <section v-if="activeTab === 'products'" class="panel">
        <div class="panel-head">
          <div>
            <h2>Products</h2>
            <p>Stock can go below zero; orders are never blocked.</p>
            <p v-if="reconcileError" class="error-text">{{ reconcileError }}</p>
          </div>
          <div class="search-row">
            <input v-model="productSearch" type="search" placeholder="Search product or SKU" @keyup.enter="loadProducts">
            <button class="primary-btn" type="button" @click="loadProducts">Search</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Available</th>
                <th>Booked</th>
                <th>Sold</th>
                <th>Avg Cost</th>
                <th>Latest Cost</th>
                <th>Batches</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="10">Loading inventory...</td>
              </tr>
              <tr v-else-if="products.length === 0">
                <td colspan="10">No products found.</td>
              </tr>
              <template v-else>
                <template v-for="product in products" :key="product.id">
                  <tr>
                    <td class="strong">{{ product.name }}</td>
                    <td>{{ product.sku || '-' }}</td>
                    <td :class="stockClass(product.available_stock)">{{ number(product.available_stock) }}</td>
                    <td>{{ number(product.booked_stock) }}</td>
                    <td>{{ number(product.sold_stock) }}</td>
                    <td>{{ money(product.average_purchase_cost) }}</td>
                    <td>{{ money(product.latest_purchase_cost) }}</td>
                    <td>{{ number(product.batch_count) }}</td>
                    <td>{{ money(product.stock_value) }}</td>
                    <td class="right">
                      <div class="action-stack">
                        <button class="link-btn" type="button" @click="openAdjust(product)">Adjust</button>
                        <button
                          v-if="Number(product.unbatched_allocation_count || 0) > 0"
                          class="link-btn warn"
                          type="button"
                          :disabled="reconcileSaving[product.id]"
                          @click="reconcileProduct(product)"
                        >
                          Reconcile {{ number(product.unbatched_allocation_quantity) }}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="product.batches?.length" class="batch-row">
                    <td colspan="10">
                      <div class="batch-list">
                        <span class="batch-label">Recent purchase batches</span>
                        <button v-for="batch in product.batches" :key="batch.id" class="batch-pill" type="button" @click="openBatchEdit(product, batch)">
                          {{ date(batch.purchase_date) }} · {{ number(batch.remaining_quantity) }}/{{ number(batch.quantity) }} units · {{ money(batch.unit_cost) }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="activeTab === 'movements'" class="panel">
        <div class="panel-head">
          <div>
            <h2>Movements</h2>
            <p>Audit trail for bookings, shipments, returns, and adjustments.</p>
          </div>
          <div class="search-row">
            <input v-model="movementSearch" type="search" placeholder="Search order or reason" @keyup.enter="loadMovements(1)">
            <select v-model="movementProductId" @change="loadMovements(1)">
              <option value="">All products</option>
              <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
            </select>
            <select v-model="movementType" @change="loadMovements(1)">
              <option value="">All types</option>
              <option v-for="type in movementTypes" :key="type" :value="type">{{ labelType(type) }}</option>
            </select>
            <input v-model="movementDateFrom" type="date" aria-label="Movement date from" @change="loadMovements(1)">
            <input v-model="movementDateTo" type="date" aria-label="Movement date to" @change="loadMovements(1)">
            <button class="primary-btn" type="button" @click="loadMovements(1)">Search</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Order</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Batch Cost</th>
                <th>Available</th>
                <th>Booked</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="movementsLoading">
                <td colspan="9">Loading movements...</td>
              </tr>
              <tr v-else-if="movements.length === 0">
                <td colspan="9">No movements found.</td>
              </tr>
              <tr v-for="movement in movements" v-else :key="movement.id">
                <td>{{ dateTime(movement.created_at) }}</td>
                <td class="strong">{{ movement.product_name }}</td>
                <td>{{ movement.order_name || '-' }}</td>
                <td>{{ labelType(movement.type) }}</td>
                <td>{{ number(movement.quantity) }}</td>
                <td>
                  <div class="cost-cell">
                    <strong v-if="movement.batch_cost?.amount !== null && movement.batch_cost?.amount !== undefined">
                      {{ money(movement.batch_cost.amount) }}
                    </strong>
                    <strong v-else>-</strong>
                    <span v-if="movement.batch_cost?.label && movement.batch_cost.label !== '-'">{{ movement.batch_cost.label }}</span>
                  </div>
                </td>
                <td :class="deltaClass(movement.available_delta)">{{ signed(movement.available_delta) }}</td>
                <td :class="deltaClass(movement.booked_delta)">{{ signed(movement.booked_delta) }}</td>
                <td :class="deltaClass(movement.sold_delta)">{{ signed(movement.sold_delta) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <OrderPagination :pagination="pagination" item-label="movements" @page-change="loadMovements" />
      </section>

      <div v-if="adjustProduct" class="modal-backdrop" @click.self="closeAdjust">
        <form class="modal" @submit.prevent="saveAdjustment">
          <h2>Adjust Stock</h2>
          <p>{{ adjustProduct.name }}</p>
          <label>
            Available delta
            <input v-model.number="adjustForm.available_delta" type="number" step="1">
          </label>
          <label v-if="Number(adjustForm.available_delta || 0) > 0">
            Purchase unit cost
            <input v-model.number="adjustForm.unit_cost" type="number" min="0" step="0.01">
          </label>
          <label>
            Reason
            <textarea v-model="adjustForm.reason" rows="3" placeholder="Stock count, damaged, found stock..."></textarea>
          </label>
          <span v-if="adjustError" class="error-text">{{ adjustError }}</span>
          <div class="modal-actions">
            <button class="secondary-btn" type="button" :disabled="adjustSaving" @click="closeAdjust">Cancel</button>
            <button class="primary-btn" type="submit" :disabled="adjustSaving">Save</button>
          </div>
        </form>
      </div>

      <div v-if="editingBatch" class="modal-backdrop" @click.self="closeBatchEdit">
        <form class="modal" @submit.prevent="saveBatchEdit">
          <h2>Edit Batch Cost</h2>
          <p>{{ editingBatch.productName }}</p>
          <label>
            Unit cost
            <input v-model.number="batchForm.unit_cost" type="number" min="0" step="0.01">
          </label>
          <label>
            Notes
            <textarea v-model="batchForm.notes" rows="3" placeholder="Reason for price correction..."></textarea>
          </label>
          <label class="checkbox-row">
            <input v-model="batchForm.apply_existing_allocations" type="checkbox">
            Correct existing order allocations from this batch
          </label>
          <span v-if="batchError" class="error-text">{{ batchError }}</span>
          <div class="modal-actions">
            <button class="secondary-btn" type="button" :disabled="batchSaving" @click="closeBatchEdit">Cancel</button>
            <button class="primary-btn" type="submit" :disabled="batchSaving">Save Batch</button>
          </div>
        </form>
      </div>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import OrderPagination from '../components/orders/OrderPagination.vue';
import InventoryService from '../services/InventoryService';

const loading = ref(false);
const movementsLoading = ref(false);
const summary = ref({});
const products = ref([]);
const movements = ref([]);
const pagination = ref(null);
const productSearch = ref('');
const movementSearch = ref('');
const movementProductId = ref('');
const movementType = ref('');
const movementDateFrom = ref('');
const movementDateTo = ref('');
const activeTab = ref('products');
const adjustProduct = ref(null);
const adjustSaving = ref(false);
const adjustError = ref('');
const adjustForm = reactive({ available_delta: 0, unit_cost: 0, reason: '' });
const editingBatch = ref(null);
const batchSaving = ref(false);
const batchError = ref('');
const batchForm = reactive({ unit_cost: 0, notes: '', apply_existing_allocations: false });
const reconcileSaving = ref({});
const reconcileError = ref('');

const movementTypes = ['book', 'unbook', 'ship', 'unship', 'return_receive', 'return_unreceive', 'adjustment', 'book_adjustment', 'sold_adjustment'];

const stats = computed(() => [
  { label: 'Products', value: number(summary.value.products) },
  { label: 'Available', value: number(summary.value.available_stock) },
  { label: 'Booked', value: number(summary.value.booked_stock) },
  { label: 'Sold', value: number(summary.value.sold_stock) },
  { label: 'Low Stock', value: number(summary.value.low_stock) },
  { label: 'Stock Value', value: money(summary.value.stock_value) },
]);

const loadSummary = async () => {
  const res = await InventoryService.getSummary();
  summary.value = res.data.data.summary;
};

const loadProducts = async () => {
  const res = await InventoryService.getProducts({ search: productSearch.value || undefined });
  products.value = res.data.data.products;
};

const loadMovements = async (page = 1) => {
  movementsLoading.value = true;
  try {
    const res = await InventoryService.getMovements({
      page,
      per_page: 50,
      search: movementSearch.value || undefined,
      product_id: movementProductId.value || undefined,
      type: movementType.value || undefined,
      date_from: movementDateFrom.value || undefined,
      date_to: movementDateTo.value || undefined,
    });
    movements.value = res.data.data.movements;
    pagination.value = res.data.data.pagination;
  } finally {
    movementsLoading.value = false;
  }
};

const loadAll = async () => {
  loading.value = true;
  try {
    await Promise.all([loadSummary(), loadProducts(), loadMovements(1)]);
  } finally {
    loading.value = false;
  }
};

const openAdjust = (product) => {
  adjustProduct.value = product;
  adjustForm.available_delta = 0;
  adjustForm.unit_cost = Number(product.latest_purchase_cost || product.cost || 0);
  adjustForm.reason = '';
  adjustError.value = '';
};

const closeAdjust = () => {
  if (adjustSaving.value) return;
  adjustProduct.value = null;
};

const openBatchEdit = (product, batch) => {
  editingBatch.value = { ...batch, productName: product.name };
  batchForm.unit_cost = Number(batch.unit_cost || 0);
  batchForm.notes = batch.notes || '';
  batchForm.apply_existing_allocations = false;
  batchError.value = '';
};

const closeBatchEdit = () => {
  if (batchSaving.value) return;
  editingBatch.value = null;
};

const saveBatchEdit = async () => {
  if (!editingBatch.value) return;
  batchSaving.value = true;
  batchError.value = '';
  try {
    await InventoryService.updateBatch(editingBatch.value.id, {
      unit_cost: Number(batchForm.unit_cost || 0),
      notes: batchForm.notes || undefined,
      apply_existing_allocations: batchForm.apply_existing_allocations,
    });
    editingBatch.value = null;
    await loadAll();
  } catch (error) {
    batchError.value = error.response?.data?.message || 'Unable to update batch.';
  } finally {
    batchSaving.value = false;
  }
};

const reconcileProduct = async (product) => {
  reconcileSaving.value = { ...reconcileSaving.value, [product.id]: true };
  reconcileError.value = '';
  try {
    await InventoryService.reconcileUnbatched(product.id);
    await loadAll();
  } catch (error) {
    reconcileError.value = error.response?.data?.message || 'Unable to reconcile unbatched orders.';
  } finally {
    reconcileSaving.value = { ...reconcileSaving.value, [product.id]: false };
  }
};

const saveAdjustment = async () => {
  if (!adjustProduct.value) return;
  if (!adjustForm.reason.trim()) {
    adjustError.value = 'Reason is required.';
    return;
  }

  adjustSaving.value = true;
  adjustError.value = '';
  try {
    const payload = {
      available_delta: Number(adjustForm.available_delta || 0),
      reason: adjustForm.reason.trim(),
    };

    if (payload.available_delta > 0) {
      payload.unit_cost = Number(adjustForm.unit_cost || 0);
    }

    await InventoryService.adjustProduct(adjustProduct.value.id, payload);
    adjustProduct.value = null;
    await loadAll();
  } catch (error) {
    adjustError.value = error.response?.data?.message || 'Unable to save adjustment.';
  } finally {
    adjustSaving.value = false;
  }
};

const number = (value) => Number(value || 0).toLocaleString();
const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;
const signed = (value) => {
  const numeric = Number(value || 0);
  return numeric > 0 ? `+${number(numeric)}` : number(numeric);
};
const stockClass = (value) => Number(value || 0) < 0 ? 'negative strong' : 'strong';
const deltaClass = (value) => Number(value || 0) < 0 ? 'negative' : Number(value || 0) > 0 ? 'positive' : '';
const labelType = (value) => String(value || '').replaceAll('_', ' ');
const dateTime = (value) => value ? new Date(value).toLocaleString() : '-';
const date = (value) => value ? new Date(value).toLocaleDateString() : '-';

onMounted(loadAll);
</script>

<style scoped>
.inventory-page {
  min-height: 100vh;
  padding: 28px;
  background: #f1f5f9;
}

.page-head,
.panel {
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #52627a;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #0f172a;
  font-size: 24px;
}

h2 {
  color: #0f172a;
  font-size: 17px;
}

p {
  color: #52627a;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}

.stat-card {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 22px;
}

.inventory-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 0;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
  padding: 4px;
}

.tab-btn {
  min-width: 120px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.tab-btn.active {
  background: #1e293b;
  color: #fff;
}

.panel {
  margin-top: 16px;
  padding: 20px;
}

.panel-head,
.search-row,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-row {
  justify-content: flex-end;
}

input,
select,
textarea {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.search-row input {
  width: 240px;
}

.table-wrap {
  margin-top: 16px;
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

tr:last-child td {
  border-bottom: 0;
}

.batch-row td {
  background: #f8fafc;
  padding-top: 10px;
  padding-bottom: 10px;
}

.batch-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.batch-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.batch-pill {
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  background: #fff;
  color: #334155;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.batch-pill:hover {
  border-color: #2563eb;
  color: #1d4ed8;
}

.cost-cell {
  display: grid;
  gap: 2px;
}

.cost-cell strong {
  color: #0f172a;
  font-weight: 800;
}

.cost-cell span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.strong {
  color: #0f172a;
  font-weight: 800;
}

.right {
  text-align: right;
}

.action-stack {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.positive {
  color: #047857;
  font-weight: 800;
}

.negative {
  color: #dc2626;
  font-weight: 800;
}

.primary-btn,
.secondary-btn,
.link-btn {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.primary-btn {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

.secondary-btn,
.link-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
}

.link-btn {
  padding: 7px 10px;
}

.link-btn.warn {
  border-color: #f59e0b;
  color: #92400e;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.link-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  z-index: 50;
}

.modal {
  width: min(440px, calc(100vw - 32px));
  display: grid;
  gap: 14px;
  border-radius: 8px;
  background: #fff;
  padding: 22px;
}

.modal label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.modal .checkbox-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  line-height: 1.4;
}

.checkbox-row input {
  width: 16px;
  height: 16px;
  padding: 0;
}

.error-text {
  color: #dc2626;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .panel-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .inventory-page {
    padding: 16px;
  }

  .page-head,
  .search-row {
    align-items: stretch;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .inventory-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .tab-btn {
    min-width: 0;
    width: 100%;
  }

  .search-row,
  .search-row input,
  .search-row select,
  .search-row button {
    width: 100%;
  }
}
</style>
