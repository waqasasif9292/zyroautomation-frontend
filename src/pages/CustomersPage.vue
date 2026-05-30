<template>
  <AppLayout>
    <main class="customers-page">
      <section class="customers-card">
        <div class="card-header">
          <div>
            <h1>Customers</h1>
            <p>Customers collected from Shopify and manual orders.</p>
          </div>
        </div>

        <div class="card-body">
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
                placeholder="Search by name, phone, email, or address..."
              >
              <button v-if="localSearch" class="clear-search" type="button" @click="localSearch = ''">×</button>
            </div>
            <div class="filters-actions">
              <label class="select-wrap">
                <span>Sort by</span>
                <select v-model="localSortBy" class="filter-select">
                  <option value="date">Date</option>
                  <option value="orders">Number of orders</option>
                </select>
              </label>
              <label class="select-wrap">
                <span>Order</span>
                <select v-model="localSortDir" class="filter-select">
                  <option value="desc">{{ localSortBy === 'orders' ? 'High to low' : 'Newest first' }}</option>
                  <option value="asc">{{ localSortBy === 'orders' ? 'Low to high' : 'Oldest first' }}</option>
                </select>
              </label>
              <span class="results-count">{{ customerStore.pagination?.total || 0 }} customers</span>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Orders</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="customerStore.loading">
                  <td colspan="7" class="state-cell">Loading customers...</td>
                </tr>
                <tr v-else-if="customerStore.customers.length === 0">
                  <td colspan="7" class="state-cell">No customers found.</td>
                </tr>
                <tr v-for="(customer, index) in customerStore.customers" v-else :key="customer.id">
                  <td>{{ serialStart + index }}</td>
                  <td>
                    <strong>{{ customer.name || 'Unknown Customer' }}</strong>
                    <span v-if="customer.city" class="subtext">{{ customer.city }}</span>
                  </td>
                  <td>{{ customer.phone || customer.phone_normalized || '-' }}</td>
                  <td>{{ customer.email || '-' }}</td>
                  <td class="address-cell">{{ customer.address || '-' }}</td>
                  <td>{{ customer.order_count || 0 }}</td>
                  <td class="actions-cell">
                    <button class="view-btn" type="button" @click="viewOrders(customer)">View Orders</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="customerStore.pagination && customerStore.pagination.total_pages > 1" class="pagination">
            <button type="button" :disabled="!customerStore.pagination.has_prev" @click="changePage(customerStore.pagination.current_page - 1)">Previous</button>
            <span>Page {{ customerStore.pagination.current_page }} of {{ customerStore.pagination.total_pages }}</span>
            <button type="button" :disabled="!customerStore.pagination.has_next" @click="changePage(customerStore.pagination.current_page + 1)">Next</button>
          </div>
        </div>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import { useCustomerStore } from '../stores/customerStore';
import { buildFilterQuery, readFilterQuery } from '../utils/filterQuery';

const router = useRouter();
const route = useRoute();
const customerStore = useCustomerStore();
const localSearch = ref(customerStore.filters.search || '');
const localSortBy = ref(customerStore.filters.sort_by || 'date');
const localSortDir = ref(customerStore.filters.sort_dir || 'desc');
let searchTimer = null;
let syncingQuery = false;
let hydratingFilters = false;

const customerQueryDefaults = {
  search: '',
  sort_by: 'date',
  sort_dir: 'desc',
  page: 1,
};

const serialStart = computed(() => {
  const pagination = customerStore.pagination;
  if (!pagination) return 1;
  return ((pagination.current_page - 1) * pagination.per_page) + 1;
});

const hydrateFiltersFromRoute = () => {
  hydratingFilters = true;
  customerStore.hydrateFilters(readFilterQuery(route.query, customerQueryDefaults));
  localSearch.value = customerStore.filters.search || '';
  localSortBy.value = customerStore.filters.sort_by || 'date';
  localSortDir.value = customerStore.filters.sort_dir || 'desc';
  hydratingFilters = false;
};

const replaceFilterQuery = async () => {
  syncingQuery = true;
  try {
    await router.replace({
      query: buildFilterQuery(customerStore.filters, customerQueryDefaults),
    });
  } finally {
    syncingQuery = false;
  }
};

watch(localSearch, (value) => {
  if (hydratingFilters) return;
  if (value === customerStore.filters.search) return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    await customerStore.setFilter('search', value);
    await replaceFilterQuery();
  }, 400);
});

watch([localSortBy, localSortDir], async ([sortBy, sortDir]) => {
  if (hydratingFilters) return;
  if (sortBy === customerStore.filters.sort_by && sortDir === customerStore.filters.sort_dir) return;
  await customerStore.setFilters({ sort_by: sortBy, sort_dir: sortDir });
  await replaceFilterQuery();
});

const changePage = async (page) => {
  await customerStore.setPage(page);
  await replaceFilterQuery();
};

const viewOrders = (customer) => {
  router.push({
    path: '/orders',
    query: { customer_id: customer.id },
  });
};

watch(() => ({ ...route.query }), async () => {
  if (syncingQuery) return;
  hydrateFiltersFromRoute();
  await customerStore.fetchCustomers();
});

onMounted(() => {
  hydrateFiltersFromRoute();
  customerStore.fetchCustomers();
});
</script>

<style scoped>
.customers-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.customers-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.card-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h1 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.card-body {
  padding: 22px 28px 26px;
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.search-wrap {
  position: relative;
  width: min(420px, 100%);
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
  padding: 0 32px 0 34px;
}

.search-input:focus {
  border-color: #1e293b;
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 7px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.filters-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.filter-select {
  height: 38px;
  min-width: 132px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 13px;
  font-weight: 700;
  outline: none;
  padding: 0 34px 0 11px;
}

.filter-select:focus {
  border-color: #1e293b;
}

.results-count {
  color: #64748b;
  font-size: 14px;
  white-space: nowrap;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

th,
td {
  padding: 13px 14px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 14px;
  color: #334155;
  vertical-align: top;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
}

tbody tr:last-child td {
  border-bottom: none;
}

strong {
  display: block;
  color: #1e293b;
  font-weight: 750;
}

.subtext {
  display: block;
  color: #94a3b8;
  font-size: 12.5px;
  margin-top: 3px;
}

.address-cell {
  max-width: 320px;
  line-height: 1.4;
}

.actions-cell {
  text-align: right;
}

.view-btn {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 11px;
  cursor: pointer;
  white-space: nowrap;
}

.view-btn:hover {
  background: #f8fafc;
}

.state-cell {
  text-align: center;
  color: #64748b;
  padding: 34px 14px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
}

.pagination button {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .customers-page {
    padding: 18px;
  }

  .filters-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-wrap {
    width: 100%;
  }

  .filters-actions {
    align-items: stretch;
    justify-content: flex-start;
  }

  .select-wrap {
    flex: 1 1 160px;
    align-items: stretch;
    flex-direction: column;
    gap: 5px;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
