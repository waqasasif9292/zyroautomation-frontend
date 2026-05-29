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

              <section class="connection-grid">
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
                  <h2>Linked device QR</h2>
                  <div class="button-row">
                    <button class="btn-save" type="button" @click="refreshStatus" :disabled="refreshing">
                      {{ refreshing ? 'Refreshing...' : 'Refresh QR' }}
                    </button>
                    <button v-if="connection.connected" class="btn-cancel" type="button" @click="disconnect" :disabled="disconnecting">
                      {{ disconnecting ? 'Disconnecting...' : 'Disconnect' }}
                    </button>
                  </div>
                  <p v-if="connection.last_error" class="bridge-error">{{ connection.last_error }}</p>
                </div>
              </section>

              <form class="automation-form" @submit.prevent="saveSettings">
                <label class="toggle-row">
                  <input type="checkbox" v-model="form.enabled">
                  <span>
                    <strong>Order confirmation automation</strong>
                  </span>
                </label>

                <div class="send-options">
                  <label><input type="checkbox" v-model="form.send_on_shopify_orders"> Shopify webhook orders</label>
                  <label><input type="checkbox" v-model="form.send_on_manual_orders"> Manual orders</label>
                </div>

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
                  <button class="btn-save" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Save settings' }}</button>
                </div>
              </form>

              <section class="test-panel">
                <div>
                  <h2>Send a test</h2>
                </div>
                <div class="test-row">
                  <input class="form-input" v-model="testPhone" placeholder="03xxxxxxxxx">
                  <button class="btn-save" type="button" @click="sendTest" :disabled="testing || !connection.connected">
                    {{ testing ? 'Sending...' : 'Send test' }}
                  </button>
                </div>
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

const defaultTemplate = `Assalam o Alaikum {customer_name},

Your order {order_number} has been received. Please reply YES to confirm your order.

Total: {currency} {total_price}
Thank you.`;

const loading = ref(true);
const refreshing = ref(false);
const saving = ref(false);
const disconnecting = ref(false);
const testing = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const testPhone = ref('');
const pollId = ref(null);

const form = reactive({
  enabled: false,
  message_template: defaultTemplate,
  send_on_shopify_orders: true,
  send_on_manual_orders: true,
});

const variables = [
  {
    token: '{customer_name}',
    label: 'Customer name',
    description: 'Name saved on the order customer profile.',
  },
  {
    token: '{order_number}',
    label: 'Order number',
    description: 'Order name or number, such as #1024.',
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
    auth_failed: 'Login failed',
    not_configured: 'Bridge missing',
    error: 'Bridge error',
  };

  return labels[connection.status] || 'Not connected';
});

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
    Object.assign(form, res.data.data.settings || {});
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
  saving.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  try {
    const res = await SettingsService.updateWhatsAppAutomation({ ...form });
    Object.assign(form, res.data.data.settings || {});
    successMsg.value = 'WhatsApp automation settings saved.';
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

const insertVariable = (token) => {
  const suffix = form.message_template.endsWith(' ') || form.message_template.endsWith('\n') || !form.message_template
    ? ''
    : ' ';
  form.message_template = `${form.message_template}${suffix}${token}`;
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

.button-row,
.panel-actions,
.test-row,
.send-options {
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

.toggle-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.toggle-row input,
.send-options input {
  width: 16px;
  height: 16px;
  accent-color: #111827;
}

.toggle-row span {
  display: grid;
  gap: 3px;
}

.toggle-row strong,
.send-options label {
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.send-options label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
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
