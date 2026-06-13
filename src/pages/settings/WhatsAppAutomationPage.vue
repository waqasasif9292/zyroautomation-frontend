<template>
  <AppLayout>
    <div class="settings-wrapper">
      <div class="settings-body">
        <SettingsSubNav />

        <main class="settings-content">
          <section class="content-panel">
            <header class="panel-header">
              <div>
                <p class="eyebrow">Automation</p>
                <h1>WhatsApp Automation</h1>
              </div>
              <div :class="['connection-pill', { connected: connection.connected }]">
                {{ connection.connected ? 'Connected' : statusLabel }}
              </div>
            </header>

            <div class="panel-body">
              <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
              <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

              <nav class="section-tabs" aria-label="WhatsApp settings sections">
                <button
                  v-for="tab in tabs"
                  :key="tab.key"
                  type="button"
                  :class="['section-tab', { active: activeTab === tab.key }]"
                  @click="activeTab = tab.key"
                >
                  <span>{{ tab.label }}</span>
                  <small>{{ tab.helper }}</small>
                </button>
              </nav>

              <section v-if="activeTab === 'integration'" class="tab-surface">
                <div class="integration-status">
                  <div>
                    <p class="section-kicker">Connection</p>
                    <h2>Linked device QR</h2>
                  </div>
                  <div :class="['status-dot-label', { connected: connection.connected }]">
                    <span></span>
                    {{ connection.connected ? 'Ready to send' : statusLabel }}
                  </div>
                </div>

                <div class="connection-grid">
                  <div class="qr-panel">
                    <div v-if="loading" class="qr-placeholder">Loading...</div>
                    <img v-else-if="connection.qr && !connection.connected" class="qr-code" :src="connection.qr" alt="WhatsApp login QR code">
                    <div v-else-if="connection.connected" class="connected-state">
                      <div class="check-icon">✓</div>
                      <strong>WhatsApp is connected</strong>
                      <span v-if="connection.phone">Logged in as +{{ connection.phone }}</span>
                    </div>
                    <div v-else class="qr-placeholder">{{ statusLabel }}</div>
                  </div>

                  <div class="connection-copy">
                    <div class="connection-details">
                      <div>
                        <span class="detail-label">WhatsApp status</span>
                        <strong>{{ connection.connected ? 'Connected' : statusLabel }}</strong>
                      </div>
                      <div>
                        <span class="detail-label">Linked number</span>
                        <strong>{{ connection.phone ? `+${connection.phone}` : 'Not linked' }}</strong>
                      </div>
                    </div>
                    <div class="button-row">
                      <button class="btn-save" type="button" @click="refreshStatus" :disabled="refreshing">
                        {{ refreshing ? 'Refreshing...' : (connection.connected ? 'Refresh status' : 'Refresh QR') }}
                      </button>
                      <button v-if="connection.connected" class="btn-cancel" type="button" @click="disconnect" :disabled="disconnecting">
                        {{ disconnecting ? 'Disconnecting...' : 'Disconnect' }}
                      </button>
                    </div>
                    <p v-if="connection.last_error" class="bridge-error">{{ userFriendlyConnectionError }}</p>
                  </div>
                </div>
              </section>

              <section v-else class="tab-surface">
                <form v-if="activeTab === 'confirmation'" class="automation-form" @submit.prevent="saveSettings">
                  <div class="automation-header">
                    <div>
                      <p class="section-kicker">Automation rule</p>
                      <h2>Order confirmation</h2>
                    </div>
                    <label class="switch-row">
                      <input type="checkbox" v-model="form.enabled">
                      <span class="switch-control"></span>
                      <strong>{{ form.enabled ? 'Enabled' : 'Disabled' }}</strong>
                    </label>
                  </div>

                  <div :class="['source-options', { disabled: !form.enabled }]">
                    <label class="source-option">
                      <input type="checkbox" v-model="form.send_on_shopify_orders" :disabled="!form.enabled">
                      <span>
                        <strong>Shopify webhook orders</strong>
                        <small>Send confirmations for orders received from Shopify.</small>
                      </span>
                    </label>
                    <label class="source-option">
                      <input type="checkbox" v-model="form.send_on_manual_orders" :disabled="!form.enabled">
                      <span>
                        <strong>Manual orders</strong>
                        <small>Send confirmations for orders created inside Zyro.</small>
                      </span>
                    </label>
                  </div>
                  <p v-if="sourceSelectionRequired" class="field-warning">
                    Select at least one order source before saving.
                  </p>

                  <div class="form-group">
                    <label class="form-label">Confirmation message</label>
                    <div class="variable-reference" aria-label="Available message variables">
                      <button
                        v-for="variable in variables"
                        :key="variable.token"
                        class="variable-chip"
                        type="button"
                        :title="variable.description"
                        @click="insertVariable(variable.token)"
                      >
                        <strong>{{ variable.token }}</strong>
                        <span>{{ variable.label }}</span>
                      </button>
                    </div>
                    <textarea class="form-textarea" v-model="form.message_template" rows="8"></textarea>
                  </div>

                  <div class="panel-actions">
                    <button class="btn-cancel" type="button" @click="resetTemplate">Reset template</button>
                    <button class="btn-save" type="submit" :disabled="saving || sourceSelectionRequired">{{ saving ? 'Saving...' : 'Save settings' }}</button>
                  </div>
                </form>

                <section v-if="activeTab === 'confirmation'" class="test-panel">
                  <div>
                    <p class="section-kicker">Preview</p>
                    <h2>Send a test</h2>
                  </div>
                  <div class="test-row">
                    <input class="form-input" v-model="testPhone" placeholder="03xxxxxxxxx">
                    <button class="btn-save" type="button" @click="sendTest" :disabled="testing || !connection.connected">
                      {{ testing ? 'Sending...' : 'Send test' }}
                    </button>
                  </div>
                </section>

                <form v-if="activeTab === 'address'" class="automation-form" @submit.prevent="saveSettings">
                  <div class="automation-header">
                    <div>
                      <p class="section-kicker">Automation rule</p>
                      <h2>Address confirmation</h2>
                    </div>
                    <label class="switch-row">
                      <input type="checkbox" v-model="form.address_confirmation.enabled">
                      <span class="switch-control"></span>
                      <strong>{{ form.address_confirmation.enabled ? 'Enabled' : 'Disabled' }}</strong>
                    </label>
                  </div>

                  <div :class="['source-options', { disabled: !form.address_confirmation.enabled }]">
                    <label class="source-option">
                      <input type="checkbox" v-model="form.address_confirmation.show_in_order_form" :disabled="!form.address_confirmation.enabled">
                      <span>
                        <strong>Show in order form</strong>
                        <small>Display a send action while viewing or editing an existing order.</small>
                      </span>
                    </label>
                    <label class="source-option">
                      <input type="checkbox" v-model="form.address_confirmation.show_in_order_list" :disabled="!form.address_confirmation.enabled">
                      <span>
                        <strong>Show action in order list</strong>
                        <small>Add an address confirmation action in the orders table.</small>
                      </span>
                    </label>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Address confirmation message</label>
                    <div class="variable-reference" aria-label="Available message variables">
                      <button
                        v-for="variable in addressVariables"
                        :key="variable.token"
                        class="variable-chip"
                        type="button"
                        :title="variable.description"
                        @click="insertAddressVariable(variable.token)"
                      >
                        <strong>{{ variable.token }}</strong>
                        <span>{{ variable.label }}</span>
                      </button>
                    </div>
                    <textarea class="form-textarea" v-model="form.address_confirmation.message_template" rows="7"></textarea>
                  </div>

                  <div class="panel-actions">
                    <button class="btn-cancel" type="button" @click="resetAddressTemplate">Reset template</button>
                    <button class="btn-save" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save settings' }}</button>
                  </div>
                </form>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import SettingsService from '../../services/SettingsService';
