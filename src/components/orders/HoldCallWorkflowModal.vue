<template>
  <Teleport to="body">
    <div v-if="open" class="modal-root">
      <div class="overlay" @click="$emit('close')"></div>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="hold-call-title">
        <header class="modal-header">
          <div>
            <span class="eyebrow">Hold calling</span>
            <h2 id="hold-call-title">{{ order?.order_name || 'Order' }}</h2>
            <p>{{ headerSourceLabel }}</p>
          </div>
          <button class="icon-btn" type="button" aria-label="Close" @click="$emit('close')">×</button>
        </header>

        <div v-if="!order" class="modal-body empty-state">
          Select a hold order to start calling.
        </div>

        <template v-else>
          <div class="modal-body">
            <div class="workflow-grid">
              <div class="workflow-column">
                <section class="detail-block customer-card">
                  <div class="customer-grid">
                    <div>
                      <span>Name</span>
                      <strong>{{ customerName || '—' }}</strong>
                    </div>
                    <div>
                      <span>Price</span>
                      <strong>{{ formatMoney(order.currency, order.total_price) }}</strong>
                    </div>
                    <div>
                      <span>Number</span>
                      <strong>
                        <a v-if="orderPhone" :href="`tel:${orderPhone}`">{{ orderPhone }}</a>
                        <template v-else>—</template>
                      </strong>
                    </div>
                    <div>
                      <span>City</span>
                      <strong>{{ order.customer?.city || '—' }}</strong>
                    </div>
                  </div>
                  <div class="address-row">
                    <div>
                      <span>Address</span>
                      <p>{{ addressText || '—' }}</p>
                    </div>
                    <button class="small-btn" type="button" :disabled="!addressText" @click="copyAddress">Copy</button>
                  </div>
                </section>

                <section class="detail-block ai-block">
                  <div class="section-title-row">
                    <h3>AI Suggested Address</h3>
                    <div class="section-actions">
                      <button class="small-btn" type="button" :disabled="aiLoading" @click="$emit('create-ai-suggestion')">
                        {{ aiAddressText ? 'Regenerate' : 'Create' }}
                      </button>
                      <button v-if="aiAddressText" class="small-btn" type="button" @click="copyAiAddress">Copy</button>
                    </div>
                  </div>
                  <p v-if="aiAddressText">{{ aiAddressText }}</p>
                  <p v-else>{{ aiLoading ? 'Creating suggestion...' : 'No AI suggestion yet.' }}</p>
                </section>

                <section class="detail-block products-block">
                  <h3>Products</h3>
                  <div v-if="productItems.length" class="product-list">
                    <div v-for="(item, index) in productItems" :key="item.product_id || item.shopify_line_item_id || index" class="product-item">
                      <div>
                        <strong>{{ productTitle(item) }}</strong>
                        <span v-if="productMeta(item)">{{ productMeta(item) }}</span>
                      </div>
                      <b>{{ formatMoney(order.currency, productLineTotal(item)) }}</b>
                    </div>
                  </div>
                  <p v-else>—</p>
                </section>

                <section v-if="internalNote" class="detail-block">
                  <h3>Internal Note</h3>
                  <p>{{ internalNote }}</p>
                </section>
              </div>

              <div class="workflow-column">
                <section class="detail-block logs-block">
                  <h3>Call Logs</h3>
                  <div v-if="holdLogs.length" class="logs-list">
                    <article v-for="log in holdLogs" :key="log.id || `${log.action}-${log.created_at}`" class="log-item">
                      <strong>{{ log.label }}</strong>
                      <span>by {{ log.user_name || 'Unknown User' }} · {{ formatDateTime(log.created_at) }}</span>
                      <p v-if="log.note">{{ log.note }}</p>
                    </article>
                  </div>
                  <p v-else>No call log yet.</p>
                </section>

                <section class="quick-actions" aria-label="Hold call quick actions">
                  <button
                    v-for="action in quickActions"
                    :key="action.value"
                    type="button"
                    :disabled="saving"
                    @click="$emit('save-log', { action: action.value, note: '' })"
                  >
                    {{ action.label }}
                  </button>
                </section>

                <section class="note-box">
                  <label for="hold-call-note">Custom note</label>
                  <textarea
                    id="hold-call-note"
                    v-model="noteText"
                    rows="2"
                    placeholder="Add call detail, promise time, address clue, or customer response"
                  ></textarea>
                  <div class="note-actions">
                    <button class="secondary-btn" type="button" :disabled="saving || !noteText.trim()" @click="$emit('save-log', { action: 'custom_note', note: noteText })">
                      Save Note
                    </button>
                    <button class="secondary-btn" type="button" :disabled="saving || !noteText.trim()" @click="$emit('save-log-next', { action: 'custom_note', note: noteText })">
                      Save & Next
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <footer class="modal-footer">
            <div class="modal-nav-actions">
              <button class="secondary-btn" type="button" :disabled="saving" @click="$emit('previous')">
                Previous
              </button>
              <button class="secondary-btn" type="button" :disabled="saving" @click="$emit('next')">
                Next
              </button>
            </div>
            <div class="modal-primary-actions">
              <button class="secondary-btn" type="button" :disabled="saving" @click="$emit('close')">
                Close
              </button>
              <button class="primary-btn" type="button" :disabled="saving" @click="$emit('open-edit')">
                Open Order
              </button>
            </div>
          </footer>
        </template>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useNotificationStore } from '../../stores/notificationStore';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  aiLoading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close', 'save-log', 'save-log-next', 'previous', 'next', 'open-edit', 'create-ai-suggestion']);

