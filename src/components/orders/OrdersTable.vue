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
          <th v-if="isVisible('serial')" class="col-serial">#</th>
          <th v-if="isVisible('order')" class="col-order">Order</th>
          <th v-if="isVisible('brand')" class="col-brand">Brand</th>
          <th v-if="isVisible('source')" class="col-source">Source</th>
          <th v-if="isVisible('tracking')" class="col-tracking">Tracking</th>
          <th v-if="isVisible('created_by')" class="col-created-by">Created By</th>
          <th v-if="isVisible('customer')" class="col-customer">Customer Name</th>
          <th v-if="isVisible('phone')" class="col-phone">Phone</th>
          <th v-if="isVisible('city')" class="col-city">City</th>
          <th v-if="isVisible('status')" class="col-status">Status</th>
          <th v-if="isVisible('total')" class="col-total">Total</th>
          <th v-if="isVisible('payment')" class="col-payment">Payment</th>
          <th v-if="isVisible('products')" class="col-products">Product(s)</th>
          <th v-if="isVisible('actions')" class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="row in 5" :key="row">
            <td v-for="col in visibleColumnCount" :key="col"><span class="skeleton"></span></td>
          </tr>
        </template>
        <tr v-else v-for="(order, index) in orders" :key="order.id" class="order-row" @click="$emit('view', order.id)">
          <td v-if="selectable" class="select-cell" @click.stop>
            <input
              type="checkbox"
              :checked="selectedOrderIds.includes(order.id)"
              :aria-label="`Select order ${order.order_name || order.id}`"
              @change="$emit('toggle-select', order.id, $event.target.checked)"
            >
          </td>
          <td v-if="isVisible('serial')" class="serial">{{ serialStart + index }}</td>
          <td v-if="isVisible('order')">
            <div class="strong">{{ order.order_name || '—' }}</div>
            <div class="muted order-time">{{ formatDate(order.shopify_created_at) }}</div>
          </td>
          <td v-if="isVisible('brand')">{{ order.brand_name || '—' }}</td>
          <td v-if="isVisible('source')">
            <span class="source-badge">{{ order.source || '—' }}</span>
          </td>
          <td v-if="isVisible('tracking')">
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
          </td>
          <td v-if="isVisible('created_by')">
            <div class="strong">{{ order.created_by?.name || '—' }}</div>
            <div v-if="order.last_saved_by?.name && order.last_saved_by.name !== order.created_by?.name" class="muted">
              Last: {{ order.last_saved_by.name }}
            </div>
          </td>
          <td v-if="isVisible('customer')">
            <div class="strong">{{ order.customer?.name || '—' }}</div>
          </td>
          <td v-if="isVisible('phone')" class="phone-cell">{{ order.customer?.phone_local || order.customer?.phone_intl || '—' }}</td>
          <td v-if="isVisible('city')">{{ order.customer?.city || '—' }}</td>
          <td v-if="isVisible('status')"><OrderStatusBadge :status="order.status" /></td>
          <td v-if="isVisible('total')" class="total">{{ formatMoney(order.currency, order.total_price) }}</td>
          <td v-if="isVisible('payment')">
            <div class="payment-cell">
              <span class="truncate" :title="order.payment_method">{{ order.payment_method || '—' }}</span>
              <span v-if="isCod(order.payment_method)" class="cod-badge">COD</span>
            </div>
          </td>
          <td v-if="isVisible('products')">
            <span class="truncate" :title="order.line_items_summary">{{ order.line_items_summary || '—' }}</span>
          </td>
          <td v-if="isVisible('actions')">
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
                :to="`/orders/${order.id}/edit`"
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
              <button v-if="canCancel(order)" class="action-btn cancel-btn" type="button" aria-label="Cancel order" title="Cancel order" @click.stop="$emit('cancel', order.id)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m9 9 6 6" />
                  <path d="m15 9-6 6" />
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
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
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
});

defineEmits(['view', 'edit', 'delete', 'track', 'cancel', 'toggle-select', 'select-page']);

const authStore = useAuthStore();
const lockedColumns = ['serial', 'actions'];
const visibleColumnSet = computed(() => new Set([...props.visibleColumns, ...lockedColumns]));
const isVisible = column => visibleColumnSet.value.has(column);
const visibleColumnCount = computed(() => visibleColumnSet.value.size + (props.selectable ? 1 : 0));
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
const canEdit = (order) => ['pending confirmation', 'duplicate', 'hold', 'on hold', 'error', 'cancel by shipper'].includes(statusText(order.status).toLowerCase());
const canCancel = (order) => {
  const hasTrackingNumber = String(order.tracking_number || '').trim() !== '';
  const isCancelledByShipper = statusText(order.status).toLowerCase() === 'cancel by shipper';
  const isMerchantWarehouse = order.status_category === 'merchant_warehouse';

  return canManageDestructiveActions.value && (!hasTrackingNumber || isMerchantWarehouse) && !isCancelledByShipper;
};
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

.order-row {
  cursor: pointer;
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
.col-created-by { width: 138px; }
.col-customer { width: 150px; }
.col-phone { width: 132px; }
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
  color: #566985;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
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
