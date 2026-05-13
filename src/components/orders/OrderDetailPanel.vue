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
            <OrderDetailSection title="Customer" :rows="customerRows" />
            <OrderDetailSection title="Order Summary" :rows="summaryRows" />

            <section v-if="hasTrackingNumber" class="detail-section">
              <h3>Courier Tracking</h3>
              <div class="rows">
                <div class="detail-row">
                  <span>Tracking</span>
                  <strong>
                    <button
                      class="tracking-button"
                      type="button"
                      @click="router.push(`/orders/${props.order.id}/tracking`)"
                    >
                      {{ trackingNumber }}
                    </button>
                  </strong>
                </div>
                <div class="detail-row">
                  <span>Courier status</span>
                  <strong>{{ props.order.status || '—' }}</strong>
                </div>
              </div>
            </section>

            <section class="detail-section">
              <h3>Products</h3>
              <div class="product-row" v-for="item in order.line_items" :key="item.shopify_line_item_id">
                <div class="product-top">
                  <strong>{{ item.title || item.name }}</strong>
                  <span>{{ formatMoney(order.currency, item.price) }}</span>
                </div>
                <p>Qty: {{ item.quantity }} · Vendor: {{ item.vendor || '—' }}</p>
                <p>SKU: {{ item.sku || '—' }} · Variant: {{ item.variant_title || '—' }}</p>
              </div>
            </section>

            <OrderDetailSection v-if="hasUtm" title="Marketing" :rows="utmRows" />
            <OrderDetailSection title="Meta" :rows="metaRows" />
          </template>
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

const router = useRouter();

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

defineEmits(['close']);

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

const customerRows = computed(() => [
  { label: 'Name', value: props.order.customer?.name },
  { label: 'Phone', value: props.order.customer?.phone_local || props.order.customer?.phone_intl },
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
  { label: 'Outstanding', value: formatMoney(props.order.currency, props.order.total_outstanding) },
]);

const hasUtm = computed(() => Object.values(props.order?.utm || {}).some(Boolean));

const trackingNumber = computed(() => props.order?.tracking_number || '');
const hasTrackingNumber = computed(() => Boolean(trackingNumber.value));

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

.detail-section {
  padding-top: 18px;
  margin-top: 18px;
  border-top: 1px solid #f1f5f9;
}

.detail-section h3 {
  margin: 0 0 12px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 800;
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
  justify-content: space-between;
  gap: 16px;
}

.product-top strong {
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
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
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.tracking-button:disabled {
  color: #94a3b8;
  cursor: default;
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
