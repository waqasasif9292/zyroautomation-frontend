<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="returns-page">
      <section class="returns-panel">
        <header class="returns-header">
          <div>
            <h1>{{ pageTitle }} ({{ totalReturns }})</h1>
            <p>{{ pageDescription }}</p>
          </div>
          <button class="refresh-btn" type="button" :disabled="loading" @click="fetchReturns">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M16 8h5V3" />
            </svg>
            Refresh
          </button>
        </header>

        <section class="returns-stats-grid">
          <button class="return-stat-card total-card" type="button" @click="applyStatsFilter(null)">
            <div>
              <p class="stat-label">{{ statsTotalLabel }}</p>
              <strong>{{ statsLoading ? '—' : formatNumber(statsTotalValue) }}</strong>
            </div>
            <span class="stat-icon tone-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7h13a5 5 0 0 1 0 10H8" />
                <path d="m8 12-5-5 5-5" />
              </svg>
            </span>
          </button>

          <button
            v-for="courier in returnStats.couriers"
            :key="courier.id"
            class="return-stat-card"
            type="button"
            @click="applyStatsFilter(courier.id)"
          >
            <div>
              <p class="stat-label">{{ courierStatLabel(courier) }}</p>
              <strong>{{ statsLoading ? '—' : formatNumber(courierStatValue(courier)) }}</strong>
            </div>
            <span class="stat-icon tone-slate">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 3h5v5" />
                <path d="M21 3 10 14" />
                <path d="M8 21H3v-5" />
                <path d="M3 21l11-11" />
              </svg>
            </span>
          </button>
        </section>

        <div class="filters-bar">
          <div class="filters-grid">
            <input
              v-model="draftFilters.search"
              class="filter-control"
              type="text"
              placeholder="Search by id, name, contact"
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
              <option v-for="integration in integrationStore.integrations" :key="integration.id" :value="integration.id">
                {{ integration.name }}
              </option>
            </select>

            <select v-model="draftFilters.sort" class="filter-control">
              <option value="created_id_desc">Newest First</option>
              <option value="created_id_asc">Oldest First</option>
              <option v-if="isReceivedView" value="return_received_at_desc">Received: Newest First</option>
              <option v-if="isReceivedView" value="return_received_at_asc">Received: Oldest First</option>
            </select>

            <div class="filter-actions">
              <button class="btn-search" type="button" @click="applyFilters">Search</button>
              <button class="btn-clear" type="button" @click="clearFilters">Clear</button>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="returns-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Created At</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Courier</th>
                <th>Status</th>
                <th>Tracking Number</th>
                <th v-if="isReceivedView">Received At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loading">
                <tr v-for="row in 7" :key="row">
                  <td v-for="col in tableColumnCount" :key="col"><span class="skeleton"></span></td>
                </tr>
              </template>
              <tr v-else-if="orders.length === 0">
                <td :colspan="tableColumnCount" class="empty-cell">{{ emptyText }}</td>
              </tr>
              <tr v-else v-for="(order, index) in orders" :key="order.id">
                <td class="serial-cell">{{ serialStart + index }}</td>
                <td>
                  <div>{{ formatDateTime(order.created_at || order.shopify_created_at) }}</div>
                  <div class="order-number-cell">{{ order.order_name || order.order_number || '—' }}</div>
                </td>
                <td>
                  <div class="name-cell">{{ order.customer_name || order.order_name || '—' }}</div>
                  <div v-if="order.brand_name" class="subtext">{{ order.brand_name }}</div>
                </td>
                <td>{{ formatPhone(order.contact) || '—' }}</td>
                <td>{{ order.courier_name || '—' }}</td>
                <td>{{ order.status || '—' }}</td>
                <td>
                  <a
                    v-if="order.tracking_number"
                    class="tracking-link"
                    :href="trackingHref(order)"
                    target="_blank"
                    rel="noopener"
                    @click="authStore.prepareTabHandoff"
                  >
                    {{ order.tracking_number }}
                  </a>
                  <span v-else class="tracking-empty">—</span>
                </td>
                <td v-if="isReceivedView">{{ formatDateTime(order.return_received_at) }}</td>
                <td>
                  <button
                    class="mark-btn"
                    type="button"
                    :disabled="markingId === order.id"
                    @click="toggleReturnStatus(order)"
                  >
                    {{ markingId === order.id ? 'Saving...' : actionLabel }}
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
import ReturnManagementService from '../services/ReturnManagementService';
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
const loading = ref(false);
const statsLoading = ref(false);
const markingId = ref(null);
const toast = ref('');
const page = ref(1);
let syncingQuery = false;
const returnStats = ref({
  total_pending: 0,
  total_received: 0,
  couriers: [],
});

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