const notificationStore = useNotificationStore();
const noteText = ref('');
const quickActions = [
  { value: 'call_na', label: 'Call Not Answered' },
  { value: 'number_off', label: 'Number Switched Off' },
  { value: 'fake', label: 'Fake Order' },
  { value: 'mind_change_price_issue', label: 'Price Issue' },
  { value: 'cancel_mind_change', label: 'Customer Changed Mind' },
  { value: 'non_serious', label: 'Non-Serious Customer' },
];

watch(() => props.order?.id, () => {
  noteText.value = '';
});

const customerName = computed(() => props.order?.customer?.name || '—');
const orderPhone = computed(() => props.order?.customer?.phone_local || props.order?.customer?.phone_intl || '');
const addressText = computed(() => props.order?.customer?.address || '');
const internalNote = computed(() => String(props.order?.manual_order?.internal_notes || props.order?.internal_notes || '').trim());
const aiAddressText = computed(() => {
  const correction = props.order?.ai_address_correction || {};
  return correction.final_address || correction.correctedAddress || '';
});
const lastLog = computed(() => props.order?.hold_call_logs?.[0] || props.order?.last_hold_call_log || null);
const holdLogs = computed(() => {
  const logs = Array.isArray(props.order?.hold_call_logs) ? props.order.hold_call_logs : [];
  return logs.length ? logs : (lastLog.value ? [lastLog.value] : []);
});
const productItems = computed(() => Array.isArray(props.order?.line_items) ? props.order.line_items : []);
const headerSourceLabel = computed(() => (
  [props.order?.brand_name, props.order?.source].filter(Boolean).join(' - ') || 'No brand'
));

const formatMoney = (currency, value) => `${currency || ''} ${Number(value || 0).toLocaleString()}`.trim();
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
  presentValue(item.sku) ? `SKU: ${presentValue(item.sku)}` : '',
  presentValue(item.variant_title || item.variant) ? `Variant: ${presentValue(item.variant_title || item.variant)}` : '',
].filter(Boolean).join(' · ');
const productLineTotal = (item) => {
  const price = Number(item.price ?? item.unit_price ?? 0);
  const quantity = Number(item.quantity || 1);
  return Number(item.total_price ?? item.line_total ?? (price * quantity));
};
const formatDateTime = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const copyAddress = async () => {
  if (!addressText.value || !navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(addressText.value);
    notificationStore.show('Address copied.');
  } catch (error) {
    notificationStore.show('Unable to copy address.', { type: 'error' });
  }
};

