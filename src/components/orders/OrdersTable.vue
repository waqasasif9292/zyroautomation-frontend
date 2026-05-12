<template>
  <div class="table-wrap">
    <table class="orders-table">
      <thead>
        <tr>
          <th class="col-serial">#</th>
          <th class="col-order">Order</th>
          <th class="col-brand">Brand</th>
          <th class="col-source">Source</th>
          <th class="col-customer">Customer</th>
          <th class="col-city">City</th>
          <th class="col-products">Product(s)</th>
          <th class="col-total">Total</th>
          <th class="col-payment">Payment</th>
          <th class="col-status">Status</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="row in 5" :key="row">
            <td v-for="col in 11" :key="col"><span class="skeleton"></span></td>
          </tr>
        </template>
        <tr v-else v-for="(order, index) in orders" :key="order.id" class="order-row" @click="$emit('view', order.id)">
          <td class="serial">{{ serialStart + index }}</td>
          <td>
            <div class="strong">{{ order.order_name || '—' }}</div>
            <div class="muted">{{ formatDate(order.shopify_created_at) }}</div>
          </td>
          <td>{{ order.brand_name || '—' }}</td>
          <td>
            <span class="source-badge">{{ order.source || '—' }}</span>
          </td>
          <td>
            <div class="strong">{{ order.customer?.name || '—' }}</div>
            <div class="muted">{{ order.customer?.phone_local || order.customer?.phone_intl || '—' }}</div>
          </td>
          <td>{{ order.customer?.city || '—' }}</td>
          <td>
            <span class="truncate" :title="order.line_items_summary">{{ order.line_items_summary || '—' }}</span>
          </td>
          <td class="total">{{ formatMoney(order.currency, order.total_price) }}</td>
          <td>
            <div class="payment-cell">
              <span class="truncate" :title="order.payment_method">{{ order.payment_method || '—' }}</span>
              <span v-if="isCod(order.payment_method)" class="cod-badge">COD</span>
            </div>
          </td>
          <td><OrderStatusBadge :status="order.status" /></td>
          <td>
            <div class="action-buttons">
              <button class="icon-btn" type="button" aria-label="View order" title="View order" @click.stop="$emit('view', order.id)">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <template v-if="canManage(order)">
                <button class="icon-btn" type="button" aria-label="Edit order" title="Edit order" @click.stop="$emit('edit', order.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button class="icon-btn danger" type="button" aria-label="Delete order" title="Delete order" @click.stop="$emit('delete', order.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </template>
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

defineEmits(['view', 'edit', 'delete']);

const formatMoney = (currency, value) => `${currency || ''} ${Number(value || 0).toLocaleString()}`.trim();
const isCod = (payment) => (payment || '').toLowerCase().includes('cash on delivery');
const canManage = (order) => ['pending confirmation', 'hold'].includes((order.status || '').toLowerCase());
const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
};
</script>

<style scoped>
.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.orders-table {
  width: 100%;
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

.col-serial { width: 5%; }
.col-order { width: 10%; }
.col-brand { width: 10%; }
.col-source { width: 8%; }
.col-customer { width: 14%; }
.col-city { width: 8%; }
.col-products { width: 13%; }
.col-total { width: 8%; }
.col-payment { width: 10%; }
.col-status { width: 8%; }
.col-actions { width: 6%; }

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
  gap: 6px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.icon-btn:hover {
  color: #3b82f6;
  border-color: #bfdbfe;
}

.icon-btn.danger:hover {
  color: #ef4444;
  border-color: #fecaca;
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