const isReceivedView = computed(() => route.meta.returnView === 'received');
const totalReturns = computed(() => pagination.value?.total || orders.value.length);
const pageTitle = computed(() => isReceivedView.value ? 'Return Received' : 'Return Pending');
const pageDescription = computed(() => (
  isReceivedView.value
    ? 'Returned parcels already received back from couriers.'
    : 'Returned parcels waiting to be received back.'
));
const emptyText = computed(() => isReceivedView.value ? 'No received returns.' : 'No pending returns.');
const actionLabel = computed(() => isReceivedView.value ? 'Mark As Unreceived' : 'Return Received');
const statsTotalLabel = computed(() => isReceivedView.value ? 'Total Received' : 'Total Pending');
const statsTotalValue = computed(() => isReceivedView.value ? returnStats.value.total_received : returnStats.value.total_pending);
const tableColumnCount = computed(() => isReceivedView.value ? 9 : 8);
const serialStart = computed(() => {
  if (!pagination.value) return 1;
  return ((pagination.value.current_page - 1) * pagination.value.per_page) + 1;
});
const sourceOptions = computed(() => {
  const defaults = ['Website', 'WhatsApp', 'Abandoned', 'Social'];
  const brandSources = brandStore.brands.flatMap(brand => brand.sources || []);
  return [...new Set([...defaults, ...brandSources].filter(Boolean))];
});

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => {
    toast.value = '';
  }, 3000);
};

const formatNumber = value => Number(value || 0).toLocaleString();

const fetchReturnStats = async () => {
  statsLoading.value = true;
  try {
    const response = await ReturnManagementService.getStats(statsParams());
    returnStats.value = response.data.data.stats;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to load return stats.');
  } finally {
    statsLoading.value = false;
  }
};

const courierStatLabel = courier => isReceivedView.value ? `${courier.name} Received` : `${courier.name} Pending`;
const courierStatValue = courier => isReceivedView.value ? courier.received : courier.pending;

const fetchReturns = async () => {
  loading.value = true;
  try {
    const params = requestParams();
    const response = isReceivedView.value
      ? await ReturnManagementService.getReceived(params)
      : await ReturnManagementService.getPending(params);
    orders.value = response.data.data.orders;
    pagination.value = response.data.data.pagination;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to load returns.');
  } finally {
    loading.value = false;
  }
};

const requestParams = () => Object.fromEntries(
  Object.entries({
    ...appliedFilters,
    page: page.value,
    per_page: 50,
  }).filter(([, value]) => value !== null && value !== '')
);