const copyAiAddress = async () => {
  if (!aiAddressText.value || !navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(aiAddressText.value);
    notificationStore.show('AI suggested address copied.');
  } catch (error) {
    notificationStore.show('Unable to copy AI suggested address.', { type: 'error' });
  }
};
</script>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 80;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
}

.modal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(920px, calc(100vw - 36px));
  max-height: calc(100vh - 36px);
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.3);
}

.modal-header,
.modal-footer {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-footer {
  border-top: 1px solid #e2e8f0;
  border-bottom: none;
  justify-content: space-between;
}

.modal-nav-actions,
.modal-primary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.eyebrow {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  margin-top: 2px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
}

.modal-header p {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.modal-body {
  flex: 0 1 auto;
  overflow: visible;
  padding: 16px 20px;
}

.empty-state {
  color: #64748b;
  font-weight: 700;
}

.detail-block,
.note-box {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px 11px;
}

.customer-grid span,
.address-row span,
.note-box label {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.customer-grid strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 850;
  overflow-wrap: anywhere;
}

.customer-grid a {
  color: #2563eb;
  text-decoration: none;
}

.customer-card {
  display: grid;
  gap: 10px;
}

.customer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
}

.address-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.workflow-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.82fr);
  gap: 10px;
  margin-top: 10px;
}

.workflow-column {
  display: grid;
  align-content: start;
  gap: 10px;
}

.quick-actions {
  margin-top: 0;
}

.detail-block h3 {
  margin-bottom: 7px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
}

.detail-block p {
  color: #334155;
  font-size: 13.5px;
  line-height: 1.42;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.product-list {
  display: grid;
  gap: 7px;
}

.product-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-top: 7px;
  border-top: 1px solid #e2e8f0;
}

.product-item:first-child {
  padding-top: 0;
  border-top: none;
}

.product-item strong {
  display: block;
  color: #0f172a;
  font-size: 13.5px;
  font-weight: 850;
  line-height: 1.25;
}

.product-item span {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.product-item b {
  flex: 0 0 auto;
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

.logs-block {
  max-height: 190px;
  overflow-y: auto;
}

.logs-list {
  display: grid;
  gap: 8px;
}

.log-item {
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
}

.log-item:first-child {
  border-top: none;
  padding-top: 0;
}

.log-item strong {
  display: block;
  color: #0f172a;
  font-size: 13px;
  font-weight: 850;
}

.log-item span {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.log-item p {
  margin-top: 5px;
  font-size: 12.5px;
  line-height: 1.35;
}

.detail-block p span,
.detail-block p em {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-style: normal;
}

.ai-block {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.section-title-row,
.note-actions,
.quick-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  flex-wrap: wrap;
  justify-content: stretch;
}

.quick-actions button,
.secondary-btn,
.primary-btn,
.small-btn {
  min-height: 34px;
  border: 1px solid #dbe3ee;
  border-radius: 7px;
  background: #fff;
  color: #1e293b;
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
}

.quick-actions button {
  color: #1d4ed8;
  justify-content: center;
  min-width: 0;
  white-space: normal;
  line-height: 1.2;
}

.primary-btn {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

textarea {
  width: 100%;
  min-height: 66px;
  margin-top: 7px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  resize: vertical;
  padding: 10px;
  color: #0f172a;
  font: inherit;
  font-size: 13.5px;
  line-height: 1.5;
}

.note-actions {
  justify-content: flex-end;
  margin-top: 8px;
}

@media (max-width: 760px) {
  .modal {
    top: 12px;
    width: calc(100vw - 20px);
    max-height: calc(100vh - 24px);
    transform: translateX(-50%);
  }

  .modal-body {
    overflow-y: auto;
  }

  .workflow-grid {
    grid-template-columns: 1fr;
  }

  .customer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
