<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast.message" :class="['toast', toast.type]">{{ toast.message }}</div>
    </transition>

    <main class="advice-page">
      <section class="advice-panel">
        <header class="advice-header">
          <div>
            <p class="eyebrow">Shipper Advice</p>
            <h1>Courier Advice Orders ({{ totalCount }})</h1>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" type="button" :disabled="loadingOrders" @click="fetchOrders">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M16 8h5V3" />
              </svg>
              Reload
            </button>
          </div>
        </header>

        <div class="courier-strip">
          <button
            v-for="integration in supportedIntegrations"
            :key="integration.id"
            type="button"
            :class="['courier-chip', { active: integration.id === selectedIntegrationId, disabled: !integration.supports_shipper_advice }]"
            :disabled="!integration.supports_shipper_advice || loadingOrders"
            @click="selectIntegration(integration)"
          >
            <span class="courier-mark">{{ integrationInitials(integration) }}</span>
            <span class="courier-copy">
              <strong>{{ integration.name }}</strong>
              <small>{{ integration.courier_name }}{{ integration.supports_shipper_advice ? '' : ' · Unavailable' }}</small>
            </span>
          </button>
        </div>

        <div v-if="loadingIntegrations" class="empty-state">Loading courier integrations...</div>
        <div v-else-if="integrations.length === 0" class="empty-state">No courier integrations found.</div>
        <div v-else-if="supportedIntegrations.length === 0" class="empty-state">No connected courier supports shipper advice yet.</div>

        <div v-else class="table-wrap">
          <table class="advice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Order</th>
                <th>Consignee</th>
                <th>Courier</th>
                <th>Tracking ID</th>
                <th>Status</th>
                <th>COD</th>
                <th>Latest Remark</th>
                <th>Updated At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loadingOrders">
                <tr v-for="row in 7" :key="row">
                  <td v-for="col in 10" :key="col"><span class="skeleton"></span></td>
                </tr>
              </template>
              <tr v-else-if="orders.length === 0">
                <td colspan="10" class="empty-cell">No shipper advice orders found for this courier.</td>
              </tr>
              <tr v-else v-for="(order, index) in orders" :key="`${order.courier_integration_id}-${order.tracking_number}`">
                <td class="serial-cell">{{ serialStart + index }}</td>
                <td>
                  <div class="strong-cell">{{ order.local_order_name || order.local_order_number || remoteOrderLabel(order) }}</div>
                  <div v-if="order.brand_name" class="subtext">{{ order.brand_name }}</div>
                  <div v-else-if="order.shipper_name" class="subtext">{{ order.shipper_name }}</div>
                </td>
                <td>
                  <div>{{ order.consignee_name || '-' }}</div>
                  <div v-if="order.consignee_phone" class="subtext">{{ formatPhone(order.consignee_phone) }}</div>
                  <div v-if="order.destination_city" class="subtext">{{ order.destination_city }}</div>
                </td>
                <td>{{ order.courier_name || '-' }}</td>
                <td>
                  <a
                    v-if="order.local_order_id"
                    class="tracking-link"
                    :href="`/orders/${order.local_order_id}/tracking`"
                    target="_blank"
                    rel="noopener"
                    @click="authStore.prepareTabHandoff"
                  >
                    {{ order.tracking_number }}
                  </a>
                  <span v-else>{{ order.tracking_number || '-' }}</span>
                </td>
                <td><span class="status-pill">{{ statusText(order.status) }}</span></td>
                <td>{{ formatMoney(order.cod_amount) }}</td>
                <td>
                  <div class="remark-cell">{{ order.shipper_remarks || '-' }}</div>
                  <div v-if="order.notes" class="subtext">{{ order.notes }}</div>
                </td>
                <td>{{ formatDateTime(order.latest_history_at || order.updated_at) }}</td>
                <td>
                  <button
                    class="action-btn"
                    type="button"
                    :disabled="updatingTracking === order.tracking_number"
                    @click="openAdviceModal(order)"
                  >
                    {{ updatingTracking === order.tracking_number ? 'Saving...' : 'Respond' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="pagination && pagination.total_pages > 1" class="pager">
          <button type="button" :disabled="!pagination.has_prev || loadingOrders" @click="changePage(pagination.current_page - 1)">
            Previous
          </button>
          <span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span>
          <button type="button" :disabled="!pagination.has_next || loadingOrders" @click="changePage(pagination.current_page + 1)">
            Next
          </button>
        </footer>
      </section>
    </main>

    <Teleport to="body">
      <transition name="dialog-fade">
        <div v-if="modal.open" class="dialog-backdrop" @click.self="closeAdviceModal">
          <section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="shipper-advice-title">
            <p class="dialog-eyebrow">{{ modal.order?.tracking_number }}</p>
            <h2 id="shipper-advice-title">Update Shipper Advice</h2>
            <div class="modal-order">
              <strong>{{ modal.order?.consignee_name || modal.order?.local_order_name || 'Selected order' }}</strong>
              <span>{{ modal.order?.destination_city || modal.order?.courier_name || '' }}</span>
            </div>

            <div class="status-options" role="radiogroup" aria-label="Advice status">
              <button
                v-for="option in activeStatusOptions"
                :key="option.value"
                type="button"
                :class="{ active: modal.status === option.value }"
                @click="modal.status = option.value"
              >
                {{ option.label }}
              </button>
            </div>

            <label class="remarks-field">
              <span>Remarks</span>
              <textarea
                v-model="modal.remarks"
                rows="4"
                maxlength="1000"
                placeholder="Add shipper remarks"
              ></textarea>
            </label>

            <p v-if="modal.error" class="modal-error">{{ modal.error }}</p>

            <div class="dialog-actions">
              <button class="btn-cancel" type="button" :disabled="modal.loading" @click="closeAdviceModal">Cancel</button>
              <button class="btn-save" type="button" :disabled="modal.loading" @click="submitAdvice">
                <span v-if="modal.loading" class="button-spinner"></span>
                <span v-else>Save Response</span>
              </button>
            </div>
          </section>
        </div>
      </transition>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import ShipperAdviceService from '../services/ShipperAdviceService';
import { useAuthStore } from '../stores/authStore';
import { formatPhone } from '../utils/phoneNormalizer';

const authStore = useAuthStore();
const integrations = ref([]);
const orders = ref([]);
const pagination = ref(null);
const selectedIntegrationId = ref('');
const loadingIntegrations = ref(false);
const loadingOrders = ref(false);
const updatingTracking = ref('');
const page = ref(1);
const perPage = ref(100);
const statusOptions = ref([
  { value: 'hold', label: 'Hold' },
  { value: 're_attempt', label: 'Re-attempt' },
  { value: 'ready_for_return', label: 'Ready for return' },
]);
const toast = reactive({ message: '', type: 'success' });
const modal = reactive({
  open: false,
  order: null,
  status: 're_attempt',
  remarks: '',
  error: '',
  loading: false,
});
let toastTimer = null;

const supportedIntegrations = computed(() => integrations.value.filter(item => item.supports_shipper_advice));
const selectedIntegration = computed(() => integrations.value.find(item => item.id === selectedIntegrationId.value) || null);
const activeStatusOptions = computed(() => {
  if (modal.order?.supported_statuses?.length) return modal.order.supported_statuses;
  if (selectedIntegration.value?.supported_statuses?.length) return selectedIntegration.value.supported_statuses;
  return statusOptions.value;
});
const totalCount = computed(() => pagination.value?.total ?? orders.value.length);
const serialStart = computed(() => {
  if (!pagination.value) return 1;
  return ((pagination.value.current_page - 1) * pagination.value.per_page) + 1;
});

const fetchIntegrations = async () => {
  loadingIntegrations.value = true;
  try {
    const res = await ShipperAdviceService.getIntegrations();
    const data = res.data.data || {};
    integrations.value = data.integrations || [];
    statusOptions.value = data.supported_statuses?.length ? data.supported_statuses : statusOptions.value;

    if (!selectedIntegrationId.value || !supportedIntegrations.value.some(item => item.id === selectedIntegrationId.value)) {
      const defaultIntegration = supportedIntegrations.value.find(item => item.courier_slug === 'postex') || supportedIntegrations.value[0];
      selectedIntegrationId.value = defaultIntegration?.id || '';
    }
  } finally {
    loadingIntegrations.value = false;
  }
};

const fetchOrders = async () => {
  if (!selectedIntegrationId.value) {
    orders.value = [];
    pagination.value = null;
    return;
  }

  loadingOrders.value = true;
  try {
    const res = await ShipperAdviceService.getOrders({
      courier_integration_id: selectedIntegrationId.value,
      page: page.value,
      per_page: perPage.value,
    });
    const data = res.data.data || {};
    orders.value = data.orders || [];
    pagination.value = data.pagination || null;
    statusOptions.value = data.supported_statuses?.length ? data.supported_statuses : statusOptions.value;
  } catch (error) {
    showToast(error.response?.data?.message || 'Unable to fetch shipper advice orders.', 'error');
    orders.value = [];
    pagination.value = null;
  } finally {
    loadingOrders.value = false;
  }
};

const selectIntegration = async (integration) => {
  if (!integration.supports_shipper_advice || integration.id === selectedIntegrationId.value) return;

  selectedIntegrationId.value = integration.id;
  page.value = 1;
  await fetchOrders();
};

const changePage = async (nextPage) => {
  page.value = nextPage;
  await fetchOrders();
};

const openAdviceModal = (order) => {
  const options = order.supported_statuses?.length
    ? order.supported_statuses
    : (selectedIntegration.value?.supported_statuses?.length ? selectedIntegration.value.supported_statuses : statusOptions.value);

  modal.open = true;
  modal.order = order;
  modal.status = options[0]?.value || 're_attempt';
  modal.remarks = '';
  modal.error = '';
};

const closeAdviceModal = () => {
  if (modal.loading) return;

  modal.open = false;
  modal.order = null;
  modal.error = '';
};

const submitAdvice = async () => {
  if (!modal.order) return;

  const remarks = modal.remarks.trim();
  if (!remarks) {
    modal.error = 'Remarks are required.';
    return;
  }

  modal.loading = true;
  modal.error = '';
  updatingTracking.value = modal.order.tracking_number;

  try {
    await ShipperAdviceService.updateAdvice({
      courier_integration_id: modal.order.courier_integration_id || selectedIntegrationId.value,
      tracking_number: modal.order.tracking_number,
      status: modal.status,
      shipper_remarks: remarks,
    });

    showToast('Shipper advice response saved.');
    modal.open = false;
    modal.order = null;
    await fetchOrders();
  } catch (error) {
    modal.error = error.response?.data?.message || 'Unable to save shipper advice response.';
    showToast(modal.error, 'error');
  } finally {
    modal.loading = false;
    updatingTracking.value = '';
  }
};

const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.message = '';
  }, 3200);
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const statusText = (value) => String(value || '-').replace(/_/g, ' ');

