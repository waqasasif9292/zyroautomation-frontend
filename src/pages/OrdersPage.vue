<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="orders-page">
      <OrderStatsStrip ref="statsRef" class="orders-stats" @select="applyStatsFilter" />

      <section v-if="showBillingBar" class="billing-bar" :class="{ low: isCreditsLow, exhausted: isCreditsExhausted }">
        <div class="billing-main">
          <div class="billing-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M4 7h16v10H4z" />
              <path d="M4 10h16" />
              <path d="M8 15h3" />
            </svg>
          </div>
          <div class="billing-copy">
            <span class="billing-label">Order Credits</span>
            <strong>{{ billingStatusText }}</strong>
            <span>{{ formatNumber(authStore.user?.used_credits) }} used from {{ formatNumber(authStore.user?.total_credits) }} total</span>
          </div>
        </div>
        <div class="billing-progress">
          <div class="billing-meter" aria-hidden="true">
            <span :style="{ width: `${billingMeterWidth}%` }"></span>
          </div>
          <span>{{ billingMeterWidth }}%</span>
        </div>
        <div class="billing-actions">
          <button
            v-if="blockedOrdersCount > 0"
            type="button"
            class="billing-btn secondary"
            :disabled="recoveringBlocked || discardingBlocked"
            @click="recoverBlockedOrders"
          >
            {{ recoveringBlocked ? 'Recovering...' : `Recover ${formatNumber(blockedOrdersCount)}` }}
          </button>
          <button
            v-if="blockedOrdersCount > 0"
            type="button"
            class="billing-btn danger"
            :disabled="recoveringBlocked || discardingBlocked"
            @click="discardBlockedOrders"
          >
            {{ discardingBlocked ? 'Discarding...' : 'Discard' }}
          </button>
          <button type="button" class="billing-btn" @click="router.push('/settings/billing')">
            Top Up
          </button>
        </div>
      </section>

      <section class="orders-card">
        <div class="card-header">
          <div>
            <h1>Orders</h1>
            <p>Incoming orders from your websites and manual entries.</p>
          </div>
          <div class="header-actions">
            <button class="refresh-btn" type="button" :disabled="refreshing || orderStore.loading" @click="reloadOrdersAndStats">
              <svg :class="{ spinning: refreshing || orderStore.loading }" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 0 1-15.5 6.3" />
                <path d="M3 12a9 9 0 0 1 15.5-6.3" />
                <path d="M18 3v4h-4" />
                <path d="M6 21v-4h4" />
              </svg>
              Reload
            </button>
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
            <div ref="columnMenuRef" class="table-tools">
              <div v-if="selectedOrderIds.length" class="bulk-actions">
                <span class="selected-count">{{ selectedOrderIds.length }} selected</span>
                <button
                  class="bulk-export-btn"
                  type="button"
                  :disabled="exportingSelectedOrders"
                  @click="downloadSelectedOrders"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 20h14" />
                  </svg>
                  {{ exportingSelectedOrders ? 'Downloading...' : 'Export Excel' }}
                </button>
                <button
                  v-if="canBulkDeleteOrders"
                  class="bulk-delete-btn"
                  type="button"
                  @click="openBulkDeleteDialog"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M6 7l1 13h10l1-13" />
                    <path d="M9 7V4h6v3" />
                  </svg>
                  Delete Selected
                </button>
              </div>
              <div class="column-menu">
                <button
                  class="column-menu-trigger"
                  type="button"
                  :aria-expanded="showColumnMenu ? 'true' : 'false'"
                  @click="showColumnMenu = !showColumnMenu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5h16M4 12h16M4 19h16" />
                    <path d="M8 5v14M16 5v14" />
                  </svg>
                  Customize Columns
                </button>
                <div v-if="showColumnMenu" class="column-menu-panel">
                  <div
                    v-for="column in orderTableColumns"
                    :key="column.key"
                    class="column-option"
                    :class="{ dragging: draggedColumn === column.key, 'drag-over': dragOverColumn === column.key, locked: column.locked }"
                    :draggable="!column.locked && !savingColumns"
                    @dragstart="startColumnDrag(column, $event)"
                    @dragover.prevent="markColumnDropTarget(column)"
                    @dragleave="clearColumnDropTarget(column)"
                    @drop.prevent="dropColumn(column)"
                    @dragend="endColumnDrag"
                  >
                    <button
                      class="column-drag-handle"
                      type="button"
                      :disabled="column.locked || savingColumns"
                      aria-label="Drag column to reorder"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
                      </svg>
                    </button>
                    <label class="column-check">
                      <input
                        type="checkbox"
                        :checked="isColumnVisible(column.key)"
                        :disabled="column.locked || savingColumns"
                        @change="toggleColumn(column.key, $event.target.checked)"
                      >
                      <span>{{ column.label }}</span>
                    </label>
                    <small v-if="column.locked">Locked</small>
                  </div>
                </div>
              </div>
            </div>
            <OrdersTable
              ref="tableRef"
              :orders="orderStore.orders"
              :loading="orderStore.loading"
              :serial-start="serialStart"
              :visible-columns="visibleOrderColumns"
              :selectable="canBulkDeleteOrders"
              :selected-order-ids="selectedOrderIds"
              :all-page-selected="allVisibleOrdersSelected"
              :some-page-selected="someVisibleOrdersSelected"
              @view="orderStore.fetchOrder"
              @edit="handleEdit"
              @cancel="handleCancel"
              @self-pickup-delivered="handleSelfPickupDelivered"
              @self-pickup-returned="handleSelfPickupReturned"
              @hold-call="openHoldCallWorkflow"
              @delete="handleDelete"
              @track="handleTrack"
              @toggle-select="toggleOrderSelection"
              @select-page="toggleVisibleOrderSelection"
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
          @cancel="handleCancel"
          @delete="handleDelete"
        />
      </section>
    </main>

    <HoldCallWorkflowModal
      :open="showHoldCallModal"
      :order="holdCallOrder"
      :saving="holdCallSaving"
      :ai-loading="holdAddressAiLoading"
      @close="closeHoldCallWorkflow"
      @save-log="payload => saveHoldCallLog(payload, false)"
      @save-log-next="payload => saveHoldCallLog(payload, true)"
      @previous="openPreviousHoldOrder"
      @next="openNextHoldOrder"
      @open-edit="openHoldOrderEdit"
      @create-ai-suggestion="createHoldAiAddressSuggestion"
    />

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
      :show="showBulkDeleteDialog"
      title="Delete Selected Orders?"
      message="The selected orders will be removed from Zyro Automation. This action cannot be undone."
      :details="bulkDeleteDetails"
      eyebrow="Bulk order deletion"
      confirmText="Delete Selected"
      cancelText="Keep Orders"
      variant="danger"
      :loading="deleteLoading"
      @cancel="closeBulkDeleteDialog"
      @confirm="confirmBulkDelete"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import HoldCallWorkflowModal from '../components/orders/HoldCallWorkflowModal.vue';
