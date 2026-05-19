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
              <button class="action-btn" type="button" @click.stop="$emit('view', order.id)">
                View
              </button>
              <button v-if="canEdit(order)" class="action-btn" type="button" @click.stop="$emit('edit', order.id)">
                Edit
              </button>
              <button v-if="canCancel(order)" class="action-btn cancel-btn" type="button" @click.stop="$emit('cancel', order.id)">
                Cancel
              </button>
              <button class="action-btn" type="button" @click.stop="$emit('delete', order.id)">
                Delete
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
}

.orders-table {
  width: 1540px;
  min-width: 1540px;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 12px 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 14px 10px;
  color: #374151;
  font-size: 14px;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

.order-row {
  cursor: pointer;
}

.order-row:hover {
  background: #f9fafb;
}

.col-serial { width: 56px; }
.col-order { width: 170px; }
.col-brand { width: 140px; }
.col-source { width: 120px; }
.col-tracking { width: 150px; }
.col-customer { width: 190px; }
.col-city { width: 120px; }
.col-products { width: 190px; }
.col-total { width: 110px; }
.col-payment { width: 130px; }
.col-status { width: 120px; }
.col-actions { width: 144px; }

.serial,
.strong {
  color: #1e293b;
  font-weight: 700;
}

.muted {
  margin-top: 3px;
  color: #9ca3af;
  font-size: 12px;
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
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 700;
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
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 29px;
  border: 1px solid #edf2f7;
  border-radius: 4px;
  background: #fff;
  color: #4169e1;
  padding: 0 10px;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.13);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.action-btn:hover {
  border-color: #dbe4ff;
  background: #f8fbff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.16);
}

.cancel-btn {
  color: #dc2626;
}

.cancel-btn:hover {
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
