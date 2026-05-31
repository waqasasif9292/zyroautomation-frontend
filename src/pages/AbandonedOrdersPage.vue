<template>
  <AppLayout>
    <main class="abandoned-page">
      <section class="orders-panel">
        <header class="panel-header">
          <div>
            <h1>Abandoned Orders</h1>
            <p>Draft and abandoned checkout data received from brand webhooks.</p>
          </div>
          <div class="header-actions">
            <span class="count-pill">{{ store.pagination?.total || 0 }} orders</span>
            <button class="refresh-btn" type="button" :disabled="store.loading" @click="reloadOrders">
              <svg :class="{ spinning: store.loading }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M16 8h5V3" />
              </svg>
              {{ store.loading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </header>

        <div class="panel-body">
          <section class="stats-grid">
            <div
              v-for="stat in statCards"
              :key="stat.key"
              class="stat-card"
            >
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
            </div>
          </section>

          <div class="filters-bar">
            <div class="search-wrap">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                v-model="localSearch"
                class="search-input"
                type="text"
                placeholder="Search name, phone, email, brand, address..."
              >
              <button v-if="localSearch" class="clear-search" type="button" @click="localSearch = ''">×</button>
            </div>

            <input v-model="draftFilters.date_from" class="filter-control" type="date" aria-label="Date From">
            <input v-model="draftFilters.date_to" class="filter-control" type="date" aria-label="Date To">

            <select v-model="draftFilters.brand_id" class="filter-control">
              <option value="">All Brands</option>
              <option v-for="brand in store.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
            </select>

            <select v-model="draftFilters.status" class="filter-control">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="complete">Complete</option>
              <option value="cancel">Cancel</option>
            </select>

            <select v-model="draftFilters.sort" class="filter-control">
              <option value="received_desc">Newest Received</option>
              <option value="received_asc">Oldest Received</option>
              <option value="total_desc">Total: High to Low</option>
              <option value="total_asc">Total: Low to High</option>
            </select>

            <button class="apply-filters-btn" type="button" @click="applyFilters">Apply</button>
            <button class="clear-filters-btn" type="button" @click="clearFilters">Clear</button>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Brand</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="store.loading">
                  <td colspan="10" class="state-cell">Loading abandoned orders...</td>
                </tr>
                <tr v-else-if="store.orders.length === 0">
                  <td colspan="10" class="state-cell">No abandoned orders found.</td>
                </tr>
                <tr v-for="(order, index) in store.orders" v-else :key="order.id">
                  <td>{{ serialStart + index }}</td>
                  <td>
                    <strong>{{ order.order_name || '-' }}</strong>
                    <span class="subtext">{{ formatDate(order.shopify_created_at || order.webhook_received_at) }}</span>
                  </td>
                  <td>{{ order.brand_name || '-' }}</td>
                  <td>
                    <strong>{{ order.customer?.name || 'Unknown Customer' }}</strong>
                    <span class="subtext">{{ order.email || order.customer?.email || '-' }}</span>
                  </td>
                  <td class="phone-cell">
                    <span>{{ orderPhone(order) }}</span>
                    <button
                      v-if="mainOrderCount(order) > 0"
                      class="main-orders-badge"
                      type="button"
                      :title="`View ${mainOrderCount(order)} matching main orders`"
                      @click="openMainOrders(order)"
                    >
                      {{ mainOrderCount(order) }} main {{ mainOrderCount(order) === 1 ? 'order' : 'orders' }}
                    </button>
                  </td>
                  <td class="address-cell">{{ primaryAddress(order) || '-' }}</td>
                  <td class="items-cell">
                    <span>{{ itemCount(order) }} items</span>
                    <span class="subtext">{{ itemSummary(order) }}</span>
                  </td>
                  <td>{{ money(order.total_price, order.currency) }}</td>
                  <td><span class="status-pill">{{ order.status || 'open' }}</span></td>
                  <td class="actions-cell">
                    <button class="action-btn view-btn" type="button" title="View order" aria-label="View order" @click="selectedOrder = order">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      v-if="(order.status || 'pending') === 'pending'"
                      class="action-btn create-order-btn"
                      type="button"
                      title="Create order"
                      aria-label="Create order"
                      @click="createOrderFromAbandoned(order)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <button
                      class="action-btn complete-btn"
                      type="button"
                      title="Mark complete"
                      aria-label="Mark complete"
                      :disabled="actionLoading || order.status === 'complete'"
                      @click="openStatusConfirm(order, 'complete')"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button
                      class="action-btn cancel-btn"
                      type="button"
                      title="Cancel order"
                      aria-label="Cancel order"
                      :disabled="actionLoading || order.status === 'cancel'"
                      @click="openStatusConfirm(order, 'cancel')"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                    <button
                      class="action-btn delete-btn"
                      type="button"
                      title="Delete order"
                      aria-label="Delete order"
                      :disabled="actionLoading"
                      @click="openDeleteConfirm(order)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6 18 20H6L5 6" />
                        <path d="M10 11v5" />
                        <path d="M14 11v5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="store.pagination" class="pagination">
            <button type="button" :disabled="!store.pagination.has_prev" @click="changePage(store.pagination.current_page - 1)">Previous</button>
            <span>Page {{ store.pagination.current_page }} of {{ store.pagination.total_pages }}</span>
            <button type="button" :disabled="!store.pagination.has_next" @click="changePage(store.pagination.current_page + 1)">Next</button>
          </div>
        </div>
      </section>

      <Teleport to="body">
        <div v-if="selectedOrder" class="detail-root">
          <button class="detail-overlay" type="button" aria-label="Close" @click="selectedOrder = null"></button>
          <aside class="detail-panel">
            <header class="detail-header">
              <div>
                <h2>{{ selectedOrder.order_name || 'Abandoned Order' }}</h2>
                <p>{{ selectedOrder.brand_name || '-' }} · {{ formatDate(selectedOrder.webhook_received_at) }}</p>
                <span class="status-pill">{{ selectedOrder.status || 'pending' }}</span>
              </div>
              <div class="detail-header-actions">
                <button
                  class="action-btn complete-btn"
                  type="button"
                  title="Mark complete"
                  aria-label="Mark complete"
                  :disabled="actionLoading || selectedOrder.status === 'complete'"
                  @click="openStatusConfirm(selectedOrder, 'complete')"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </button>
                <button
                  class="action-btn cancel-btn"
                  type="button"
                  title="Cancel order"
                  aria-label="Cancel order"
                  :disabled="actionLoading || selectedOrder.status === 'cancel'"
                  @click="openStatusConfirm(selectedOrder, 'cancel')"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
                <button
                  class="action-btn delete-btn"
                  type="button"
                  title="Delete order"
                  aria-label="Delete order"
                  :disabled="actionLoading"
                  @click="openDeleteConfirm(selectedOrder)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6 18 20H6L5 6" />
                    <path d="M10 11v5" />
                    <path d="M14 11v5" />
                  </svg>
                </button>
                <button class="detail-close" type="button" aria-label="Close" @click="selectedOrder = null">×</button>
              </div>
            </header>

            <div class="detail-body">
              <section class="detail-section">
                <h3>Customer</h3>
                <div class="detail-grid">
                  <div><span>Name</span><strong>{{ selectedOrder.customer?.name || '-' }}</strong></div>
                  <div><span>Email</span><strong>{{ selectedOrder.email || selectedOrder.customer?.email || '-' }}</strong></div>
                  <div>
                    <span>Phone</span>
                    <strong>{{ orderPhone(selectedOrder) }}</strong>
                    <button
                      v-if="mainOrderCount(selectedOrder) > 0"
                      class="main-orders-badge detail-match-badge"
                      type="button"
                      @click="openMainOrders(selectedOrder)"
                    >
                      {{ mainOrderCount(selectedOrder) }} matching main {{ mainOrderCount(selectedOrder) === 1 ? 'order' : 'orders' }}
                    </button>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h3>Addresses</h3>
                <div class="address-block">
                  <h4>Primary</h4>
                  <p>{{ primaryAddress(selectedOrder) || '-' }}</p>
                </div>
                <div class="address-list">
                  <div v-for="address in addressCards(selectedOrder)" :key="address.key" class="address-block">
                    <h4>{{ address.label }}</h4>
                    <p>{{ address.value || '-' }}</p>
                    <span v-if="address.phone">Phone: {{ address.phone }}</span>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h3>Order Summary</h3>
                <div class="detail-grid">
                  <div><span>Brand</span><strong>{{ selectedOrder.brand_name || '-' }}</strong></div>
                  <div><span>Draft ID</span><strong>{{ selectedOrder.shopify_draft_order_id || '-' }}</strong></div>
                  <div><span>Shopify Event ID</span><strong>{{ selectedOrder.shopify_event_id || '-' }}</strong></div>
                  <div>
                    <span>Invoice</span>
                    <strong>
                      <a v-if="selectedOrder.invoice_url" class="detail-link" :href="selectedOrder.invoice_url" target="_blank" rel="noopener">Open invoice</a>
                      <template v-else>-</template>
                    </strong>
                  </div>
                  <div><span>Order Date</span><strong>{{ formatDate(selectedOrder.shopify_created_at) }}</strong></div>
                  <div><span>Webhook Received</span><strong>{{ formatDate(selectedOrder.webhook_received_at) }}</strong></div>
                  <div><span>Subtotal</span><strong>{{ money(selectedOrder.subtotal_price, selectedOrder.currency) }}</strong></div>
                  <div><span>Discount</span><strong>{{ money(selectedOrder.total_discounts, selectedOrder.currency) }}</strong></div>
                  <div><span>Tax</span><strong>{{ money(selectedOrder.total_tax, selectedOrder.currency) }}</strong></div>
                  <div><span>Total</span><strong>{{ money(selectedOrder.total_price, selectedOrder.currency) }}</strong></div>
                </div>
              </section>

              <section class="detail-section">
                <h3>Items</h3>
                <div v-for="item in selectedOrder.line_items || []" :key="item.shopify_line_item_id || item.sku || item.title" class="product-row">
                  <div class="product-top">
                    <strong>{{ item.title || 'Item' }}</strong>
                    <span>{{ money(item.price, selectedOrder.currency) }}</span>
                  </div>
                  <p>Qty: {{ item.quantity || 0 }} · SKU: {{ item.sku || '-' }} · Vendor: {{ item.vendor || '-' }}</p>
                  <p>Product: {{ item.product_id || '-' }} · Variant: {{ item.variant_id || item.variant_title || '-' }}</p>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </Teleport>

      <ConfirmDialog
        :show="Boolean(statusConfirm)"
        :title="statusConfirmTitle"
        :message="statusConfirmMessage"
        :details="statusConfirm?.order?.order_name || statusConfirm?.order?.customer?.name || 'Abandoned order'"
        eyebrow="Abandoned Order"
        :confirmText="statusConfirmButton"
        cancelText="Keep Current Status"
        :variant="statusConfirm?.status === 'cancel' ? 'danger' : 'primary'"
        :loading="actionLoading"
        @cancel="statusConfirm = null"
        @confirm="confirmStatusChange"
      />

      <ConfirmDialog
        :show="Boolean(deleteConfirm)"
        title="Delete Abandoned Order?"
        message="This abandoned order will be removed from the list. This does not affect Shopify."
        :details="deleteConfirm?.order_name || deleteConfirm?.customer?.name || 'Abandoned order'"
        eyebrow="Abandoned Order"
        confirmText="Delete Order"
        cancelText="Keep Order"
        variant="danger"
        :loading="actionLoading"
        @cancel="deleteConfirm = null"
        @confirm="confirmDeleteOrder"
      />
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import ConfirmDialog from '../components/shared/ConfirmDialog.vue';
import { useAbandonedOrderStore } from '../stores/abandonedOrderStore';
import { buildFilterQuery, readFilterQuery } from '../utils/filterQuery';

const router = useRouter();
const route = useRoute();
const store = useAbandonedOrderStore();
const localSearch = ref(store.filters.search || '');
const selectedOrder = ref(null);
const actionLoading = ref(false);
const statusConfirm = ref(null);
const deleteConfirm = ref(null);
const draftFilters = ref({
  date_from: '',
  date_to: '',
  brand_id: '',
  status: '',
  sort: 'received_desc',
});
let syncingQuery = false;
let hydratingFilters = false;

const queryDefaults = {
  search: '',
  date_from: '',
  date_to: '',
  brand_id: '',
  status: '',
  sort: 'received_desc',
  page: 1,
};

const statCards = computed(() => [
  { key: 'today_received', label: 'Today Received', value: store.stats.today_received || 0 },
  { key: 'yesterday', label: 'Yesterday', value: store.stats.yesterday || 0 },
  { key: 'last_7_days', label: 'Last 7 Days', value: store.stats.last_7_days || 0 },
  { key: 'this_month', label: 'This Month', value: store.stats.this_month || 0 },
  { key: 'last_month', label: 'Last Month', value: store.stats.last_month || 0 },
]);

const serialStart = computed(() => {
  const pagination = store.pagination;
  if (!pagination) return 1;
  return ((pagination.current_page - 1) * pagination.per_page) + 1;
});

const statusLabels = {
  pending: 'Pending',
  complete: 'Complete',
  cancel: 'Cancel',
};

const statusConfirmTitle = computed(() => {
  const label = statusLabels[statusConfirm.value?.status] || 'Update';
  return `Mark Order ${label}?`;
});

const statusConfirmMessage = computed(() => {
  const label = (statusLabels[statusConfirm.value?.status] || 'selected').toLowerCase();
  return `This will change the abandoned order status to ${label}.`;
});

const statusConfirmButton = computed(() => {
  const label = statusLabels[statusConfirm.value?.status] || 'Update';
  return `Mark ${label}`;
});

const hydrateFiltersFromRoute = () => {
  hydratingFilters = true;
  store.hydrateFilters(readFilterQuery(route.query, queryDefaults));
  localSearch.value = store.filters.search || '';
  draftFilters.value = {
    date_from: store.filters.date_from || '',
    date_to: store.filters.date_to || '',
    brand_id: store.filters.brand_id || '',
    status: store.filters.status || '',
    sort: store.filters.sort || 'received_desc',
  };
  hydratingFilters = false;
};

const replaceFilterQuery = async () => {
  syncingQuery = true;
  try {
    await router.replace({
      query: buildFilterQuery(store.filters, queryDefaults),
    });
  } finally {
    syncingQuery = false;
  }
};

watch(() => ({ ...route.query }), async () => {
  if (syncingQuery) return;
  hydrateFiltersFromRoute();
  await store.fetchOrders();
});

const changePage = async (page) => {
  await store.setPage(page);
  await replaceFilterQuery();
};

const reloadOrders = async () => {
  await store.fetchOrders();
};

const applyFilters = async () => {
  Object.assign(store.filters, draftFilters.value, { search: localSearch.value, page: 1 });
  await store.fetchOrders();
  await replaceFilterQuery();
};

const clearFilters = async () => {
  localSearch.value = '';
  draftFilters.value = {
    date_from: '',
    date_to: '',
    brand_id: '',
    status: '',
    sort: 'received_desc',
  };
  Object.assign(store.filters, queryDefaults);
  await store.fetchOrders();
  await replaceFilterQuery();
};

const openStatusConfirm = (order, status) => {
  statusConfirm.value = { order, status };
};

const confirmStatusChange = async () => {
  if (!statusConfirm.value) return;
  const { order, status } = statusConfirm.value;
  actionLoading.value = true;
  try {
    const updated = await store.updateStatus(order.id, status);
    if (selectedOrder.value?.id === order.id) {
      selectedOrder.value = updated;
    }
    await store.fetchOrders();
    statusConfirm.value = null;
  } finally {
    actionLoading.value = false;
  }
};

const openDeleteConfirm = (order) => {
  deleteConfirm.value = order;
};

const confirmDeleteOrder = async () => {
  if (!deleteConfirm.value) return;
  const orderId = deleteConfirm.value.id;
  actionLoading.value = true;
  try {
    await store.deleteOrder(orderId);
    if (selectedOrder.value?.id === orderId) {
      selectedOrder.value = null;
    }
    deleteConfirm.value = null;
    await store.fetchOrders();
  } finally {
    actionLoading.value = false;
  }
};

const primaryAddress = (order) => order.addresses?.primary?.formatted
  || order.addresses?.shipping?.formatted
  || order.addresses?.customer_default?.formatted
  || order.addresses?.billing?.formatted
  || '';

const itemCount = (order) => (order.line_items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

const itemSummary = (order) => (order.line_items || [])
  .slice(0, 2)
  .map(item => `${item.title || item.name || 'Item'} x${item.quantity}`)
  .join(', ');

const orderPhone = (order) => order?.customer?.phone_normalized || order?.customer?.phone || '-';

const mainOrderCount = (order) => Number(order?.main_order_matches?.count || 0);

const openMainOrders = (order) => {
  const phone = orderPhone(order);
  if (!phone || phone === '-') return;

  router.push({
    path: '/orders',
    query: { search: phone },
  });
};

const createOrderFromAbandoned = (order) => {
  router.push({
    path: '/orders/create',
    query: { abandoned_order_id: order.id },
  });
};

const money = (value, currency) => `${currency || ''} ${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`.trim();

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const addressCards = (order) => [
  { key: 'shipping', label: 'Shipping', value: order.addresses?.shipping?.formatted, phone: order.addresses?.shipping?.phone },
  { key: 'billing', label: 'Billing', value: order.addresses?.billing?.formatted, phone: order.addresses?.billing?.phone },
  { key: 'customer_default', label: 'Customer Default', value: order.addresses?.customer_default?.formatted, phone: order.addresses?.customer_default?.phone },
];

onMounted(() => {
  hydrateFiltersFromRoute();
  store.fetchOrders();
});
</script>

<style scoped>
.abandoned-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.orders-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h1 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
}

.panel-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.count-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  height: 26px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  color: #4f46e5;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 0 12px;
  white-space: nowrap;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.spinning {
  animation: spin 0.85s linear infinite;
}

.panel-body {
  padding: 22px 28px 26px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  height: 72px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  padding: 12px 14px;
  text-align: left;
}

.stat-card span {
  display: block;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.stat-card strong {
  margin-top: 8px;
  font-size: 22px;
}

.filters-bar {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) repeat(5, minmax(140px, 1fr)) auto auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.search-wrap {
  position: relative;
  min-width: 0;
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
  height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 14px;
  outline: none;
  padding: 0 34px;
}

.filter-control {
  width: 100%;
  height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  outline: none;
  padding: 0 10px;
}

.filter-control:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.22);
}

.apply-filters-btn,
.clear-filters-btn {
  height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 0 14px;
}

.apply-filters-btn {
  border-color: #4f46e5;
  background: #4f46e5;
  color: #fff;
}

.apply-filters-btn:hover {
  background: #4338ca;
}

.clear-filters-btn:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.search-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.28);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

