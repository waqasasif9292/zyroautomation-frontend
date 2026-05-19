<template>
  <div class="table-wrap">
    <table class="orders-table">
      <thead>
        <tr>
          <th class="col-serial">#</th>
          <th class="col-order">Order</th>
          <th class="col-brand">Brand</th>
          <th class="col-source">Source</th>
          <th class="col-tracking">Tracking</th>
          <th class="col-customer">Customer</th>
          <th class="col-city">City</th>
          <th class="col-status">Status</th>
          <th class="col-total">Total</th>
          <th class="col-payment">Payment</th>
          <th class="col-products">Product(s)</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="row in 5" :key="row">
            <td v-for="col in 12" :key="col"><span class="skeleton"></span></td>
          </tr>
        </template>
        <tr v-else v-for="(order, index) in orders" :key="order.id" class="order-row" @click="$emit('view', order.id)">
          <td class="serial">{{ serialStart + index }}</td>
          <td>
            <div class="strong">{{ order.order_name || '—' }}</div>
            <div class="muted order-time">{{ formatDate(order.shopify_created_at) }}</div>
          </td>
          <td>{{ order.brand_name || '—' }}</td>
          <td>
            <span class="source-badge">{{ order.source || '—' }}</span>
          </td>
          <td>
            <button
              v-if="order.tracking_number"
              type="button"
              class="tracking-code"
              @click.stop="$emit('track', order.id)"
            >
              {{ order.tracking_number }}
            </button>
            <span v-else class="tracking-empty">—</span>
          </td>
          <td>
            <div class="strong">{{ order.customer?.name || '—' }}</div>
            <div class="muted">{{ order.customer?.phone_local || order.customer?.phone_intl || '—' }}</div>
          </td>
          <td>{{ order.customer?.city || '—' }}</td>
          <td><OrderStatusBadge :status="order.status" /></td>
          <td class="total">{{ formatMoney(order.currency, order.total_price) }}</td>
          <td>
            <div class="payment-cell">
              <span class="truncate" :title="order.payment_method">{{ order.payment_method || '—' }}</span>
              <span v-if="isCod(order.payment_method)" class="cod-badge">COD</span>
            </div>
          </td>
          <td>
            <span class="truncate" :title="order.line_items_summary">{{ order.line_items_summary || '—' }}</span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="action-btn" type="button" aria-label="View order" title="View order" @click.stop="$emit('view', order.id)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </button>
              <button v-if="canEdit(order)" class="action-btn" type="button" aria-label="Edit order" title="Edit order" @click.stop="$emit('edit', order.id)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m14.5 5.5 4 4" />
                  <path d="M4 20h4.5L19 9.5a2.8 2.8 0 0 0-4-4L4.5 16V20Z" />
                </svg>
              </button>
              <button v-if="canCancel(order)" class="action-btn cancel-btn" type="button" aria-label="Cancel order" title="Cancel order" @click.stop="$emit('cancel', order.id)">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m9 9 6 6" />
                  <path d="m15 9-6 6" />
                </svg>
              </button>
              <button class="action-btn danger-btn" type="button" aria-label="Delete order" title="Delete order" @click.stop="$emit('delete', order.id)">
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
import OrderStatusBadge from './OrderStatusBadge.vue';

defineProps({
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
});

defineEmits(['view', 'edit', 'delete', 'track', 'cancel']);

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
const canEdit = (order) => ['pending confirmation', 'hold', 'on hold', 'cancel by shipper'].includes(statusText(order.status).toLowerCase());
const canCancel = (order) => {
  const hasTrackingNumber = String(order.tracking_number || '').trim() !== '';
  const isCancelledByShipper = statusText(order.status).toLowerCase() === 'cancel by shipper';

  return !hasTrackingNumber && !isCancelledByShipper;
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
  border-radius: 14px;
  background: #fff;
}

.orders-table {
  width: 100%;
  min-width: 1570px;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 14px 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  text-align: left;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 16px 12px;
  color: #374151;
  font-size: 14px;
  line-height: 1.35;
  vertical-align: middle;
  border-bottom: 1px solid #eaf0f6;
}

.order-row {
  cursor: pointer;
}

.order-row:hover {
  background: #fbfdff;
}

.col-serial { width: 2.9%; }
.col-order { width: 9.9%; }
.col-brand { width: 8%; }
.col-source { width: 6.4%; }
.col-tracking { width: 5.5%; }
.col-customer { width: 11.8%; }
.col-city { width: 6.9%; }
.col-status { width: 10.6%; }
.col-total { width: 6.5%; }
.col-payment { width: 8.3%; }
.col-products { width: 12.1%; }
.col-actions { width: 11.1%; }

.serial,
.strong {
  color: #1e293b;
  font-weight: 700;
}

.muted {
  margin-top: 3px;
  color: #9ca3af;
  font-size: 12.5px;
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
  font-weight: 700;
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
  max-width: 100%;
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
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #fff;
  color: #2563eb;
  padding: 0;
  box-shadow: none;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.action-btn svg {
  width: 16px;
  height: 16px;
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