const remoteOrderLabel = (order) => {
  if (order.courier_slug === 'dastaq') {
    return `Dastaq #${order.dastaq_order_id || order.id}`;
  }

  return order.tracking_number || '-';
};

const integrationInitials = (integration) => {
  const label = integration.name || integration.courier_name || 'C';
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('') || 'C';
};

onMounted(async () => {
  await fetchIntegrations();
  await fetchOrders();
});
</script>

<style scoped>
.advice-page {
  min-height: 100vh;
  padding: 30px;
  background: #f1f5f9;
}

.advice-panel {
  display: grid;
  gap: 18px;
}

.advice-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.advice-header h1 {
  margin: 0;
  color: #111827;
  font-size: 25px;
  font-weight: 900;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.secondary-btn,
.action-btn,
.btn-cancel,
.btn-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-weight: 850;
  cursor: pointer;
}

.secondary-btn {
  height: 38px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  padding: 0 14px;
  font-size: 13px;
}

.secondary-btn:disabled,
.action-btn:disabled,
.btn-cancel:disabled,
.btn-save:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.courier-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.courier-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 210px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.courier-chip.active {
  border-color: #2563eb;
  box-shadow: inset 0 0 0 1px #2563eb;
}

.courier-chip.disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.courier-mark {
  display: inline-grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  background: #e0f2fe;
  color: #075985;
  font-size: 12px;
  font-weight: 900;
}