table {
  width: 100%;
  min-width: 1220px;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  padding: 11px 12px;
  text-align: left;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 13px 12px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

tr:last-child td {
  border-bottom: none;
}

strong {
  display: block;
  color: #0f172a;
  font-weight: 800;
}

.subtext {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.address-cell {
  max-width: 260px;
  line-height: 1.45;
}

.items-cell {
  max-width: 220px;
}

.phone-cell {
  min-width: 126px;
}

.main-orders-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 11.5px;
  font-weight: 800;
  line-height: 1;
  padding: 5px 8px;
  white-space: nowrap;
}

.main-orders-badge:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.detail-match-badge {
  margin-top: 8px;
}

.actions-cell {
  min-width: 200px;
}

.actions-cell,
.detail-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-header-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: pointer;
  padding: 0;
}

.view-btn {
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #4338ca;
}

.view-btn:hover:not(:disabled) {
  background: #e0e7ff;
}

.create-order-btn {
  border-color: #bae6fd;
  background: #e0f2fe;
  color: #0369a1;
}

.create-order-btn:hover:not(:disabled) {
  background: #bae6fd;
}

.complete-btn {
  background: #dcfce7;
  color: #166534;
}

.complete-btn:hover:not(:disabled) {
  background: #bbf7d0;
}

