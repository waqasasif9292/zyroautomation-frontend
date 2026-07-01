<template>
  <div class="table-wrap">
    <table class="orders-table">
      <thead>
        <tr>
          <th v-if="selectable" class="col-select">
            <input
              type="checkbox"
              :checked="allPageSelected"
              :indeterminate.prop="somePageSelected && !allPageSelected"
              aria-label="Select all orders on this page"
              @click.stop
              @change="$emit('select-page', $event.target.checked)"
            >
          </th>
          <th
            v-for="column in displayedColumns"
            :key="column.key"
            :class="column.class"
          >
            {{ column.header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="row in 5" :key="row">
            <td v-for="col in visibleColumnCount" :key="col"><span class="skeleton"></span></td>
          </tr>
        </template>
        <tr v-else v-for="(order, index) in orders" :key="order.id" class="order-row">
          <td v-if="selectable" class="select-cell" @click.stop>
            <input
              type="checkbox"
              :checked="selectedOrderIds.includes(order.id)"
              :aria-label="`Select order ${order.order_name || order.id}`"
              @change="$emit('toggle-select', order.id, $event.target.checked)"
            >
          </td>
          <td
            v-for="column in displayedColumns"
            :key="column.key"
            :class="[{ serial: column.key === 'serial', total: column.key === 'total', 'phone-cell': column.key === 'phone' }, column.cellClass]"
          >
            <template v-if="column.key === 'serial'">
              {{ serialStart + index }}
            </template>
            <template v-else-if="column.key === 'order'">
              <div class="strong">{{ order.order_name || '—' }}</div>
              <div class="muted order-time">{{ formatDate(order.shopify_created_at) }}</div>
            </template>
            <template v-else-if="column.key === 'brand'">
              {{ order.brand_name || '—' }}
            </template>
            <template v-else-if="column.key === 'source'">
              <span class="source-badge">{{ order.source || '—' }}</span>
            </template>
            <template v-else-if="column.key === 'tracking'">
              <button
                v-if="order.tracking_number"
                type="button"
                class="tracking-code"
                :title="order.tracking_number"
                @click.stop="$emit('track', order.id)"
              >
                {{ order.tracking_number }}
              </button>
              <span v-else class="tracking-empty">—</span>
            </template>
            <template v-else-if="column.key === 'created_by'">
              <div class="strong">{{ order.created_by?.name || '—' }}</div>
              <div v-if="order.last_saved_by?.name && order.last_saved_by.name !== order.created_by?.name" class="muted">
                Last: {{ order.last_saved_by.name }}
              </div>
            </template>
            <template v-else-if="column.key === 'customer'">
              <div class="strong">{{ order.customer?.name || '—' }}</div>
            </template>
            <template v-else-if="column.key === 'phone'">
              <span class="phone-content">
                <span>{{ orderPhone(order) }}</span>
              </span>
              <button
                v-if="isDuplicateOrder(order) && orderPhone(order) !== '—'"
                class="duplicate-orders-badge"
                type="button"
                aria-label="View duplicate orders"
                title="View duplicate orders"
                @click.stop="openDuplicateOrders(order)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="8" y="8" width="10" height="10" rx="2" />
                  <path d="M6 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </template>
            <template v-else-if="column.key === 'address'">
              <span class="truncate" :title="order.customer?.address">{{ order.customer?.address || '—' }}</span>
            </template>
            <template v-else-if="column.key === 'city'">
              {{ order.customer?.city || '—' }}
            </template>
            <template v-else-if="column.key === 'status'">
              <OrderStatusBadge :status="order.status" />
            </template>
            <template v-else-if="column.key === 'total'">
              {{ formatMoney(order.currency, order.total_price) }}
            </template>
            <template v-else-if="column.key === 'payment'">
              <div class="payment-cell">
                <span class="truncate" :title="order.payment_method">{{ order.payment_method || '—' }}</span>
                <span v-if="isCod(order.payment_method)" class="cod-badge">COD</span>
              </div>
            </template>
            <template v-else-if="column.key === 'products'">
              <span class="truncate" :title="order.line_items_summary">{{ order.line_items_summary || '—' }}</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <div class="action-buttons">
                <button class="action-btn" type="button" aria-label="View order" title="View order" @click.stop="$emit('view', order.id)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
                <RouterLink
                  v-if="canEdit(order)"
                  class="action-btn"
                  :to="orderFormRoute(order.id, 'edit')"
                  aria-label="Edit order"
                  title="Edit order"
                  @click.stop
                  @mousedown.stop="authStore.prepareTabHandoff"
                  @auxclick.stop="authStore.prepareTabHandoff"
                  @contextmenu.stop="authStore.prepareTabHandoff"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m14.5 5.5 4 4" />
                    <path d="M4 20h4.5L19 9.5a2.8 2.8 0 0 0-4-4L4.5 16V20Z" />
                  </svg>
                </RouterLink>
                <RouterLink
                  v-else
                  class="action-btn"
                  :to="orderFormRoute(order.id, 'view')"
                  aria-label="View order form"
                  title="View order form"
                  @click.stop
                  @mousedown.stop="authStore.prepareTabHandoff"
                  @auxclick.stop="authStore.prepareTabHandoff"
                  @contextmenu.stop="authStore.prepareTabHandoff"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3.5h7l3 3V20H7Z" />
                    <path d="M14 3.5V7h3.5" />
                    <path d="M9.5 11h5" />
                    <path d="M9.5 14h5" />
                    <path d="M9.5 17h3" />
                  </svg>
                </RouterLink>
                <button v-if="canCancel(order)" class="action-btn cancel-btn" type="button" aria-label="Cancel order" title="Cancel order" @click.stop="$emit('cancel', order.id)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m9 9 6 6" />
                    <path d="m15 9-6 6" />
                  </svg>
                </button>
                <button
                  v-if="showAddressConfirmationAction && canSendAddressConfirmation(order)"
                  class="action-btn"
                  :class="{ sent: addressConfirmationSent(order) }"
                  type="button"
                  :aria-label="addressConfirmationActionLabel(order)"
                  :title="addressConfirmationActionLabel(order)"
                  :disabled="addressConfirmationLoadingId === order.id"
                  @click.stop="$emit('address-confirmation', order.id)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                    <path d="M8 8h8" />
                    <path d="M8 12h5" />
                  </svg>
                </button>
                <button
                  v-if="showOutForDeliveryAction && canSendOutForDelivery(order)"
                  class="action-btn"
                  :class="{ sent: outForDeliverySent(order) }"
                  type="button"
                  :aria-label="outForDeliveryActionLabel(order)"
                  :title="outForDeliveryActionLabel(order)"
                  :disabled="outForDeliveryLoadingId === order.id"
                  @click.stop="$emit('out-for-delivery', order.id)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 7h11v9H3Z" />
                    <path d="M14 10h3l4 4v2h-7Z" />
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                </button>
                <button v-if="canManageDestructiveActions" class="action-btn danger-btn" type="button" aria-label="Delete order" title="Delete order" @click.stop="$emit('delete', order.id)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M6 7l1 13h10l1-13" />
                    <path d="M9 7V4h6v3" />
                  </svg>
                </button>
              </div>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OrderStatusBadge from './OrderStatusBadge.vue';
import { useAuthStore } from '../../stores/authStore';

const props = defineProps({
  orders: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  serialStart: {
    type: Number,
    default: 1,
  },
  visibleColumns: {
    type: Array,
    default: () => [],
  },
  selectedOrderIds: {
    type: Array,
    default: () => [],
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  allPageSelected: {
    type: Boolean,
    default: false,
  },
  somePageSelected: {
    type: Boolean,
    default: false,
  },
  showAddressConfirmationAction: {
    type: Boolean,
    default: false,
  },
  addressConfirmationLoadingId: {
    type: String,
    default: '',
  },
  showOutForDeliveryAction: {
    type: Boolean,
    default: false,
  },
  outForDeliveryLoadingId: {
    type: String,
    default: '',
  },
});

defineEmits(['view', 'edit', 'delete', 'track', 'cancel', 'address-confirmation', 'out-for-delivery', 'toggle-select', 'select-page']);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const lockedColumns = ['serial', 'actions'];
const columnDefinitions = [
  { key: 'serial', header: '#', class: 'col-serial' },
  { key: 'order', header: 'Order', class: 'col-order' },
  { key: 'brand', header: 'Brand', class: 'col-brand' },
  { key: 'source', header: 'Source', class: 'col-source' },
  { key: 'tracking', header: 'Tracking', class: 'col-tracking' },
  { key: 'created_by', header: 'Created By', class: 'col-created-by' },
  { key: 'customer', header: 'Customer Name', class: 'col-customer' },
  { key: 'phone', header: 'Phone', class: 'col-phone' },
  { key: 'address', header: 'Address', class: 'col-address' },
  { key: 'city', header: 'City', class: 'col-city' },
  { key: 'status', header: 'Status', class: 'col-status' },
  { key: 'total', header: 'Total', class: 'col-total' },
  { key: 'payment', header: 'Payment', class: 'col-payment' },
  { key: 'products', header: 'Product(s)', class: 'col-products' },
  { key: 'actions', header: 'Actions', class: 'col-actions', cellClass: 'col-actions' },
];
const columnDefinitionMap = new Map(columnDefinitions.map(column => [column.key, column]));
const displayedColumns = computed(() => {
  const requested = Array.isArray(props.visibleColumns) ? props.visibleColumns : [];
  const orderedKeys = [...new Set([...requested, ...lockedColumns])];
  return orderedKeys
    .map(column => columnDefinitionMap.get(column))
    .filter(Boolean);
});
const visibleColumnCount = computed(() => displayedColumns.value.length + (props.selectable ? 1 : 0));
const canManageDestructiveActions = computed(() => ['admin', 'owner'].includes(authStore.user?.team_role || 'admin'));
const formatMoney = (currency, value) => `${currency || ''} ${Number(value || 0).toLocaleString()}`.trim();
const isCod = (payment) => (payment || '').toLowerCase().includes('cash on delivery');
const statusText = (status) => {
  if (typeof status === 'string') return status;
  if (typeof status === 'number') return String(status);
  if (status && typeof status === 'object') {
    return status.name || status.label || status.title || status.status || status.message || status.text || '';
  }
  return '';
};
const orderPhone = (order) => order.customer?.phone_local || order.customer?.phone_intl || '—';
const isDuplicateOrder = (order) => statusText(order.status).toLowerCase() === 'duplicate';
const openDuplicateOrders = (order) => {
  const href = router.resolve({
    path: '/orders',
    query: { search: orderPhone(order) },
  }).href;

  authStore.prepareTabHandoff();
  window.open(href, '_blank', 'noopener');
};
const orderFormRoute = (id, mode) => ({
  path: `/orders/${id}/${mode}`,
  query: route.query,
});
const canEdit = (order) => ['pending confirmation', 'duplicate', 'hold', 'on hold', 'error', 'cancel by shipper'].includes(statusText(order.status).toLowerCase());
const canCancel = (order) => {
  const hasTrackingNumber = String(order.tracking_number || '').trim() !== '';
  const isCancelledByShipper = statusText(order.status).toLowerCase() === 'cancel by shipper';
  const isMerchantWarehouse = order.status_category === 'merchant_warehouse';

  return canManageDestructiveActions.value && (!hasTrackingNumber || isMerchantWarehouse) && !isCancelledByShipper;
};
const canSendAddressConfirmation = (order) => Boolean(
  !String(order.tracking_number || '').trim()
    && (order.customer?.phone_local || order.customer?.phone_intl)
    && order.customer?.address
);
const addressConfirmationSent = (order) => order.whatsapp_address_confirmation?.status === 'sent';
const addressConfirmationActionLabel = (order) => (
  addressConfirmationSent(order) ? 'Resend address confirmation' : 'Send address confirmation'
);
const canSendOutForDelivery = (order) => Boolean(
  order.status_category === 'out_for_delivery'
    && (order.customer?.phone_local || order.customer?.phone_intl)
);
const outForDeliverySent = (order) => order.whatsapp_out_for_delivery?.status === 'sent';
const outForDeliveryActionLabel = (order) => (
  outForDeliverySent(order) ? 'Resend out for delivery message' : 'Send out for delivery message'
);
const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
};
</script>

<style scoped>
.table-wrap {
  width: 100%;
  overflow-x: auto;
  scrollbar-gutter: stable;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.orders-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
  table-layout: auto;
}

th {
  height: 42px;
  padding: 10px 12px;
  background: #f8fafc;
  color: #566985;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  height: 64px;
  padding: 12px;
  color: #334155;
  font-size: 13.5px;
  line-height: 1.35;
  vertical-align: middle;
  border-bottom: 1px solid #eaf0f6;
}

.order-row:hover {
  background: #f8fbff;
}

.col-select { width: 44px; text-align: center; }
.col-serial { width: 52px; }
.col-order { width: 170px; }
.col-brand { width: 132px; }
.col-source { width: 112px; }
.col-tracking { width: 112px; }
.col-booking-date { width: 154px; }
.col-created-by { width: 138px; }
.col-customer { width: 150px; }
.col-phone { width: 132px; }
.col-address { width: 220px; }
.col-city { width: 132px; }
.col-status { width: 164px; }
.col-total { width: 118px; }
.col-payment { width: 140px; }
.col-products { width: 190px; }
.col-actions { width: 132px; text-align: center; }

.select-cell {
  text-align: center;
}

.col-select input,
.select-cell input {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
}

td:first-child,
th:first-child {
  padding-left: 14px;
}

td:last-child,
th:last-child {
  padding-right: 14px;
}

.serial,
.strong {
  color: #1e293b;
  font-weight: 800;
}

.strong {
  overflow: hidden;
  max-width: 180px;
  text-overflow: ellipsis;
}

.muted {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.25;
}

.order-time {
  white-space: nowrap;
}

.booking-time {
  display: inline-block;
  min-width: 132px;
  color: #475569;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.total {
  color: #1e293b;
  font-weight: 850;
  text-align: left;
  white-space: nowrap;
}

.phone-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #566985;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.phone-content {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.duplicate-orders-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 24px;
  height: 22px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  cursor: pointer;
  padding: 0;
}

.duplicate-orders-badge:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.duplicate-orders-badge svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.payment-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cod-badge {
  flex: 0 0 auto;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  padding: 3px 7px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.tracking-code,
.tracking-empty {
  display: inline-block;
  overflow: hidden;
  max-width: 92px;
  border: none;
  background: transparent;
  color: #1e40af;
  padding: 0;
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tracking-code {
  cursor: pointer;
}

.tracking-code:hover {
  color: #2563eb;
  text-decoration: underline;
}

.tracking-empty {
  color: #94a3b8;
}

.source-badge {
  display: inline-flex;
  align-items: center;
  max-width: 88px;
  overflow: hidden;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.05;
  text-overflow: ellipsis;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #dbe3ee;
  border-radius: 7px;
  background: #fff;
  color: #2563eb;
  padding: 0;
  box-shadow: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.action-btn svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.action-btn:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.action-btn.sent {
  color: #15803d;
}

.action-btn.sent:hover {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.cancel-btn {
  color: #dc2626;
}

.cancel-btn:hover {
  border-color: #fecaca;
  background: #fef2f2;
}

.danger-btn {
  color: #dc2626;
}

.danger-btn:hover {
  border-color: #fecaca;
  background: #fef2f2;
}

.skeleton {
  display: block;
  width: 100%;
  height: 18px;
  border-radius: 5px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
</style>
