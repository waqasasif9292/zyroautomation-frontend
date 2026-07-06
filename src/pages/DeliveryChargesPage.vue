<template>
  <AppLayout>
    <main class="charges-page">
      <section class="charges-panel">
        <header class="charges-header">
          <div>
            <p class="eyebrow">Delivery Charges Management</p>
            <h1>Orders With Tracking IDs ({{ totalCount }})</h1>
            <p>Review parcel COD, delivery charges, fuel charges, GST, and totals. Total zero: {{ zeroTotalCount }}</p>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" type="button" :disabled="loading" @click="fetchOrders">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M16 8h5V3" />
              </svg>
              Reload
            </button>
            <a
              v-for="courier in chargeButtons"
              :key="courier.slug"
              class="primary-btn"
              :class="{ disabled: !supportedDeliveryChargeCouriers.includes(courier.slug) }"
              :href="deliveryChargeFetchHref(courier)"
              target="_blank"
              rel="noopener"
              @click="authStore.prepareTabHandoff"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              {{ `Fetch ${courier.name} Delivery Charges (${courier.count})` }}
            </a>
          </div>
        </header>

        <div class="filters-bar">
          <div class="filters-grid">
            <input
              v-model="draftFilters.search"
              class="filter-control"
              type="text"
              placeholder="Search by id, tracking, name, contact"
              @keydown.enter="applyFilters"
            >

            <label class="date-filter-control" :class="{ 'has-value': draftFilters.date_from }">
              <input v-model="draftFilters.date_from" class="filter-control" type="date" aria-label="Date From">
              <span class="date-filter-placeholder">Date From</span>
            </label>

            <label class="date-filter-control" :class="{ 'has-value': draftFilters.date_to }">
              <input v-model="draftFilters.date_to" class="filter-control" type="date" aria-label="Date To">
              <span class="date-filter-placeholder">Date To</span>
            </label>

            <select v-model="draftFilters.brand_id" class="filter-control">
              <option value="">Select Shipper</option>
              <option v-for="brand in brandStore.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
            </select>

            <select v-model="draftFilters.source" class="filter-control">
              <option value="">Select Source</option>
              <option v-for="source in sourceOptions" :key="source" :value="source">{{ source }}</option>
            </select>

            <select v-model="draftFilters.courier_integration_id" class="filter-control">
              <option value="">Select Courier</option>
              <option value="self_pickup">Self Pickup / Bykea</option>
              <option v-for="integration in integrationStore.integrations" :key="integration.id" :value="integration.id">
                {{ integration.name }}
              </option>
            </select>

            <select v-model="draftFilters.sort" class="filter-control">
              <option value="created_id_desc">Newest First</option>
              <option value="created_id_asc">Oldest First</option>
              <option value="total_charges_desc">Total Delivery: High to Low</option>
              <option value="total_charges_asc">Total Delivery: Low to High</option>
            </select>

            <div class="filter-actions">
              <button class="btn-search" type="button" @click="applyFilters">Search</button>
              <button class="btn-clear" type="button" @click="clearFilters">Clear</button>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="charges-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>Tracking ID</th>
                <th>Status</th>
                <th>COD</th>
                <th>Delivery Charges</th>
                <th>Fuel Charges</th>
                <th>GST</th>
                <th>Total</th>
                <th>Updated Date/Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loading">
                <tr v-for="row in 7" :key="row">
                  <td v-for="col in 13" :key="col"><span class="skeleton"></span></td>
                </tr>
              </template>
              <tr v-else-if="orders.length === 0">
                <td colspan="13" class="empty-cell">No tracked orders found.</td>
              </tr>
              <tr v-else v-for="(order, index) in orders" :key="order.id">
                <td class="serial-cell">{{ serialStart + index }}</td>
                <td>
                  <div class="strong-cell">{{ order.order_name || order.order_number || '-' }}</div>
                  <div v-if="order.brand_name" class="subtext">{{ order.brand_name }}</div>
                </td>
                <td>
                  <div>{{ order.customer_name || '-' }}</div>
                  <div v-if="order.contact" class="subtext">{{ formatPhone(order.contact) }}</div>
                </td>
                <td>{{ order.courier_name || '-' }}</td>
                <td>
                  <a
                    class="tracking-link"
                    :href="`/orders/${order.id}/tracking`"
                    target="_blank"
                    rel="noopener"
                    @click="authStore.prepareTabHandoff"
                  >
                    {{ order.tracking_number }}
                  </a>
                </td>
                <td><span class="status-pill">{{ order.status || '-' }}</span></td>
                <td>{{ formatMoney(order.cod) }}</td>
                <td>{{ formatMoney(order.delivery_charges) }}</td>
                <td>{{ formatMoney(order.fuel_charges) }}</td>
                <td>{{ formatMoney(order.gst) }}</td>
                <td>{{ formatMoney(order.total_charges) }}</td>
                <td>{{ formatDateTime(order.charges_updated_at) }}</td>
                <td>
                  <button
                    class="sync-btn"
                    type="button"
                    :disabled="!supportedDeliveryChargeCouriers.includes(order.courier_slug) || syncingOrderId === order.id"
                    @click="syncDeliveryCharges(order)"
                  >
                    {{ syncingOrderId === order.id ? 'Syncing...' : 'Sync delivery charges' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="pagination && pagination.total_pages > 1" class="pager">
          <button type="button" :disabled="!pagination.has_prev || loading" @click="changePage(pagination.current_page - 1)">
            Previous
          </button>
          <span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span>
          <button type="button" :disabled="!pagination.has_next || loading" @click="changePage(pagination.current_page + 1)">
            Next
          </button>
        </footer>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import DeliveryChargeService from '../services/DeliveryChargeService';
import { useAuthStore } from '../stores/authStore';
import { useBrandStore } from '../stores/brandStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { buildFilterQuery, readFilterQuery } from '../utils/filterQuery';
import { formatPhone } from '../utils/phoneNormalizer';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const brandStore = useBrandStore();
const integrationStore = useIntegrationStore();
const orders = ref([]);
const pagination = ref(null);
const summary = ref({ total: 0, zero_total_count: 0, couriers: [] });
const page = ref(1);
const loading = ref(false);
const syncingOrderId = ref('');
let syncingQuery = false;
const supportedDeliveryChargeCouriers = ['postex', 'leopard', 'dastaq', 'argo'];

const defaultFilters = () => ({
  brand_id: '',
  courier_integration_id: '',
  date_from: '',
  date_to: '',
  search: '',
  sort: 'created_id_desc',
  source: '',
});

const draftFilters = reactive(defaultFilters());
const appliedFilters = reactive(defaultFilters());

const queryDefaults = () => ({
  ...defaultFilters(),
  page: 1,
});

const totalCount = computed(() => pagination.value?.total ?? summary.value.total ?? 0);
const zeroTotalCount = computed(() => summary.value.zero_total_count ?? 0);
const chargeButtons = computed(() => summary.value.couriers || []);
const serialStart = computed(() => {
  if (!pagination.value) return 1;
  return ((pagination.value.current_page - 1) * pagination.value.per_page) + 1;
});
const sourceOptions = computed(() => {
  const defaults = ['Website', 'WhatsApp', 'Abandoned', 'Social'];
  const brandSources = brandStore.brands.flatMap(brand => brand.sources || []);
  return [...new Set([...defaults, ...brandSources].filter(Boolean))];
});

const deliveryChargeFetchHref = (courier) => `/delivery-charges/fetch/${encodeURIComponent(courier.slug)}`;

const requestParams = () => Object.fromEntries(
  Object.entries({
    ...appliedFilters,
    page: page.value,
    per_page: 200,
  }).filter(([, value]) => value !== null && value !== '')
);

const hydrateFiltersFromRoute = () => {
  const values = readFilterQuery(route.query, queryDefaults());
  const nextFilters = { ...values };
  delete nextFilters.page;
  Object.assign(draftFilters, nextFilters);
  Object.assign(appliedFilters, nextFilters);
  page.value = values.page;
};

const replaceFilterQuery = async () => {
  syncingQuery = true;
  try {
    await router.replace({
      query: buildFilterQuery({ ...appliedFilters, page: page.value }, queryDefaults()),
    });
  } finally {
    syncingQuery = false;
  }
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const res = await DeliveryChargeService.getOrders(requestParams());
    orders.value = res.data.data.orders || [];
    pagination.value = res.data.data.pagination;
    summary.value = res.data.data.summary || summary.value;
  } finally {
    loading.value = false;
  }
};

const applyFilters = async () => {
  Object.assign(appliedFilters, {
    ...draftFilters,
    search: draftFilters.search.trim(),
  });
  page.value = 1;
  await replaceFilterQuery();
  await fetchOrders();
};

const clearFilters = async () => {
  Object.assign(draftFilters, defaultFilters());
  Object.assign(appliedFilters, defaultFilters());
  page.value = 1;
  await replaceFilterQuery();
  await fetchOrders();
};

const changePage = async (nextPage) => {
  page.value = nextPage;
  await replaceFilterQuery();
  await fetchOrders();
};

const syncDeliveryCharges = async (order) => {
  if (!supportedDeliveryChargeCouriers.includes(order.courier_slug)) return;

  syncingOrderId.value = order.id;
  try {
    const res = await DeliveryChargeService.syncOrder(order.id);
    const updatedOrder = res.data.data?.order;
    if (updatedOrder) {
      const index = orders.value.findIndex(item => item.id === updatedOrder.id);
      if (index !== -1) {
        orders.value[index] = updatedOrder;
      }
    }
    await fetchOrders();
  } finally {
    syncingOrderId.value = '';
  }
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

onMounted(async () => {
  hydrateFiltersFromRoute();
  await Promise.all([
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
    integrationStore.fetchIntegrations(),
    fetchOrders(),
  ]);
});

watch(() => ({ ...route.query }), async () => {
  if (syncingQuery) return;
  hydrateFiltersFromRoute();
  await fetchOrders();
});
</script>

<style scoped>
.charges-page {
  min-height: 100vh;
  padding: 30px;
  background: #f1f5f9;
}

.charges-panel {
  display: grid;
  gap: 18px;
}

.charges-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.charges-header h1 {
  margin: 0;
  color: #111827;
  font-size: 25px;
  font-weight: 900;
}

.charges-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 650;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.primary-btn,
.secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
}

.primary-btn {
  border: 0;
  background: #2563eb;
  color: #fff;
  text-decoration: none;
}

.secondary-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.primary-btn.disabled,
.secondary-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  pointer-events: none;
}