.courier-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.courier-copy strong,
.courier-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.courier-copy strong {
  color: #111827;
  font-size: 13px;
  font-weight: 900;
}

.courier-copy small {
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
}

.table-wrap,
.empty-state {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.empty-state {
  padding: 30px;
  color: #64748b;
  font-size: 14px;
  font-weight: 750;
  text-align: center;
}

.table-wrap {
  overflow-x: auto;
}

.advice-table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
}

.advice-table th {
  padding: 13px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: left;
}

.advice-table td {
  padding: 13px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  vertical-align: top;
}

.advice-table tr:last-child td {
  border-bottom: 0;
}

.serial-cell,
.subtext {
  color: #64748b;
  font-size: 12px;
}

.strong-cell {
  color: #111827;
  font-weight: 900;
}

.tracking-link {
  color: #2563eb;
  font-weight: 850;
  text-decoration: none;
}

.status-pill {
  display: inline-flex;
  max-width: 180px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 850;
  text-transform: capitalize;
  white-space: normal;
}

.remark-cell {
  max-width: 230px;
  color: #334155;
  line-height: 1.45;
}

.action-btn {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 7px 12px;
  font-size: 12px;
  white-space: nowrap;
}

.empty-cell {
  padding: 30px;
  color: #64748b;
  text-align: center;
}