.cancel-btn {
  background: #fee2e2;
  color: #991b1b;
}

.cancel-btn:hover:not(:disabled) {
  background: #fecaca;
}

.delete-btn {
  background: #fff1f2;
  color: #be123c;
}

.delete-btn:hover:not(:disabled) {
  background: #ffe4e6;
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.detail-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.detail-overlay {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(15, 23, 42, 0.34);
  cursor: default;
}

.detail-panel {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  width: min(620px, 100vw);
  height: 100vh;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-header h2 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
}

.detail-header p {
  margin: 0 0 10px;
  color: #64748b;
  font-size: 13px;
}

.detail-close {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  font-size: 26px;
  line-height: 1;
}

.detail-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 24px 28px;
}

.detail-section {
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.detail-section:first-child {
  padding-top: 0;
  margin-top: 0;
  border-top: none;
}

.detail-section h3 {
  margin: 0 0 12px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-grid div,
.address-block {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px 12px;
}

.detail-grid span,
.address-block h4,
.address-block span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.detail-grid strong,
.address-block p {
  display: block;
  margin: 5px 0 0;
  color: #0f172a;
  font-size: 13px;
  line-height: 1.45;
}

.break-text {
  word-break: break-all;
}

.detail-link {
  color: #4338ca;
  text-decoration: none;
}

.detail-link:hover {
  text-decoration: underline;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.product-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.product-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.product-top strong {
  color: #0f172a;
  font-size: 13px;
}

.product-top span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.product-row p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}

.state-cell {
  height: 110px;
  color: #64748b;
  text-align: center;
  vertical-align: middle;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  color: #64748b;
  font-size: 13px;
}

.pagination button {
  height: 32px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  padding: 0 12px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .abandoned-page {
    padding: 18px;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .stats-grid,
  .filters-bar {
    grid-template-columns: 1fr;
  }

  .detail-grid,
  .address-list {
    grid-template-columns: 1fr;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