.filters-bar,
.table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.filters-bar {
  padding: 16px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(150px, 1fr));
  gap: 10px 18px;
  align-items: center;
}

.filter-control {
  width: 100%;
  height: 42px;
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

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-search,
.btn-clear {
  height: 30px;
  border: none;
  border-radius: 4px;
  background: #5865db;
  color: #fff;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(88, 101, 219, 0.28);
}

.table-wrap {
  overflow-x: auto;
}

.charges-table {
  width: 100%;
  min-width: 1320px;
  border-collapse: collapse;
}

.charges-table th {
  padding: 13px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: left;
}

.charges-table td {
  padding: 13px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  vertical-align: top;
}

.serial-cell,
.subtext {
  color: #64748b;
  font-size: 12px;
}

.strong-cell {
  color: #111827;
  font-weight: 900;
}

.tracking-link {
  color: #2563eb;
  font-weight: 850;
  text-decoration: none;
}

.status-pill {
  display: inline-flex;
  max-width: 220px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 850;
  white-space: normal;
}

.sync-btn {
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 850;
  white-space: nowrap;
}

.sync-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.empty-cell {
  padding: 30px;
  color: #64748b;
  text-align: center;
}

.skeleton {
  display: block;
  width: 100%;
  height: 16px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: pulse 1.2s infinite;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.pager button {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  padding: 8px 12px;
  font-weight: 850;
  cursor: pointer;
}

.pager button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 860px) {
  .charges-page {
    padding: 18px;
  }

  .charges-header {
    display: grid;
  }

  .header-actions {
    justify-content: stretch;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