import OrderDetailPanel from '../components/orders/OrderDetailPanel.vue';
import OrderEmptyState from '../components/orders/OrderEmptyState.vue';
import OrderFiltersBar from '../components/orders/OrderFiltersBar.vue';
import OrderPagination from '../components/orders/OrderPagination.vue';
import OrderStatsStrip from '../components/orders/OrderStatsStrip.vue';
import OrdersTable from '../components/orders/OrdersTable.vue';
import ConfirmDialog from '../components/shared/ConfirmDialog.vue';
import { useAuthStore } from '../stores/authStore';
import { useBrandStore } from '../stores/brandStore';
import { useIntegrationStore } from '../stores/integrationStore';
import { useOrderStore } from '../stores/orderStore';
import BillingService from '../services/BillingService';
import OrderService from '../services/OrderService';
import { buildFilterQuery, readFilterQuery } from '../utils/filterQuery';

const orderStore = useOrderStore();
const authStore = useAuthStore();
const brandStore = useBrandStore();
const integrationStore = useIntegrationStore();
const router = useRouter();
const route = useRoute();
const tableRef = ref(null);
const statsRef = ref(null);
const columnMenuRef = ref(null);
const toast = ref('');
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const selectedOrder = ref(null);
const showBulkDeleteDialog = ref(false);
const selectedOrderIds = ref([]);
const showCancelDialog = ref(false);
const cancelLoading = ref(false);
const selectedCancelOrder = ref(null);
const savingColumns = ref(false);
const showColumnMenu = ref(false);
const refreshing = ref(false);
const recoveringBlocked = ref(false);
const discardingBlocked = ref(false);
const showHoldCallModal = ref(false);
const holdCallOrder = ref(null);
const holdCallSaving = ref(false);
const holdAddressAiLoading = ref(false);
const exportingProducts = ref(false);
const exportingSelectedOrders = ref(false);
const columnOrder = ref([]);
const draggedColumn = ref(null);
const dragOverColumn = ref(null);
let syncingQuery = false;

