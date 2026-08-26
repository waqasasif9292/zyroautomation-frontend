<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="page">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h1>Product Wise Profit Loss</h1>
            <p>Saved product-wise profit/loss reports from actual order performance.</p>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" type="button" @click="router.push('/overall-profit-loss/create')">Overall Report</button>
            <button class="primary-btn" type="button" @click="router.push('/profit-loss-calculations/create')">Add Report</button>
          </div>
        </div>

        <div class="filters-bar">
          <form class="search-group" @submit.prevent="applySearch">
            <div class="search-wrap">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                v-model="localSearch"
                class="search-input"
                type="search"
                placeholder="Search reports"
                aria-label="Search reports"
              >
              <button v-if="localSearch" class="clear-search" type="button" aria-label="Clear search" @click="clearSearch">&times;</button>
            </div>
            <button class="search-btn" type="submit">Search</button>
          </form>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date Range</th>
                <th>Final Profit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="4">Loading product wise profit/loss reports...</td>
              </tr>
              <tr v-else-if="!calculations.length">
                <td colspan="4">No product wise profit/loss reports yet.</td>
              </tr>
              <tr v-for="calculation in calculations" v-else :key="calculation.id">
                <td><button class="name-btn" type="button" @click="router.push(`/profit-loss-calculations/${calculation.id}`)">{{ calculation.name }}</button></td>
                <td>{{ calculation.start_date }} to {{ calculation.end_date }}</td>
                <td>
                  <div class="profit-cell">
                    <span :class="calculation.results?.totals?.final_profit >= 0 ? 'success' : 'danger'">{{ money(calculation.results?.totals?.final_profit) }}</span>
                    <button
                      class="refresh-btn"
                      type="button"
                      title="Refresh profit"
                      :disabled="refreshingIds.has(calculation.id)"
                      @click="refreshProfit(calculation)"
                    >
                      <svg :class="{ spinning: refreshingIds.has(calculation.id) }" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21 12a9 9 0 0 1-15.5 6.2" />
                        <path d="M3 12A9 9 0 0 1 18.5 5.8" />
                        <path d="M18.5 2.8v3h-3" />
                        <path d="M5.5 21.2v-3h3" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td>
                  <div class="actions">
                    <button type="button" @click="router.push(`/profit-loss-calculations/${calculation.id}`)">View</button>
                    <button type="button" @click="router.push(`/profit-loss-calculations/${calculation.id}/edit`)">Edit</button>
                    <button class="danger-btn" type="button" @click="remove(calculation)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <OrderPagination
          class="list-pagination"
          :pagination="pagination"
          item-label="reports"
          @page-change="changePage"
        />
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import OrderPagination from '../../components/orders/OrderPagination.vue';
import { useProfitLossCalculationStore } from '../../stores/profitLossCalculationStore';

const router = useRouter();
const route = useRoute();
const store = useProfitLossCalculationStore();
const { calculations, pagination, loading } = storeToRefs(store);
const toast = ref('');
const refreshingIds = ref(new Set());
const localSearch = ref(String(route.query.search || ''));
const perPage = 30;
const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const currentPage = computed(() => Math.max(1, Number(route.query.page || 1)));
const currentSearch = computed(() => String(route.query.search || '').trim());

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const remove = async (calculation) => {
  if (!confirm(`Delete ${calculation.name}?`)) return;
  await store.deleteCalculation(calculation.id);
  if (calculations.value.length === 0 && pagination.value?.has_prev) {
    await changePage(pagination.value.current_page - 1);
  } else {
    await loadCalculations(currentPage.value);
  }
  showToast('Report deleted.');
};

const refreshProfit = async (calculation) => {
  if (refreshingIds.value.has(calculation.id)) return;
  refreshingIds.value = new Set([...refreshingIds.value, calculation.id]);

  try {
    await store.refreshProfit(calculation.id);
    showToast('Profit refreshed.');
  } catch {
    showToast('Failed to refresh profit.');
  } finally {
    const next = new Set(refreshingIds.value);
    next.delete(calculation.id);
    refreshingIds.value = next;
  }
};

const loadCalculations = async (page = currentPage.value) => {
  await store.fetchCalculations({
    page,
    per_page: perPage,
    search: currentSearch.value || undefined,
  });
};

const changePage = async (page) => {
  const targetPage = Math.max(1, Number(page || 1));
  await router.push({ query: { ...route.query, page: targetPage === 1 ? undefined : targetPage } });
  await loadCalculations(targetPage);
};

const applySearch = async () => {
  const search = localSearch.value.trim();
  await router.push({
    query: {
      ...route.query,
      page: undefined,
      search: search || undefined,
    },
  });
  await loadCalculations(1);
};

const clearSearch = async () => {
  localSearch.value = '';
  if (!currentSearch.value) return;
  await applySearch();
};

watch(
  () => route.query.search,
  (search) => {
    localSearch.value = String(search || '');
  }
);

onMounted(async () => {
  await loadCalculations();
  if (route.query.toast === 'created') {
    showToast('Report created.');
    router.replace({
      query: {
        page: route.query.page,
        search: route.query.search,
      },
    });
  } else if (route.query.toast === 'updated') {
    showToast('Report updated.');
    router.replace({
      query: {
        page: route.query.page,
        search: route.query.search,
      },
    });
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
  background: #fff;
  border-radius: 12px;
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

h1 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
}

p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.primary-btn {
  border: 1px solid #1e293b;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(520px, 100%);
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
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

.search-btn {
  height: 38px;
  border: 1px solid #1e293b;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.search-btn:hover {
  background: #0f172a;
}

.secondary-btn {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
}

.table-wrap {
  overflow-x: auto;
}

.list-pagination {
  margin: 0 28px 24px;
}

table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
}

th,
td {
  padding: 13px 16px;
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

.name-btn {
  border: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.actions button {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 7px 10px;
  cursor: pointer;
}

.profit-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  cursor: pointer;
}

.refresh-btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

.refresh-btn svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.danger-btn,
.danger {
  color: #dc2626;
}

.success {
  color: #16a34a;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 20;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  font-size: 13px;
}
</style>
