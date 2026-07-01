<template>
  <Teleport to="body">
    <div v-if="open" class="panel-root">
      <div class="overlay" @click="$emit('close')"></div>
      <aside class="panel">
        <div class="panel-header">
          <div>
            <h2>{{ order?.order_name || 'Order' }}</h2>
            <p>{{ formatDateTime(order?.shopify_created_at) }}</p>
            <OrderStatusBadge v-if="order" :status="order.status" />
          </div>
          <button class="close-btn" type="button" @click="$emit('close')" aria-label="Close">×</button>
        </div>

        <div class="panel-body">
          <div v-if="loading" class="detail-skeleton">
            <span v-for="item in 12" :key="item"></span>
          </div>
          <template v-else-if="order">
            <section class="detail-section customer-section">
              <div class="section-title-row">
                <h3>Customer</h3>
                <button class="copy-detail-btn" type="button" title="Copy customer details" aria-label="Copy customer details" @click="copyCustomerDetails">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="8" y="8" width="11" height="11" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
              <div class="rows">
                <div v-for="row in customerRows" :key="row.label" class="detail-row">
                  <span>{{ row.label }}</span>
                  <strong>{{ row.value || '—' }}</strong>
                </div>
              </div>
            </section>
            <OrderDetailSection title="Order Summary" :rows="summaryRows" />

            <section v-if="hasTrackingNumber" class="detail-section">
              <h3>Courier Tracking</h3>
              <div class="courier-card">
                <div class="courier-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 7h11v10H3z" />
                    <path d="M14 10h4l3 3v4h-7z" />
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                </div>
                <div class="courier-copy">
                  <span class="courier-label">{{ courierName || 'Courier shipment' }}</span>
                  <button
                    class="tracking-button"
                    type="button"
                    @click="openTracking"
                  >
                    {{ trackingNumber }}
                  </button>
                  <span class="courier-status">{{ props.order.status || '—' }}</span>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <h3>Products</h3>
              <div class="product-row" v-for="item in order.line_items" :key="item.shopify_line_item_id">
                <div class="product-top">
                  <strong>{{ productTitle(item) }}</strong>
                  <span>{{ formatMoney(order.currency, item.price) }}</span>
                </div>
                <div v-if="productMeta(item).length" class="product-meta">
                  <span v-for="meta in productMeta(item)" :key="meta.label">{{ meta.label }}: {{ meta.value }}</span>
                </div>
              </div>
            </section>

            <OrderDetailSection v-if="hasUtm" title="Marketing" :rows="utmRows" />
            <section v-if="internalNote" class="detail-section internal-note-section">
              <h3>Internal Note</h3>
              <p>{{ internalNote }}</p>
            </section>
            <OrderDetailSection title="Meta" :rows="metaRows" />
          </template>
        </div>
        <div v-if="order && !loading && (canCancelOrder || canDeleteOrder)" class="panel-actions">
          <button
            v-if="canCancelOrder"
            class="panel-action-btn cancel-action"
            type="button"
            @click="emit('cancel', order)"
          >
            Cancel Order
          </button>
          <button
            v-if="canDeleteOrder"
            class="panel-action-btn delete-action"
            type="button"
            @click="emit('delete', order)"
          >
            Delete Order
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import OrderDetailSection from './OrderDetailSection.vue';
import OrderStatusBadge from './OrderStatusBadge.vue';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'cancel', 'delete']);

const formatMoney = (currency, value) => `${currency || ''} ${Number(value || 0).toLocaleString()}`.trim();
const formatDateTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const customerPhone = computed(() => props.order?.customer?.phone_local || props.order?.customer?.phone_intl || '');

const customerRows = computed(() => [
  { label: 'Name', value: props.order.customer?.name },
  { label: 'Phone', value: customerPhone.value },
  { label: 'City', value: [props.order.customer?.city, props.order.customer?.country_code].filter(Boolean).join(', ') },
  { label: 'Address', value: props.order.customer?.address },
]);