.skeleton {
  display: block;
  width: 100%;
  height: 16px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: pulse 1.2s infinite;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.pager button {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  padding: 8px 12px;
  font-weight: 850;
  cursor: pointer;
}

.pager button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 1100;
  max-width: min(420px, calc(100vw - 36px));
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.22);
}

.toast.error {
  background: #b91c1c;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.58);
}

.dialog-card {
  width: min(470px, 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
  padding: 22px;
}

.dialog-eyebrow {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.dialog-card h2 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 900;
}

.modal-order {
  display: grid;
  gap: 4px;
  margin-top: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 11px 12px;
}

.modal-order strong {
  color: #111827;
  font-size: 14px;
  font-weight: 900;
}

.modal-order span {
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
}

.status-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.status-options button {
  min-height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  padding: 8px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.status-options button.active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.remarks-field {
  display: grid;
  gap: 7px;
  margin-top: 16px;
}

.remarks-field span {
  color: #374151;
  font-size: 13px;
  font-weight: 850;
}

.remarks-field textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #111827;
  font: inherit;
  padding: 10px 12px;
}

.remarks-field textarea:focus {
  border-color: #2563eb;
  outline: none;
}

.modal-error {
  margin: 10px 0 0;
  color: #dc2626;
  font-size: 13px;
  font-weight: 800;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn-cancel,
.btn-save {
  min-width: 108px;
  border: 1px solid transparent;
  padding: 10px 14px;
  font-size: 13px;
}

.btn-cancel {
  border-color: #cbd5e1;
  background: #fff;
  color: #334155;
}

.btn-save {
  background: #1d4ed8;
  color: #fff;
}

.button-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.42);
  border-top-color: #fff;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.toast-fade-enter-active,
.toast-fade-leave-active,
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to,
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

@keyframes pulse {
  to {
    background-position: -200% 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .advice-page {
    padding: 18px;
  }

  .advice-header {
    display: grid;
  }

  .header-actions {
    justify-content: stretch;
  }

  .secondary-btn {
    width: 100%;
  }

  .courier-chip {
    min-width: 185px;
  }

  .status-options {
    grid-template-columns: 1fr;
  }
}
</style>