const lockedOrderColumns = ['serial', 'actions'];
const defaultOrderColumns = ['serial', 'order', 'brand', 'source', 'tracking', 'created_by', 'customer', 'phone', 'status', 'total', 'internal_notes', 'shipment_status', 'actions'];
const allowedOrderColumns = ['serial', 'order', 'brand', 'source', 'tracking', 'created_by', 'customer', 'phone', 'address', 'city', 'status', 'total', 'payment', 'products', 'internal_notes', 'shipment_status', 'actions'];
const visibleOrderColumns = ref([...defaultOrderColumns]);

const orderTableColumnDefinitions = [
  { key: 'serial', label: 'Serial Number', locked: true },
  { key: 'order', label: 'Order' },
  { key: 'brand', label: 'Brand' },
  { key: 'source', label: 'Source' },
  { key: 'tracking', label: 'Tracking' },
  { key: 'created_by', label: 'Created By' },
  { key: 'customer', label: 'Customer Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'payment', label: 'Payment' },
  { key: 'products', label: 'Product(s)' },
  { key: 'internal_notes', label: 'Internal Note' },
  { key: 'shipment_status', label: 'Packing Status' },
  { key: 'actions', label: 'Actions', locked: true },
];
const orderTableColumnMap = new Map(orderTableColumnDefinitions.map(column => [column.key, column]));
const normalizeOrderColumns = (columns = []) => {
  const requested = Array.isArray(columns) && columns.length ? columns : defaultOrderColumns;
  const validColumns = requested.filter(column => allowedOrderColumns.includes(column));
  const orderedColumns = [
    ...new Set([
      ...validColumns,
      ...defaultOrderColumns.filter(column => !validColumns.includes(column)),
      ...allowedOrderColumns.filter(column => !validColumns.includes(column)),
    ]),
  ].filter(column => !lockedOrderColumns.includes(column));

  return ['serial', ...orderedColumns, 'actions'];
};

const normalizeVisibleOrderColumns = (columns = []) => {
  const requested = Array.isArray(columns) && columns.length ? columns : defaultOrderColumns;
  const visibleSet = new Set([...requested.filter(column => allowedOrderColumns.includes(column)), ...lockedOrderColumns]);
  return normalizeOrderColumns(columnOrder.value.length ? columnOrder.value : requested)
    .filter(column => visibleSet.has(column));
};

const orderQueryDefaults = {
  brand_id: null,
  courier_integration_id: null,
  customer_id: null,
  date_from: null,
  date_to: null,
  financial_status: null,
  product_id: null,
  search: '',
  source: null,
  sort: 'created_at_desc',
  status: null,
  page: 1,
};

const exactOrderFilters = (overrides = {}) => ({
  ...orderQueryDefaults,
  ...overrides,
});

const hasActiveFilters = computed(() => Boolean(
  orderStore.filters.brand_id ||
  orderStore.filters.courier_integration_id ||
  orderStore.filters.customer_id ||
  orderStore.filters.date_from ||
  orderStore.filters.date_to ||
  orderStore.filters.product_id ||
  orderStore.filters.search ||
  orderStore.filters.source ||
  orderStore.filters.status
));

const canBulkDeleteOrders = computed(() => ['admin', 'owner'].includes(authStore.user?.team_role || 'admin'));
const showBillingBar = computed(() => Boolean(authStore.user?.billing_enabled));
const remainingCredits = computed(() => Number(authStore.user?.remaining_credits || 0));
const billingMeterWidth = computed(() => Math.min(Math.max(Number(authStore.user?.remaining_percentage || 0), 0), 100));
const isCreditsLow = computed(() => Boolean(authStore.user?.is_low));
const isCreditsExhausted = computed(() => Boolean(authStore.user?.is_exhausted));
const blockedOrdersCount = computed(() => Number(authStore.user?.blocked_orders_count || 0));
const billingStatusText = computed(() => {
  if (isCreditsExhausted.value) return 'No credits remaining';
  if (isCreditsLow.value) return `${formatNumber(remainingCredits.value)} credits left`;
  return `${formatNumber(remainingCredits.value)} credits available`;
});

const visibleOrderIds = computed(() => orderStore.orders.map(order => order.id));

const allVisibleOrdersSelected = computed(() => (
  visibleOrderIds.value.length > 0 && visibleOrderIds.value.every(id => selectedOrderIds.value.includes(id))
));

const someVisibleOrdersSelected = computed(() => (
  visibleOrderIds.value.some(id => selectedOrderIds.value.includes(id))
));

const bulkDeleteDetails = computed(() => {
  const count = selectedOrderIds.value.length;
  return `${count} ${count === 1 ? 'order' : 'orders'} selected`;
});

const serialStart = computed(() => {
  const pagination = orderStore.pagination;
  if (!pagination) return 1;
  return ((pagination.current_page - 1) * pagination.per_page) + 1;
});

const formatNumber = value => Number(value || 0).toLocaleString();

const orderedColumnKeys = computed(() => normalizeOrderColumns(columnOrder.value));

const orderTableColumns = computed(() => orderedColumnKeys.value.map(column => orderTableColumnMap.get(column)).filter(Boolean));

const isColumnVisible = column => visibleOrderColumns.value.includes(column) || lockedOrderColumns.includes(column);

const hydrateOrderColumns = () => {
  const savedColumns = authStore.user?.ui_preferences?.orders_table_columns;
  columnOrder.value = normalizeOrderColumns(savedColumns);
  visibleOrderColumns.value = normalizeVisibleOrderColumns(savedColumns);
};

const saveColumnPreferences = async (message = 'Column preferences saved.') => {
  savingColumns.value = true;
  try {
    await authStore.updateOrdersTableColumns(visibleOrderColumns.value);
    showToast(message);
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to save column preferences.');
  } finally {
    savingColumns.value = false;
  }
};

const toggleColumn = async (column, checked) => {
  if (lockedOrderColumns.includes(column)) return;

  const selected = new Set(visibleOrderColumns.value);
  if (checked) {
    selected.add(column);
  } else {
    selected.delete(column);
  }

  visibleOrderColumns.value = normalizeOrderColumns(columnOrder.value).filter(key => selected.has(key) || lockedOrderColumns.includes(key));
  await saveColumnPreferences();
};

const startColumnDrag = (column, event) => {
  if (column.locked || savingColumns.value) return;
  draggedColumn.value = column.key;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', column.key);
};

const markColumnDropTarget = (column) => {
  if (!draggedColumn.value || column.locked || column.key === draggedColumn.value) return;
  dragOverColumn.value = column.key;
};

const clearColumnDropTarget = (column) => {
  if (dragOverColumn.value === column.key) {
    dragOverColumn.value = null;
  }
};

const dropColumn = async (column) => {
  const fromColumn = draggedColumn.value;
  if (!fromColumn || column.locked || fromColumn === column.key) {
    endColumnDrag();
    return;
  }

  const unlockedColumns = normalizeOrderColumns(columnOrder.value).filter(key => !lockedOrderColumns.includes(key));
  const fromIndex = unlockedColumns.indexOf(fromColumn);
  const toIndex = unlockedColumns.indexOf(column.key);
  if (fromIndex === -1 || toIndex === -1) {
    endColumnDrag();
    return;
  }

  unlockedColumns.splice(toIndex, 0, ...unlockedColumns.splice(fromIndex, 1));
  columnOrder.value = normalizeOrderColumns(['serial', ...unlockedColumns, 'actions']);
  const visibleSet = new Set(visibleOrderColumns.value);
  visibleOrderColumns.value = normalizeOrderColumns(columnOrder.value).filter(key => visibleSet.has(key) || lockedOrderColumns.includes(key));
  endColumnDrag();
  await saveColumnPreferences('Column order saved.');
};

const endColumnDrag = () => {
  draggedColumn.value = null;
  dragOverColumn.value = null;
};

const closeColumnMenu = () => {
  showColumnMenu.value = false;
};

const closeColumnMenuOnOutsideClick = (event) => {
  if (!showColumnMenu.value) return;
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (columnMenuRef.value && (columnMenuRef.value.contains(event.target) || path.includes(columnMenuRef.value))) return;
  closeColumnMenu();
};

const closeColumnMenuOnEscape = (event) => {
  if (event.key === 'Escape') {
    closeColumnMenu();
  }
};

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

const routeWantsExport = () => {
  const value = Array.isArray(route.query.export) ? route.query.export[0] : route.query.export;
  return String(value || '').toLowerCase() === 'true';
};

const filenameFromDisposition = (disposition, fallback) => {
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition || '');
  return match ? decodeURIComponent(match[1]) : fallback;
};

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const exportProductOrderSummary = async () => {
  if (exportingProducts.value) return;

  exportingProducts.value = true;
  try {
    const response = await OrderService.exportProductOrders(buildFilterQuery(orderStore.filters, orderQueryDefaults));
    const filename = filenameFromDisposition(response.headers?.['content-disposition'], 'products_orders.csv');
    const contentType = response.headers?.['content-type'] || 'text/csv;charset=utf-8';
    downloadBlob(new Blob([response.data], { type: contentType }), filename);
    showToast('Product report downloaded.');
  } catch (error) {
    console.error(error);
    showToast('Unable to export product report.');
  } finally {
    exportingProducts.value = false;
    if (routeWantsExport()) {
      await replaceFilterQuery();
    }
  }
};