const summaryRows = computed(() => [
  { label: 'Brand', value: props.order.brand_name },
  { label: 'Source', value: props.order.source },
  { label: 'Payment', value: props.order.payment_method },
  { label: 'Shipping', value: props.order.shipping_method },
  { label: 'Subtotal', value: formatMoney(props.order.currency, props.order.subtotal_price) },
  { label: 'Discount', value: formatMoney(props.order.currency, props.order.total_discounts) },
  { label: 'Tax', value: formatMoney(props.order.currency, props.order.total_tax) },
  { label: 'Total', value: formatMoney(props.order.currency, props.order.total_price) },
  { label: 'Advance', value: formatMoney(props.order.currency, props.order.advance_payment) },
  { label: 'Courier COD', value: formatMoney(props.order.currency, props.order.cod) },
  { label: 'Outstanding', value: formatMoney(props.order.currency, props.order.total_outstanding) },
]);

const hasUtm = computed(() => Object.values(props.order?.utm || {}).some(Boolean));
const internalNote = computed(() => String(props.order?.manual_order?.internal_notes || '').trim());

const trackingNumber = computed(() => props.order?.tracking_number || '');
const hasTrackingNumber = computed(() => Boolean(trackingNumber.value));
const courierName = computed(() => (
  props.order?.courier_name
  || props.order?.manual_order?.courier_name
  || props.order?.shipping_method
  || ''
));
const canManageDestructiveActions = computed(() => ['admin', 'owner'].includes(authStore.user?.team_role || 'admin'));
const statusText = computed(() => {
  const status = props.order?.status;
  if (typeof status === 'string') return status;
  if (typeof status === 'number') return String(status);
  if (status && typeof status === 'object') {
    return status.name || status.label || status.title || status.status || status.message || status.text || '';
  }
  return '';
});
const normalizedStatus = computed(() => statusText.value.toLowerCase());
const canDeleteOrder = computed(() => canManageDestructiveActions.value);
const canCancelOrder = computed(() => {
  if (!canManageDestructiveActions.value || normalizedStatus.value === 'cancel by shipper') return false;

  const hasTracking = String(props.order?.tracking_number || '').trim() !== '';
  return !hasTracking || props.order?.status_category === 'merchant_warehouse';
});

const presentValue = value => {
  const normalized = String(value ?? '').trim();
  return normalized && normalized !== '—' ? normalized : '';
};

const productTitle = (item) => {
  const quantity = Number(item.quantity || 1);
  const title = presentValue(item.title) || presentValue(item.name) || 'Product';

  return `${quantity} X ${title}`;
};

const productMeta = (item) => [
  { label: 'Vendor', value: presentValue(item.vendor) },
  { label: 'SKU', value: presentValue(item.sku) },
  { label: 'Variant', value: presentValue(item.variant_title || item.variant) },
].filter(meta => meta.value);

const openTracking = () => {
  if (!props.order?.id) return;
  authStore.prepareTabHandoff();
  window.open(router.resolve(`/orders/${props.order.id}/tracking`).href, '_blank', 'noopener');
};

const copyCustomerDetails = async () => {
  const lines = [
    props.order?.customer?.name,
    customerPhone.value,
    props.order?.customer?.address,
    [props.order?.customer?.city, props.order?.customer?.country_code].filter(Boolean).join(', '),
  ].map(value => String(value ?? '').trim()).filter(Boolean);

  if (!lines.length || !navigator.clipboard) {
    notificationStore.show('Unable to copy customer details.', { type: 'error' });
    return;
  }

  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    notificationStore.show('Customer details copied.');
  } catch (error) {
    notificationStore.show('Unable to copy customer details.', { type: 'error' });
  }
};