import { useNotificationStore } from '../../stores/notificationStore';

const defaultTemplate = `Assalam o Alaikum {customer_name},

Thank you for ordering from {brand_name}. We have received your order.

Order total: {currency} {total_price}
Please reply YES to confirm your order or NO to cancel.

Thank you.`;

const legacyDefaultTemplate = `Assalam o Alaikum {customer_name},

Your order {order_number} has been received. Please reply YES to confirm your order.

Total: {currency} {total_price}
Thank you.`;

const trackingDefaultTemplate = `Assalam o Alaikum {customer_name},

Your tracking ID is {tracking_number}. Please reply YES to confirm your order.

Total: {currency} {total_price}
Thank you.`;

const defaultAddressTemplate = `Assalam o Alaikum {customer_name},

This is {brand_name}. Please confirm your delivery address:
{address}

Reply YES if this address is correct, or send the correct address.`;

const legacyAddressDefaultTemplate = `Assalam o Alaikum {customer_name},

Please confirm your delivery address:
{address}

Reply YES if this address is correct, or send the correct address.`;

const loading = ref(true);
const refreshing = ref(false);
const saving = ref(false);
const disconnecting = ref(false);
const testing = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const testPhone = ref('');
const pollId = ref(null);
const activeTab = ref('integration');
const notificationStore = useNotificationStore();

