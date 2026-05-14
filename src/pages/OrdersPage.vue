<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

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
              @track="handleTrack"
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

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Order?"
      message="This order will be removed from Zyro Automation. This action cannot be undone."
      :details="selectedOrderLabel"
      eyebrow="Order deletion"
      confirmText="Delete Order"
      cancelText="Keep Order"
      variant="danger"
      :loading="deleteLoading"
      @cancel="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import OrderDetailPanel from '../components/orders/OrderDetailPanel.vue';
import OrderEmptyState from '../components/orders/OrderEmptyState.vue';
import OrderFiltersBar from '../components/orders/OrderFiltersBar.vue';
import OrderPagination from '../components/orders/OrderPagination.vue';
import OrdersTable from '../components/orders/OrdersTable.vue';
import ConfirmDialog from '../components/shared/ConfirmDialog.vue';
import { useBrandStore } from '../stores/brandStore';
import { useOrderStore } from '../stores/orderStore';

const orderStore = useOrderStore();
const brandStore = useBrandStore();
const router = useRouter();
const route = useRoute();
const tableRef = ref(null);
const toast = ref('');
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const selectedOrder = ref(null);

const hasActiveFilters = computed(() => Boolean(
  orderStore.filters.brand_id || orderStore.filters.search || orderStore.filters.customer_id
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
  router.push(`/orders/${id}/edit`);
};

const handleTrack = (id) => {
  router.push(`/orders/${id}/tracking`);
};

const handleDelete = (id) => {
  selectedOrder.value = orderStore.orders.find(order => order.id === id) || { id };
  showDeleteDialog.value = true;
};

const selectedOrderLabel = computed(() => {
  if (!selectedOrder.value) return '';
  return selectedOrder.value.order_name || selectedOrder.value.customer?.name || selectedOrder.value.id;
});

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => {
    toast.value = '';
  }, 3000);
};

const closeDeleteDialog = () => {
  if (deleteLoading.value) return;
  showDeleteDialog.value = false;
  selectedOrder.value = null;
};

const confirmDelete = async () => {
  if (!selectedOrder.value) return;
  deleteLoading.value = true;
  try {
    await orderStore.deleteOrder(selectedOrder.value.id);
    showToast('Order deleted.');
    showDeleteDialog.value = false;
    selectedOrder.value = null;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to delete order.');
  } finally {
    deleteLoading.value = false;
  }
};

const handleNewOrder = () => {
  router.push('/orders/create');
};

const applyRouteCustomerFilter = () => {
  orderStore.filters.customer_id = route.query.customer_id || null;
  orderStore.filters.page = 1;
};

watch(() => route.query.customer_id, async () => {
  applyRouteCustomerFilter();
  await orderStore.fetchOrders();
});

onMounted(async () => {
  applyRouteCustomerFilter();
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

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 9999;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  font-size: 13.5px;
  font-weight: 500;
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