const utmRows = computed(() => [
  { label: 'Source', value: props.order.utm?.source },
  { label: 'Medium', value: props.order.utm?.medium },
  { label: 'Campaign', value: props.order.utm?.campaign },
  { label: 'Content', value: props.order.utm?.content },
  { label: 'Term', value: props.order.utm?.term },
]);

const metaRows = computed(() => [
  { label: 'Order #', value: props.order.order_name },
  { label: 'Confirmation', value: props.order.confirmation_number },
  { label: 'Created By', value: props.order.created_by?.name },
  { label: 'Last Saved By', value: props.order.last_saved_by?.name },
  { label: 'Label Generated By', value: props.order.label_generated_by?.name },
  { label: 'Label Generated At', value: formatDateTime(props.order.label_generated_at) },
  { label: 'Tags', value: props.order.tags },
  { label: 'Received at', value: formatDateTime(props.order.created_at) },
]);

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};
</script>

<style scoped>
.panel-root {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
}

.panel {
  position: absolute;
  right: 0;
  top: 0;
  width: min(480px, 100vw);
  height: 100vh;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
  display: flex;
  flex-direction: column;
  animation: slide-in 0.2s ease;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h2 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 18px;
  font-weight: 800;
}

.panel-header p {
  margin: 0 0 10px;
  color: #64748b;
  font-size: 13px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.panel-actions {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  padding: 14px 24px 18px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}

.panel-action-btn {
  min-height: 36px;
  border-radius: 6px;
  padding: 8px 13px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.cancel-action {
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}

.cancel-action:hover {
  border-color: #fb923c;
  background: #ffedd5;
}

.delete-action {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.delete-action:hover {
  border-color: #f87171;
  background: #fee2e2;
}

.detail-section {
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid #f1f5f9;
}

.customer-section {
  padding-top: 0;
  margin-top: 0;
  border-top: none;
}

.detail-section h3 {
  margin: 0 0 12px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 800;
}

.internal-note-section p {
  margin: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  padding: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title-row h3 {
  margin: 0;
}

.copy-detail-btn {
  flex: 0 0 auto;
  width: 31px;
  height: 31px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbe3ee;
  border-radius: 7px;
  background: #fff;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.copy-detail-btn:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.copy-detail-btn svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.rows {
  display: grid;
  gap: 9px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  color: #64748b;
  font-size: 14px;
}

.detail-row strong {
  color: #1e293b;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}

.product-row {
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.product-row:last-child {
  border-bottom: none;
}

.product-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.product-top strong {
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
}

.product-top span {
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.product-row p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 8px;
  color: #64748b;
  font-size: 12.5px;
  line-height: 1.35;
}

.product-meta span {
  display: inline-flex;
  align-items: center;
}

.detail-skeleton {
  display: grid;
  gap: 14px;
}

.detail-skeleton span {
  height: 20px;
  border-radius: 6px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

.tracking-button {
  border: none;
  background: transparent;
  color: #1d4ed8;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
  text-align: left;
  word-break: break-all;
}

.tracking-button:hover {
  color: #2563eb;
  text-decoration: underline;
}

.tracking-button:disabled {
  color: #94a3b8;
  cursor: default;
}

.courier-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fbff;
  padding: 13px;
}

.courier-icon {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
}

.courier-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.courier-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.courier-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.courier-status {
  width: fit-content;
  max-width: 100%;
  border-radius: 999px;
  background: #e0f2fe;
  color: #075985;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}

.error-text,
.helper-text {
  margin-top: 12px;
  color: #f43f5e;
  font-size: 13px;
}

.helper-text {
  color: #64748b;
}

.tracking-history {
  margin-top: 14px;
}

.tracking-history h4 {
  margin: 0 0 10px;
  font-size: 13px;
  color: #1e293b;
  font-weight: 700;
}

.tracking-history ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tracking-history li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #f1f5f9;
}

.history-message {
  color: #334155;
  font-size: 14px;
}

.history-code {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
</style>