const tabs = [
  {
    key: 'integration',
    label: 'Integration',
    helper: 'Connect WhatsApp',
  },
  {
    key: 'confirmation',
    label: 'Order confirmation',
    helper: 'Message rules',
  },
  {
    key: 'address',
    label: 'Address confirmation',
    helper: 'Address checks',
  },
];

const form = reactive({
  enabled: false,
  message_template: defaultTemplate,
  send_on_shopify_orders: true,
  send_on_manual_orders: true,
  address_confirmation: {
    enabled: false,
    message_template: defaultAddressTemplate,
    show_in_order_form: false,
    show_in_order_list: false,
  },
});

const variables = [
  {
    token: '{customer_name}',
    label: 'Customer name',
    description: 'Name saved on the order customer profile.',
  },
  {
    token: '{brand_name}',
    label: 'Brand name',
    description: 'Store or brand name on the order.',
  },
  {
    token: '{total_price}',
    label: 'Order total',
    description: 'Total order amount without currency.',
  },
  {
    token: '{currency}',
    label: 'Currency',
    description: 'Order currency, such as PKR.',
  },
  {
    token: '{items}',
    label: 'Items',
    description: 'Comma-separated product names and quantities.',
  },
  {
    token: '{address}',
    label: 'Address',
    description: 'Customer shipping or delivery address saved on the order.',
  },
];

const addressVariables = [
  {
    token: '{customer_name}',
    label: 'Customer name',
    description: 'Name saved on the order customer profile.',
  },
  {
    token: '{address}',
    label: 'Delivery address',
    description: 'Customer delivery address saved on the order.',
  },
  {
    token: '{brand_name}',
    label: 'Brand name',
    description: 'Store or brand name on the order.',
  },
  {
    token: '{tracking_number}',
    label: 'Tracking ID',
    description: 'Courier tracking number, when available.',
  },
  {
    token: '{total_price}',
    label: 'Order total',
    description: 'Total order amount without currency.',
  },
];

const connection = reactive({
  status: 'initializing',
  connected: false,
  qr: null,
  phone: null,
  last_error: null,
});

const statusLabel = computed(() => {
  const labels = {
    qr: 'Scan QR',
    initializing: 'Starting',
    authenticated: 'Pairing',
    disconnected: 'Disconnected',
    auth_failed: 'Connection failed',
    not_configured: 'WhatsApp setup missing',
    error: 'Connection issue',
  };

  return labels[connection.status] || 'Not connected';
});

const userFriendlyConnectionError = computed(() => {
  if (!connection.last_error) return '';

  return String(connection.last_error)
    .replace(/WhatsApp bridge/gi, 'WhatsApp connection service')
    .replace(/bridge/gi, 'connection service')
    .replace(/Protocol error \(Runtime\.callFunctionOn\): Execution context was destroyed\./gi, 'WhatsApp is reconnecting. Please refresh the status in a moment.');
});

const sourceSelectionRequired = computed(() => (
  form.enabled && !form.send_on_shopify_orders && !form.send_on_manual_orders
));

const applyConnection = (nextConnection = {}) => {
  Object.assign(connection, {
    status: nextConnection.status || 'error',
    connected: Boolean(nextConnection.connected),
    qr: nextConnection.qr || null,
    phone: nextConnection.phone || null,
    last_error: nextConnection.last_error || null,
  });
};