const reloadOrdersAndStats = async () => {
  refreshing.value = true;
  try {
    await Promise.all([
      orderStore.fetchOrders(),
      statsRef.value?.refresh?.(),
    ]);
  } finally {
    refreshing.value = false;
  }
};

const applyFilters = async (values) => {
  await orderStore.applyFilters(values);
  await replaceFilterQuery();
  await statsRef.value?.refresh?.();
};

const clearFilters = async () => {
  orderStore.hydrateFilters(orderQueryDefaults);
  await replaceFilterQuery();
  await reloadOrdersAndStats();
};

const applyStatsFilter = async (filter) => {
  orderStore.hydrateFilters(exactOrderFilters(filter));
  await replaceFilterQuery();
  await reloadOrdersAndStats();
};

const handleEdit = (id) => {
  router.push(`/orders/${id}/edit`);
};

const handleTrack = (id) => {
  authStore.prepareTabHandoff();
  window.open(router.resolve(`/orders/${id}/tracking`).href, '_blank', 'noopener');
};

const statusText = (status) => {
  if (typeof status === 'string') return status;
  if (typeof status === 'number') return String(status);
  if (status && typeof status === 'object') {
    return status.name || status.label || status.title || status.status || status.message || status.text || '';
  }
  return '';
};

const isHoldOrder = (order) => order?.status_category === 'hold' || ['hold', 'on hold'].includes(statusText(order?.status).toLowerCase());

