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
          <div class="header-actions">
            <button class="new-order-btn" type="button" @click="handleNewOrder">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              New Order
            </button>
          </div>
        </div>

        <div class="card-body">
          <OrderFiltersBar
            :filters="orderStore.filters"
            :brands="brandStore.brands"
            :integrations="integrationStore.integrations"
            :total="orderStore.pagination?.total || 0"
            @apply="applyFilters"
            @clear="clearFilters"
          />

          <OrderEmptyState
            v-if="!orderStore.loading && orderStore.orders.length === 0"
            :variant="hasActiveFilters ? 'filtered' : 'empty'"
            @clear="clearFilters"
          />
          <template v-else>
            <OrderPagination
              class="pagination-top"
              :pagination="orderStore.pagination"
              @page-change="changePage"
            />
            <OrdersTable
              ref="tableRef"
              :orders="orderStore.orders"
              :loading="orderStore.loading"
              :serial-start="serialStart"
              @view="orderStore.fetchOrder"
              @edit="handleEdit"
              @cancel="handleCancel"
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

    <ConfirmDialog
      :show="showCancelDialog"
      title="Cancel Order?"
      message="This will change the order status to cancel by shipper."
      :details="selectedCancelOrderLabel"
      eyebrow="Order cancellation"
      confirmText="Cancel Order"
      cancelText="Keep Order"
      variant="danger"
      :loading="cancelLoading"
      @cancel="closeCancelDialog"
      @confirm="confirmCancel"
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
import { useAuthStore } from '../stores/authStore';
import { useBrandStore } from '../stores/brandStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { useOrderStore } from '../stores/orderStore';
import { buildFilterQuery, readFilterQuery } from '../utils/filterQuery';

const orderStore = useOrderStore();
const authStore = useAuthStore();
const brandStore = useBrandStore();
const integrationStore = useIntegrationStore();
const router = useRouter();
const route = useRoute();
const tableRef = ref(null);
const toast = ref('');
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const selectedOrder = ref(null);
const showCancelDialog = ref(false);
const cancelLoading = ref(false);
const selectedCancelOrder = ref(null);
let syncingQuery = false;

const orderQueryDefaults = {
  brand_id: null,
  courier_integration_id: null,
  customer_id: null,
  date_from: null,
  date_to: null,
  financial_status: null,
  search: '',
  source: null,
  sort: 'created_id_desc',
  status: null,
  page: 1,
};

const hasActiveFilters = computed(() => Boolean(
  orderStore.filters.brand_id ||
  orderStore.filters.courier_integration_id ||
  orderStore.filters.customer_id ||
  orderStore.filters.date_from ||
  orderStore.filters.date_to ||
  orderStore.filters.search ||
  orderStore.filters.source ||
  orderStore.filters.status
));

const serialStart = computed(() => {
  const pagination = orderStore.pagination;
  if (!pagination) return 1;
  return ((pagination.current_page - 1) * pagination.per_page) + 1;
});

const changePage = async (page) => {
  await orderStore.setPage(page);
  await replaceFilterQuery();
  tableRef.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const hydrateFiltersFromRoute = () => {
  orderStore.hydrateFilters(readFilterQuery(route.query, orderQueryDefaults));
};

const replaceFilterQuery = async () => {
  syncingQuery = true;
  try {
    await router.replace({
      query: buildFilterQuery(orderStore.filters, orderQueryDefaults),
    });
  } finally {
    syncingQuery = false;
  }
};

const applyFilters = async (values) => {
  await orderStore.applyFilters(values);
  await replaceFilterQuery();
};

const clearFilters = async () => {
  orderStore.hydrateFilters(orderQueryDefaults);
  await replaceFilterQuery();
  await orderStore.fetchOrders();
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

const handleCancel = (id) => {
  selectedCancelOrder.value = orderStore.orders.find(order => order.id === id) || { id };
  showCancelDialog.value = true;
};

const selectedOrderLabel = computed(() => {
  if (!selectedOrder.value) return '';
  return selectedOrder.value.order_name || selectedOrder.value.customer?.name || selectedOrder.value.id;
});

const selectedCancelOrderLabel = computed(() => {
  if (!selectedCancelOrder.value) return '';
  return selectedCancelOrder.value.order_name || selectedCancelOrder.value.customer?.name || selectedCancelOrder.value.id;
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

const closeCancelDialog = () => {
  if (cancelLoading.value) return;
  showCancelDialog.value = false;
  selectedCancelOrder.value = null;
};

const confirmCancel = async () => {
  if (!selectedCancelOrder.value) return;
  cancelLoading.value = true;
  try {
    await orderStore.cancelByShipper(selectedCancelOrder.value.id);
    showToast('Order cancelled by shipper.');
    showCancelDialog.value = false;
    selectedCancelOrder.value = null;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to cancel order.');
  } finally {
    cancelLoading.value = false;
  }
};

const handleNewOrder = () => {
  router.push('/orders/create');
};

watch(() => ({ ...route.query }), async () => {
  if (syncingQuery) return;
  hydrateFiltersFromRoute();
  await orderStore.fetchOrders();
});

onMounted(async () => {
  hydrateFiltersFromRoute();
  await Promise.all([
    orderStore.fetchOrders(),
    authStore.fetchUser(),
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
    integrationStore.integrations.length ? Promise.resolve() : integrationStore.fetchIntegrations(),
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
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

.pagination-top {
  padding: 0 0 14px;
  border-top: none;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 10px;
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

  .card-header,
  .header-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