const loadSettings = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await SettingsService.fetchWhatsAppAutomation();
    const settings = res.data.data.settings || {};
    Object.assign(form, {
      ...settings,
      address_confirmation: {
        ...form.address_confirmation,
        ...(settings.address_confirmation || {}),
      },
    });
    if ([legacyDefaultTemplate, trackingDefaultTemplate].includes(form.message_template)) {
      form.message_template = defaultTemplate;
    }
    if (form.address_confirmation.message_template === legacyAddressDefaultTemplate) {
      form.address_confirmation.message_template = defaultAddressTemplate;
    }
    applyConnection(res.data.data.connection);
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Unable to load WhatsApp automation.';
  } finally {
    loading.value = false;
  }
};

const refreshStatus = async () => {
  refreshing.value = true;
  try {
    const res = await SettingsService.fetchWhatsAppStatus();
    applyConnection(res.data.data.connection);
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Unable to refresh WhatsApp status.';
  } finally {
    refreshing.value = false;
  }
};

const saveSettings = async () => {
  if (sourceSelectionRequired.value) {
    errorMsg.value = 'Select at least one order source before saving.';
    return;
  }

  saving.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  try {
    const res = await SettingsService.updateWhatsAppAutomation({ ...form });
    const settings = res.data.data.settings || {};
    Object.assign(form, {
      ...settings,
      address_confirmation: {
        ...form.address_confirmation,
        ...(settings.address_confirmation || {}),
      },
    });
    notificationStore.show('WhatsApp automation settings saved.');
  } catch (error) {
    errorMsg.value = Object.values(error.response?.data?.errors || {}).flat()[0]
      || error.response?.data?.message
      || 'Unable to save WhatsApp automation.';
  } finally {
    saving.value = false;
  }
};

const disconnect = async () => {
  disconnecting.value = true;
  errorMsg.value = '';
  try {
    const res = await SettingsService.disconnectWhatsApp();
    applyConnection(res.data.data.connection);
    successMsg.value = 'WhatsApp disconnected.';
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Unable to disconnect WhatsApp.';
  } finally {
    disconnecting.value = false;
  }
};

const sendTest = async () => {
  testing.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  try {
    await SettingsService.sendWhatsAppTest({
      phone: testPhone.value,
      message: 'This is a test message from Zyro Automation.',
    });
    successMsg.value = 'Test message sent.';
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Unable to send test message.';
  } finally {
    testing.value = false;
  }
};

const resetTemplate = () => {
  form.message_template = defaultTemplate;
};

const resetAddressTemplate = () => {
  form.address_confirmation.message_template = defaultAddressTemplate;
};

const insertVariable = (token) => {
  const suffix = form.message_template.endsWith(' ') || form.message_template.endsWith('\n') || !form.message_template
    ? ''
    : ' ';
  form.message_template = `${form.message_template}${suffix}${token}`;
};

const insertAddressVariable = (token) => {
  const template = form.address_confirmation.message_template || '';
  const suffix = template.endsWith(' ') || template.endsWith('\n') || !template ? '' : ' ';
  form.address_confirmation.message_template = `${template}${suffix}${token}`;
};

onMounted(async () => {
  await loadSettings();
  pollId.value = window.setInterval(refreshStatus, 5000);
});

onBeforeUnmount(() => {
  if (pollId.value) window.clearInterval(pollId.value);
});
</script>