const fetchHoldOrderDetail = async (id) => {
  const response = await OrderService.getOrder(id);
  return response.data.data.order;
};

const openHoldCallWorkflow = async (id) => {
  const listOrder = orderStore.orders.find(order => order.id === id) || null;
  if (listOrder && !isHoldOrder(listOrder)) return;

  showHoldCallModal.value = true;
  holdCallOrder.value = listOrder;
  try {
    holdCallOrder.value = await fetchHoldOrderDetail(id);
  } catch (error) {
    showToast(error.response?.data?.message || 'Unable to open hold call workflow.');
    closeHoldCallWorkflow();
  }
};

const closeHoldCallWorkflow = () => {
  if (holdCallSaving.value) return;
  showHoldCallModal.value = false;
  holdCallOrder.value = null;
};

const saveHoldCallLog = async ({ action, note = '' }, moveNext = false) => {
  if (!holdCallOrder.value?.id) return;

  holdCallSaving.value = true;
  let saved = false;
  try {
    const updatedOrder = await orderStore.saveHoldCallLog(holdCallOrder.value.id, {
      action,
      note,
    });
    holdCallOrder.value = updatedOrder;
    saved = true;
    showToast('Hold call log saved.');
  } catch (error) {
    console.error(error);
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Unable to save hold call log.';
    showToast(status ? `${message} (${status})` : message);
  } finally {
    holdCallSaving.value = false;
  }

  if (saved && (moveNext || action !== 'custom_note')) {
    try {
      await openNextHoldOrder();
    } catch (error) {
      console.error(error);
      showToast('Call log saved, but unable to open the next order.');
    }
  }
};

const createHoldAiAddressSuggestion = async () => {
  if (!holdCallOrder.value?.id) return;

  holdAddressAiLoading.value = true;
  try {
    holdCallOrder.value = await orderStore.correctOrderAddress(holdCallOrder.value.id);
    showToast('AI address suggestion created.');
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Unable to create AI address suggestion.');
  } finally {
    holdAddressAiLoading.value = false;
  }
};

const openNextHoldOrder = async () => {
  if (!holdCallOrder.value?.id) return;

  const currentIndex = orderStore.orders.findIndex(order => order.id === holdCallOrder.value.id);
  const nextOrder = orderStore.orders.slice(currentIndex + 1).find(isHoldOrder);
  if (nextOrder) {
    await openHoldCallWorkflow(nextOrder.id);
    return;
  }

  if (orderStore.pagination?.has_next) {
    await changePage(orderStore.pagination.current_page + 1);
    const firstHoldOrder = orderStore.orders.find(isHoldOrder);
    if (firstHoldOrder) {
      await openHoldCallWorkflow(firstHoldOrder.id);
      return;
    }
  }

  showToast('No more hold orders in this queue.');
};