const statsParams = () => Object.fromEntries(
  Object.entries({
    brand_id: appliedFilters.brand_id,
    date_from: appliedFilters.date_from,
    date_to: appliedFilters.date_to,
    search: appliedFilters.search,
    source: appliedFilters.source,
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

const applyFilters = async () => {
  Object.assign(appliedFilters, {
    ...draftFilters,
    search: draftFilters.search.trim(),
  });
  page.value = 1;
  await replaceFilterQuery();
  await Promise.all([
    fetchReturns(),
    fetchReturnStats(),
  ]);
};

const clearFilters = async () => {
  Object.assign(draftFilters, defaultFilters());
  Object.assign(appliedFilters, defaultFilters());
  page.value = 1;
  await replaceFilterQuery();
  await Promise.all([
    fetchReturns(),
    fetchReturnStats(),
  ]);
};

const applyStatsFilter = async (courierId) => {
  const nextFilters = {
    ...appliedFilters,
    courier_integration_id: courierId || '',
  };

  Object.assign(draftFilters, nextFilters);
  Object.assign(appliedFilters, nextFilters);
  page.value = 1;
  await replaceFilterQuery();
  await fetchReturns();
};

const toggleReturnStatus = async (order) => {
  markingId.value = order.id;
  try {
    if (isReceivedView.value) {
      await ReturnManagementService.markUnreceived(order.id);
    } else {
      await ReturnManagementService.markReceived(order.id);
    }
    orders.value = orders.value.filter(item => item.id !== order.id);
    if (pagination.value) {
      pagination.value.total = Math.max((pagination.value.total || 1) - 1, 0);
    }
    showToast(isReceivedView.value ? 'Return marked as unreceived.' : 'Return marked as received.');
    await fetchReturnStats();
    if (orders.value.length === 0 && pagination.value?.has_next) {
      await fetchReturns();
    }
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to update return.');
  } finally {
    markingId.value = null;
  }
};

const changePage = async (nextPage) => {
  page.value = nextPage;
  await replaceFilterQuery();
  await fetchReturns();
};

const trackingHref = (order) => router.resolve(`/orders/${order.id}/tracking`).href;

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

watch(() => route.meta.returnView, async () => {
  hydrateFiltersFromRoute();
  orders.value = [];
  pagination.value = null;
  await Promise.all([
    fetchReturns(),
    fetchReturnStats(),
  ]);
});

watch(() => ({ ...route.query }), async () => {
  if (syncingQuery) return;
  hydrateFiltersFromRoute();
  await Promise.all([
    fetchReturns(),
    fetchReturnStats(),
  ]);
});

onMounted(async () => {
  hydrateFiltersFromRoute();
  await Promise.all([
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
    integrationStore.integrations.length ? Promise.resolve() : integrationStore.fetchIntegrations(),
    fetchReturns(),
    fetchReturnStats(),
  ]);
});
</script>

<style scoped>
.returns-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.returns-panel {
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.returns-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.returns-header h1 {
  margin: 0;
  color: #172554;
  font-size: 17px;
  font-weight: 800;
}

.returns-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.returns-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 22px 28px 0;
}

.return-stat-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 92px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  padding: 18px 20px;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  text-align: left;
}

.return-stat-card::after {
  content: "";
  position: absolute;
  inset: auto -24px -34px auto;
  width: 112px;
  height: 112px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.92);
}

.stat-label {
  margin: 0 0 7px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.35;
  text-transform: uppercase;
}

.return-stat-card strong {
  color: #172554;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0;
}

.return-stat-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.11);
}

.stat-icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  border-radius: 999px;
  color: #fff;
}

.tone-blue { background: #2563eb; }
.tone-slate { background: #334155; }

.filters-bar {
  padding: 22px 28px 16px;
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

.refresh-btn,
.mark-btn,
.pager button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  color: #4f46e5;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.refresh-btn {
  gap: 7px;
  padding: 8px 11px;
}

.mark-btn {
  min-width: 146px;
  padding: 7px 10px;
}

.refresh-btn:disabled,
.mark-btn:disabled,
.pager button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.returns-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 14px 20px;
  background: #f8fafc;
  color: #8a9ab3;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: left;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 13px 20px;
  color: #334155;
  font-size: 13.5px;
  vertical-align: middle;
  border-bottom: 1px solid #edf2f7;
}

tbody tr:hover {
  background: #f8fafc;
}

.serial-cell,
.name-cell {
  color: #0f172a;
  font-weight: 800;
}

.order-number-cell,
.subtext {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.tracking-link {
  color: #4f46e5;
  font-weight: 800;
  text-decoration: none;
}

.tracking-link:hover {
  text-decoration: underline;
}

.tracking-empty,
.empty-cell {
  color: #94a3b8;
}

.empty-cell {
  padding: 36px;
  text-align: center;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 22px;
}

.pager span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.pager button {
  padding: 7px 10px;
}

.skeleton {
  display: block;
  width: 100%;
  height: 18px;
  border-radius: 5px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

@media (max-width: 1180px) {
  .returns-stats-grid,
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .returns-page {
    padding: 18px;
  }

  .returns-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .returns-stats-grid,
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