<style scoped>
.settings-wrapper {
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.settings-body {
  display: flex;
  flex: 1;
  max-width: none;
  width: 100%;
  margin: 28px 0;
  padding: 0 28px;
  gap: 24px;
  align-items: flex-start;
}

.settings-content {
  flex: 1;
  min-width: 0;
}

.content-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.eyebrow {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  color: #111827;
}

h1 {
  font-size: 22px;
}

h2 {
  font-size: 16px;
}

.panel-body {
  display: grid;
  gap: 22px;
  padding: 28px;
}

.section-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.section-tab {
  min-height: 62px;
  display: grid;
  gap: 3px;
  align-content: center;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #475569;
  text-align: left;
  cursor: pointer;
}

.section-tab:hover {
  background: #fff;
  border-color: #e2e8f0;
}

.section-tab.active {
  background: #fff;
  border-color: #bfdbfe;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  color: #111827;
}

.section-tab span {
  font-size: 14px;
  font-weight: 850;
}

.section-tab small {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.tab-surface {
  display: grid;
  gap: 18px;
}

.section-kicker {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.connection-pill {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.connection-pill.connected {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.connection-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 18px;
}

.integration-status,
.automation-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.status-dot-label {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 12px;
  font-weight: 850;
  white-space: nowrap;
}

.status-dot-label span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f97316;
}

.status-dot-label.connected {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.status-dot-label.connected span {
  background: #16a34a;
}

.qr-panel {
  width: 280px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.qr-code {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder,
.connected-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-weight: 700;
}

.connected-state strong {
  color: #15803d;
}

.check-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #dcfce7;
  color: #15803d;
  font-size: 28px;
}

.connection-copy,
.automation-form,
.test-panel {
  display: grid;
  gap: 14px;
}

.connection-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.connection-details > div {
  display: grid;
  gap: 4px;
  min-height: 68px;
  align-content: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.detail-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  text-transform: uppercase;
}

.connection-details strong {
  color: #111827;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.button-row,
.panel-actions,
.test-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.automation-form,
.test-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 18px;
}

.switch-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
}

.switch-row input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-control {
  width: 44px;
  height: 24px;
  position: relative;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background 0.18s ease;
}

.switch-control::after {
  content: '';
  width: 18px;
  height: 18px;
  position: absolute;
  top: 3px;
  left: 3px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  transition: transform 0.18s ease;
}

.switch-row input:checked + .switch-control {
  background: #111827;
}

.switch-row input:checked + .switch-control::after {
  transform: translateX(20px);
}

.source-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.source-options.disabled {
  opacity: 0.62;
}

.source-option {
  min-height: 82px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
}

.source-option:has(input:checked) {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.source-options.disabled .source-option {
  cursor: not-allowed;
}

.source-option input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: #111827;
}

.source-option span {
  display: grid;
  gap: 4px;
}

.source-option strong {
  color: #111827;
  font-size: 14px;
  font-weight: 850;
}

.source-option small {
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.4;
}

.field-warning {
  margin: -4px 0 0;
  padding: 9px 11px;
  border: 1px solid #fde68a;
  border-radius: 7px;
  background: #fffbeb;
  color: #92400e;
  font-size: 13px;
  font-weight: 750;
}

.form-group {
  display: grid;
  gap: 7px;
}

.form-label {
  color: #374151;
  font-size: 13px;
  font-weight: 700;
}

.variable-reference {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 4px;
}

.variable-chip {
  display: grid;
  gap: 3px;
  min-height: 58px;
  padding: 9px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;
}

.variable-chip:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.variable-chip strong {
  color: #111827;
  font-size: 12.5px;
  overflow-wrap: anywhere;
}

.variable-chip span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.form-input,
.form-textarea {
  border: 1px solid #d1d5db;
  border-radius: 7px;
  color: #111827;
  font: inherit;
  outline: none;
}

.form-input {
  min-height: 38px;
  padding: 0 12px;
}

.form-textarea {
  min-height: 160px;
  padding: 10px 12px;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.panel-actions {
  justify-content: flex-end;
}

.btn-cancel,
.btn-save {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-save {
  background: #111827;
  border: 1px solid #111827;
  color: #fff;
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-panel {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.test-row {
  justify-content: flex-end;
}

.test-row .form-input {
  width: 210px;
}

.alert {
  padding: 10px 14px;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
}

.alert-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.alert-error,
.bridge-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 7px;
  padding: 10px 12px;
}

@media (max-width: 860px) {
  .settings-body,
  .connection-grid,
  .test-panel {
    display: grid;
    grid-template-columns: 1fr;
  }

  .section-tabs,
  .source-options,
  .connection-details {
    grid-template-columns: 1fr;
  }

  .integration-status,
  .automation-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .qr-panel {
    width: 100%;
    max-width: 280px;
  }

  .test-row,
  .test-row .form-input {
    width: 100%;
  }

  .variable-reference {
    grid-template-columns: 1fr;
  }
}
</style>