const openPreviousHoldOrder = async () => {
  if (!holdCallOrder.value?.id) return;

  const currentIndex = orderStore.orders.findIndex(order => order.id === holdCallOrder.value.id);
  const previousOrder = orderStore.orders.slice(0, Math.max(currentIndex, 0)).reverse().find(isHoldOrder);
  if (previousOrder) {
    await openHoldCallWorkflow(previousOrder.id);
    return;
  }

  if (orderStore.pagination?.has_prev) {
    await changePage(orderStore.pagination.current_page - 1);
    const lastHoldOrder = [...orderStore.orders].reverse().find(isHoldOrder);
    if (lastHoldOrder) {
      await openHoldCallWorkflow(lastHoldOrder.id);
      return;
    }
  }

  showToast('No previous hold order in this queue.');
};

const openHoldOrderEdit = () => {
  if (!holdCallOrder.value?.id) return;
  authStore.prepareTabHandoff();
  window.open(router.resolve({
    path: `/orders/${holdCallOrder.value.id}/edit`,
    query: route.query,
  }).href, '_blank', 'noopener');
};

const handleSelfPickupDelivered = async (id) => {
  try {
    await OrderService.markSelfPickupDelivered(id);
    showToast('Self pickup order marked delivered.');
    await reloadOrdersAndStats();
  } catch (error) {
    showToast(error.response?.data?.message || 'Unable to mark self pickup delivered.');
  }
};

const handleSelfPickupReturned = async (id) => {
  try {
    await OrderService.markSelfPickupReturned(id);
    showToast('Self pickup order marked returned.');
    await reloadOrdersAndStats();
  } catch (error) {
    showToast(error.response?.data?.message || 'Unable to mark self pickup returned.');
  }
};

const orderActionTarget = (orderOrId) => {
  const id = typeof orderOrId === 'object' ? orderOrId?.id : orderOrId;
  return (typeof orderOrId === 'object' && orderOrId)
    || orderStore.orders.find(order => order.id === id)
    || { id };
};

const handleDelete = (orderOrId) => {
  selectedOrder.value = orderActionTarget(orderOrId);
  showDeleteDialog.value = true;
};

const toggleOrderSelection = (id, checked) => {
  const selected = new Set(selectedOrderIds.value);
  if (checked) {
    selected.add(id);
  } else {
    selected.delete(id);
  }
  selectedOrderIds.value = [...selected];
};

const toggleVisibleOrderSelection = (checked) => {
  const selected = new Set(selectedOrderIds.value);
  visibleOrderIds.value.forEach(id => {
    if (checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }
  });
  selectedOrderIds.value = [...selected];
};

const openBulkDeleteDialog = () => {
  if (!selectedOrderIds.value.length) return;
  showBulkDeleteDialog.value = true;
};

const downloadSelectedOrders = async () => {
  const ids = [...selectedOrderIds.value];
  if (!ids.length || exportingSelectedOrders.value) return;

  exportingSelectedOrders.value = true;
  try {
    const response = await OrderService.exportSelectedOrders(ids);
    const filename = filenameFromDisposition(response.headers?.['content-disposition'], `selected_orders_${new Date().toISOString().slice(0, 10)}.xls`);
    downloadBlob(response.data, filename);
    showToast(`${ids.length} ${ids.length === 1 ? 'order' : 'orders'} exported.`);
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to export selected orders.');
  } finally {
    exportingSelectedOrders.value = false;
  }
};

