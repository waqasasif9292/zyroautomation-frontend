<template>
  <AppLayout>
    <main class="orders-page">
      <section class="orders-card">
        <div class="card-header">
          <div>
            <h1>Orders</h1>
            <p>Incoming orders from your Shopify stores.</p>
          </div>
          <button class="new-order-btn" type="button" @click="handleNewOrder">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            New Order
          </button>
        </div>

        <div class="card-body">
          <OrderFiltersBar
            :filters="orderStore.filters"
            :brands="brandStore.brands"
            :total="orderStore.pagination?.total || 0"
            @brand-change="orderStore.setFilter('brand_id', $event)"
            @search-change="orderStore.setFilter('search', $event)"
          />

          <OrderEmptyState
            v-if="!orderStore.loading && orderStore.orders.length === 0"
            :variant="hasActiveFilters ? 'filtered' : 'empty'"
            @clear="orderStore.resetFilters"
          />
          <template v-else>
            <OrdersTable
              ref="tableRef"
              :orders="orderStore.orders"
              :loading="orderStore.loading"
              :serial-start="serialStart"
              @view="orderStore.fetchOrder"
              @edit="handleEdit"
              @delete="handleDelete"
            />
            <OrderPagination
              :pagination="orderStore.pagination"
              @page-change="changePage"
            />
          </template>
        </div>

        <OrderDetailPanel
          :open="orderStore.panelOpen"
          :order="orderStore.selectedOrder"
          :loading="orderStore.detailLoading"
          @close="orderStore.closePanel"
        />
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import OrderDetailPanel from '../components/orders/OrderDetailPanel.vue';
import OrderEmptyState from '../components/orders/OrderEmptyState.vue';
import OrderFiltersBar from '../components/orders/OrderFiltersBar.vue';
import OrderPagination from '../components/orders/OrderPagination.vue';
import OrdersTable from '../components/orders/OrdersTable.vue';
import { useBrandStore } from '../stores/brandStore';
import { useOrderStore } from '../stores/orderStore';

const orderStore = useOrderStore();
const brandStore = useBrandStore();
const router = useRouter();
const tableRef = ref(null);

const hasActiveFilters = computed(() => Boolean(
  orderStore.filters.brand_id || orderStore.filters.search
));

const serialStart = computed(() => {
  const pagination = orderStore.pagination;
  if (!pagination) return 1;
  return ((pagination.current_page - 1) * pagination.per_page) + 1;
});

const changePage = async (page) => {
  await orderStore.setPage(page);
  tableRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const handleEdit = (id) => {
  window.alert(`Edit order ${id} will be added with the order status workflow.`);
};

const handleDelete = (id) => {
  window.alert(`Delete order ${id} will be added with the order status workflow.`);
};

const handleNewOrder = () => {
  router.push('/orders/create');
};

onMounted(async () => {
  await Promise.all([
    orderStore.fetchOrders(),
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
  ]);
});
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.orders-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: visible;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.new-order-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.new-order-btn:hover {
  background: #334155;
}

.card-body {
  padding: 22px 28px 26px;
}

@media (max-width: 760px) {
  .orders-page {
    padding: 16px;
  }

  .card-header,
  .card-body {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>