const handleCancel = (orderOrId) => {
  selectedCancelOrder.value = orderActionTarget(orderOrId);
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

const closeBulkDeleteDialog = () => {
  if (deleteLoading.value) return;
  showBulkDeleteDialog.value = false;
};

const confirmDelete = async () => {
  if (!selectedOrder.value) return;
  deleteLoading.value = true;
  try {
    await orderStore.deleteOrder(selectedOrder.value.id);
    await statsRef.value?.refresh?.();
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

const confirmBulkDelete = async () => {
  const ids = [...selectedOrderIds.value];
  if (!ids.length) return;
  deleteLoading.value = true;
  try {
    await orderStore.bulkDeleteOrders(ids);
    await statsRef.value?.refresh?.();
    showToast(`${ids.length} ${ids.length === 1 ? 'order' : 'orders'} deleted.`);
    selectedOrderIds.value = [];
    showBulkDeleteDialog.value = false;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to delete selected orders.');
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
    await statsRef.value?.refresh?.();
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

const recoverBlockedOrders = async () => {
  const message = blockedOrdersCount.value === 1
    ? 'Recover 1 blocked Shopify order now? This will create the order and use 1 billing credit.'
    : `Recover blocked Shopify orders now? This will create up to ${formatNumber(blockedOrdersCount.value)} orders and use 1 billing credit for each recovered order.`;

  if (!window.confirm(message)) return;

  recoveringBlocked.value = true;
  try {
    const response = await BillingService.recoverBlockedOrders();
    showToast(response.data?.message || 'Blocked orders recovered.');
    await Promise.all([
      authStore.fetchUser(),
      orderStore.fetchOrders(),
      statsRef.value?.refresh?.(),
    ]);
  } catch (error) {
    showToast(error.response?.data?.message || 'Unable to recover blocked orders.');
  } finally {
    recoveringBlocked.value = false;
  }
};

const discardBlockedOrders = async () => {
  const message = blockedOrdersCount.value === 1
    ? 'Discard 1 blocked Shopify order? This will permanently remove it from recovery and will not create an order.'
    : `Discard ${formatNumber(blockedOrdersCount.value)} blocked Shopify orders? This will permanently remove them from recovery and will not create orders.`;

  if (!window.confirm(message)) return;

  discardingBlocked.value = true;
  try {
    const response = await BillingService.discardBlockedOrders();
    showToast(response.data?.message || 'Blocked orders discarded.');
    await Promise.all([
      authStore.fetchUser(),
      orderStore.fetchOrders(),
      statsRef.value?.refresh?.(),
    ]);
  } catch (error) {
    showToast(error.response?.data?.message || 'Unable to discard blocked orders.');
  } finally {
    discardingBlocked.value = false;
  }
};

watch(() => ({ ...route.query }), async () => {
  if (syncingQuery) return;
  hydrateFiltersFromRoute();
  await reloadOrdersAndStats();
  if (routeWantsExport()) {
    await exportProductOrderSummary();
  }
});

watch(() => orderStore.orders.map(order => order.id), (ids) => {
  const visible = new Set(ids);
  selectedOrderIds.value = selectedOrderIds.value.filter(id => visible.has(id));
});

onMounted(async () => {
  document.addEventListener('mousedown', closeColumnMenuOnOutsideClick, true);
  document.addEventListener('click', closeColumnMenuOnOutsideClick, true);
  document.addEventListener('keydown', closeColumnMenuOnEscape);
  hydrateFiltersFromRoute();
  await Promise.all([
    orderStore.fetchOrders(),
    authStore.fetchUser(),
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
    integrationStore.fetchIntegrations(),
  ]);
  hydrateOrderColumns();
  if (routeWantsExport()) {
    await exportProductOrderSummary();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', closeColumnMenuOnOutsideClick, true);
  document.removeEventListener('click', closeColumnMenuOnOutsideClick, true);
  document.removeEventListener('keydown', closeColumnMenuOnEscape);
});
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.orders-stats {
  margin: -32px -32px 24px;
}

.billing-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 240px) auto;
  align-items: center;
  gap: 20px;
  margin: 0 0 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  padding: 14px 16px;
}

.billing-bar.low {
  border-color: #facc15;
}

.billing-bar.exhausted {
  border-color: #fca5a5;
}

.billing-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.billing-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
}

.billing-icon svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.billing-bar.low .billing-icon {
  border-color: #fde68a;
  background: #fffbeb;
  color: #a16207;
}

.billing-bar.exhausted .billing-icon {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.billing-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.billing-copy strong {
  color: #1e293b;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.25;
}

.billing-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.billing-progress {
  display: grid;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-align: right;
}

.billing-meter {
  overflow: hidden;
  width: 100%;
  height: 7px;
  border-radius: 999px;
  background: #e2e8f0;
}

.billing-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #16a34a;
}

.billing-bar.low .billing-meter span {
  background: #f59e0b;
}

.billing-bar.exhausted .billing-meter span {
  background: #dc2626;
}

.billing-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.billing-btn {
  border: 1px solid #1e293b;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 900;
  padding: 9px 14px;
}

.billing-btn:hover {
  background: #0f172a;
}

.billing-btn.secondary {
  border-color: #cbd5e1;
  background: #fff;
  color: #1e293b;
}

.billing-btn.secondary:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.billing-btn.danger {
  border-color: #fecaca;
  background: #fff;
  color: #b91c1c;
}

.billing-btn.danger:hover {
  border-color: #fca5a5;
  background: #fef2f2;
}

.billing-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
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

.refresh-btn,
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

.refresh-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #94a3b8;
  background: #f8fafc;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.refresh-btn svg.spinning {
  animation: spin 0.8s linear infinite;
}

.new-order-btn:hover {
  background: #334155;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.table-tools {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}

.bulk-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
  flex-wrap: nowrap;
}

.selected-count {
  color: #475569;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.bulk-export-btn,
.bulk-delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 36px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  color: #dc2626;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  flex: 0 0 auto;
  justify-content: center;
  line-height: 1;
  white-space: nowrap;
}

.bulk-export-btn {
  border-color: #bfdbfe;
  background: #fff;
  color: #1d4ed8;
}

.bulk-delete-btn svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.bulk-export-btn svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.bulk-export-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #93c5fd;
}

.bulk-delete-btn:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
}

.bulk-export-btn:disabled,
.bulk-delete-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.column-menu {
  position: relative;
}

.column-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #b6c2d4;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  padding: 9px 13px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.column-menu-trigger svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.column-menu-trigger[aria-expanded="true"],
.column-menu-trigger:hover {
  border-color: #64748b;
  background: #f8fafc;
  box-shadow: 0 7px 18px rgba(15, 23, 42, 0.08);
}

.column-menu-panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  width: 306px;
  max-height: 330px;
  overflow: auto;
  border: 1px solid #d6deea;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.18);
  padding: 6px;
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 #f1f5f9;
}

.column-menu-panel::-webkit-scrollbar {
  width: 8px;
}

.column-menu-panel::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 999px;
}

.column-menu-panel::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 999px;
  border: 2px solid #f1f5f9;
}

.column-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  border-radius: 7px;
  color: #1f2937;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 750;
  cursor: grab;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.column-option:hover {
  background: #f1f5f9;
}

.column-option.locked {
  cursor: default;
}

.column-option.dragging {
  opacity: 0.55;
}

.column-option.drag-over {
  background: #e0f2fe;
  box-shadow: inset 0 0 0 1px #7dd3fc;
}

.column-drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  padding: 0;
  cursor: grab;
}

.column-drag-handle:disabled {
  cursor: not-allowed;
  color: #cbd5e1;
}

.column-drag-handle svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.column-option:hover .column-drag-handle:not(:disabled) {
  border-color: #dbe3ee;
  background: #fff;
}

.column-check {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.column-option input {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  accent-color: #1e293b;
}

.column-option input:disabled {
  cursor: not-allowed;
}

.column-check span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-option small {
  border-radius: 999px;
  background: #eef2ff;
  color: #475569;
  padding: 4px 7px;
  font-size: 10px;
  font-weight: 800;
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
    padding: 14px;
  }

  .orders-stats {
    margin: -14px -14px 14px;
  }

  .billing-bar {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .billing-progress {
    text-align: left;
  }

  .billing-actions {
    width: 100%;
    justify-self: stretch;
    flex-wrap: wrap;
  }

  .billing-btn {
    flex: 1 1 96px;
    min-height: 40px;
  }

  .card-header,
  .card-body {
    padding-left: 14px;
    padding-right: 14px;
  }

  .card-header,
  .header-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-header {
    padding-top: 18px;
    padding-bottom: 18px;
  }

  .card-header h1 {
    font-size: 19px;
  }

  .card-header p {
    font-size: 13px;
  }

  .header-actions {
    width: 100%;
    gap: 8px;
  }

  .refresh-btn,
  .new-order-btn {
    width: 100%;
    min-height: 42px;
    justify-content: center;
  }

  .card-body {
    padding-top: 16px;
    padding-bottom: 18px;
  }

  .table-tools {
    align-items: stretch;
    flex-direction: column;
  }

  .bulk-actions {
    width: 100%;
    margin-right: 0;
    justify-content: space-between;
  }

  .column-menu-trigger,
  .bulk-delete-btn {
    width: 100%;
    min-height: 40px;
    justify-content: center;
  }

  .column-menu-panel {
    position: fixed;
    z-index: 110;
    top: 68px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: min(460px, calc(100dvh - 92px));
  }

  .orders-card {
    border-radius: 8px;
  }

  .toast {
    top: 70px;
    left: 12px;
    right: 12px;
    text-align: center;
  }
}

@media (max-width: 420px) {
  .orders-page {
    padding: 10px;
  }

  .orders-stats {
    margin: -10px -10px 12px;
  }

  .card-header,
  .card-body {
    padding-left: 12px;
    padding-right: 12px;
  }
}
</style>
