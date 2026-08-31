<template>
  <AppLayout>
    <div class="page-body">
      <SettingsSubNav activeKey="whatsapp" />

      <main class="page-content">
        <section class="content-panel">
          <header class="panel-header">
            <div>
              <p class="eyebrow">WhatsApp</p>
              <h1 class="panel-title">Connect your WhatsApp</h1>
              <p class="panel-subtitle">Scan the QR code to connect one WhatsApp account to this workspace.</p>
            </div>
            <span :class="['status-pill', `status-${connection.status}`]">
              <span class="status-dot"></span>
              {{ statusLabel }}
            </span>
          </header>

          <div class="panel-body">
            <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

            <div v-if="loading" class="state-block">
              <span class="spinner"></span>
              <p>Checking WhatsApp connection...</p>
            </div>

            <template v-else-if="!connection.provider_configured">
              <div class="state-block state-block-left">
                <div class="state-icon warning-icon">!</div>
                <div>
                  <h2>WhatsApp provider is not configured</h2>
                  <p>Set the Evolution Go URL and API key on the server before starting a connection.</p>
                </div>
              </div>
            </template>

            <template v-else-if="!connection.exists">
              <div class="state-block state-block-left">
                <div class="state-icon">W</div>
                <div>
                  <h2>No WhatsApp account connected</h2>
                  <p>Create a secure connection for this workspace, then scan its QR code with WhatsApp.</p>
                  <button class="primary-button" type="button" :disabled="busy" @click="createConnection">
                    <span v-if="busy" class="button-spinner"></span>
                    <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    {{ busy ? 'Preparing...' : 'Start connection' }}
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="connection-grid">
                <div class="connection-summary">
                  <div class="summary-icon">W</div>
                  <div>
                    <h2>{{ connection.profile_name || 'WhatsApp account' }}</h2>
                    <p v-if="connection.status === 'connected'">Your account is ready for the next WhatsApp setup step.</p>
                    <p v-else-if="connection.status === 'provider_unavailable'">Evolution Go cannot be reached right now. The main application remains available.</p>
                    <p v-else>Open WhatsApp on your phone and scan the QR code shown here.</p>
                  </div>
                </div>

                <div v-if="connection.status === 'connected'" class="connected-state">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                  <strong>Connected</strong>
                  <span>Last checked {{ lastCheckedLabel }}</span>
                </div>

                <div v-else class="qr-area">
                  <div v-if="qrLoading" class="qr-placeholder">
                    <span class="spinner"></span>
                    <span>Generating a secure QR code...</span>
                  </div>
                  <div v-else-if="qrCode" class="qr-card">
                    <img :src="qrCode" alt="WhatsApp QR code" />
                    <p>QR codes expire. Scan the latest code from your phone.</p>
                  </div>
                  <div v-else class="qr-placeholder">
                    <span class="state-icon">⌁</span>
                    <span>{{ connection.status === 'provider_unavailable' ? 'Provider unavailable.' : 'QR code is not ready yet.' }}</span>
                  </div>
                </div>
              </div>

              <div class="action-row">
                <button v-if="connection.status !== 'connected'" class="secondary-button" type="button" :disabled="busy || qrLoading" @click="loadQr">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" /><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" /><path d="M3 16v-4h4M21 8v4h-4" /></svg>
                  Refresh QR
                </button>
                <button v-if="connection.status !== 'connected'" class="secondary-button" type="button" :disabled="busy" @click="reconnect">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
                  Reconnect
                </button>
                <button v-if="connection.status === 'connected'" class="secondary-button" type="button" :disabled="busy" @click="disconnect">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></svg>
                  Disconnect
                </button>
                <button class="danger-button" type="button" :disabled="busy" @click="removeConnection">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></svg>
                  Remove connection
                </button>
              </div>
            </template>

            <p class="provider-note">WhatsApp connection powered by Evolution Go.</p>
          </div>
        </section>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import SettingsSubNav from '../components/SettingsSubNav.vue';
import WhatsAppConnectionService from '../services/WhatsAppConnectionService';

const connection = ref({ exists: false, status: 'not_created', provider_configured: false });
const loading = ref(true);
const busy = ref(false);
const qrLoading = ref(false);
const qrCode = ref('');
const errorMessage = ref('');
const successMessage = ref('');
let pollTimer = null;

const statusLabels = {
  connected: 'Connected',
  awaiting_scan: 'Awaiting scan',
  connecting: 'Connecting',
  disconnected: 'Disconnected',
  provider_unavailable: 'Provider unavailable',
  not_created: 'Not connected',
};

const statusLabel = computed(() => statusLabels[connection.value.status] || 'Disconnected');
const lastCheckedLabel = computed(() => {
  if (!connection.value.last_checked_at) return 'just now';
  return new Date(connection.value.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const fetchConnection = async (showLoading = false) => {
  if (showLoading) loading.value = true;
  try {
    const response = await WhatsAppConnectionService.get();
    connection.value = response.data?.data || connection.value;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to check the WhatsApp connection.');
  } finally {
    loading.value = false;
  }
};

const loadQr = async () => {
  if (!connection.value.exists || connection.value.status === 'connected' || qrLoading.value) return;
  qrLoading.value = true;
  try {
    const response = await WhatsAppConnectionService.qr();
    const data = response.data?.data || {};
    qrCode.value = data.qrcode || '';
    if (data.connection) connection.value = data.connection;
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to generate a QR code.');
  } finally {
    qrLoading.value = false;
  }
};

const createConnection = async () => {
  clearMessages();
  busy.value = true;
  try {
    const response = await WhatsAppConnectionService.create();
    connection.value = response.data?.data || connection.value;
    successMessage.value = 'WhatsApp connection created. Scan the QR code to continue.';
    await loadQr();
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to create the WhatsApp connection.');
  } finally {
    busy.value = false;
  }
};

const reconnect = async () => {
  clearMessages();
  busy.value = true;
  try {
    const response = await WhatsAppConnectionService.reconnect();
    connection.value = response.data?.data || connection.value;
    successMessage.value = 'Reconnect requested.';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to reconnect WhatsApp.');
  } finally {
    busy.value = false;
  }
};

const disconnect = async () => {
  if (!window.confirm('Disconnect this WhatsApp account?')) return;
  clearMessages();
  busy.value = true;
  try {
    const response = await WhatsAppConnectionService.disconnect();
    connection.value = response.data?.data || connection.value;
    qrCode.value = '';
    successMessage.value = 'WhatsApp disconnected.';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to disconnect WhatsApp.');
  } finally {
    busy.value = false;
  }
};

const removeConnection = async () => {
  if (!window.confirm('Remove this WhatsApp connection and its linked session?')) return;
  clearMessages();
  busy.value = true;
  try {
    await WhatsAppConnectionService.remove();
    connection.value = { exists: false, status: 'not_created', provider_configured: true };
    qrCode.value = '';
    successMessage.value = 'WhatsApp connection removed.';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to remove the WhatsApp connection.');
  } finally {
    busy.value = false;
  }
};

const pollStatus = async () => {
  if (document.hidden || busy.value || !connection.value.exists) return;
  try {
    const response = await WhatsAppConnectionService.status();
    connection.value = response.data?.data || connection.value;
    if (connection.value.status === 'connected') qrCode.value = '';
  } catch {
    // The backend exposes provider outages as a visible connection state.
  }
};

const handleVisibility = () => {
  if (!document.hidden) {
    fetchConnection();
    if (connection.value.exists && connection.value.status !== 'connected' && !qrCode.value) loadQr();
  }
};

onMounted(async () => {
  await fetchConnection(true);
  if (connection.value.exists && connection.value.status !== 'connected') await loadQr();
  pollTimer = window.setInterval(pollStatus, 8000);
  document.addEventListener('visibilitychange', handleVisibility);
});

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer);
  document.removeEventListener('visibilitychange', handleVisibility);
});
</script>

<style scoped>
.page-body { display: flex; flex: 1; width: 100%; margin: 28px 0; padding: 0 28px; gap: 24px; align-items: flex-start; }
.page-content { flex: 1; min-width: 0; }
.content-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header { padding: 26px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.eyebrow { margin: 0 0 7px; color: #2563eb; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.panel-title { margin: 0 0 5px; color: #0f172a; font-size: 23px; font-weight: 750; }
.panel-subtitle, .state-block p, .connection-summary p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.55; }
.panel-body { padding: 30px 32px; }
.status-pill { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #dbeafe; border-radius: 999px; padding: 7px 11px; color: #1d4ed8; background: #eff6ff; font-size: 12px; font-weight: 750; white-space: nowrap; }
.status-pill.status-connected { border-color: #bbf7d0; color: #15803d; background: #f0fdf4; }
.status-pill.status-provider_unavailable { border-color: #fed7aa; color: #c2410c; background: #fff7ed; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.alert { margin-bottom: 20px; border-radius: 8px; padding: 11px 13px; font-size: 13px; }
.alert-error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }
.alert-success { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; }
.state-block { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 13px; text-align: center; color: #64748b; }
.state-block-left { min-height: 220px; flex-direction: row; justify-content: flex-start; text-align: left; gap: 18px; }
.state-block h2, .connection-summary h2 { margin: 0 0 7px; color: #0f172a; font-size: 17px; }
.state-icon, .summary-icon { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; border-radius: 12px; color: #2563eb; background: #eff6ff; font-size: 18px; font-weight: 800; }
.warning-icon { color: #c2410c; background: #fff7ed; }
.spinner, .button-spinner { display: inline-block; border: 3px solid #dbeafe; border-top-color: #2563eb; border-radius: 50%; animation: spin .8s linear infinite; }
.spinner { width: 28px; height: 28px; }
.button-spinner { width: 14px; height: 14px; border-width: 2px; border-color: rgba(255,255,255,.45); border-top-color: #fff; }
@keyframes spin { to { transform: rotate(360deg); } }
.primary-button, .secondary-button, .danger-button { min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; }
.primary-button { margin-top: 20px; color: #fff; background: #2563eb; border: 1px solid #2563eb; }
.secondary-button { color: #1e3a8a; background: #fff; border: 1px solid #bfdbfe; }
.danger-button { color: #b91c1c; background: #fff; border: 1px solid #fecaca; }
.primary-button:disabled, .secondary-button:disabled, .danger-button:disabled { opacity: .55; cursor: not-allowed; }
button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.connection-grid { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(280px, 360px); gap: 32px; align-items: center; min-height: 330px; }
.connection-summary { display: flex; align-items: flex-start; gap: 14px; }
.connected-state { min-height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #15803d; border: 1px dashed #bbf7d0; border-radius: 12px; background: #f8fff9; }
.connected-state svg { width: 44px; height: 44px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.connected-state span { color: #64748b; font-size: 12px; }
.qr-area { display: flex; justify-content: center; }
.qr-card { width: 256px; text-align: center; }
.qr-card img { display: block; width: 256px; height: 256px; border: 8px solid #fff; border-radius: 8px; box-shadow: 0 6px 24px rgba(15,23,42,.13); }
.qr-card p { margin: 12px 0 0; color: #64748b; font-size: 12px; line-height: 1.45; }
.qr-placeholder { min-height: 256px; width: 256px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; font-size: 13px; text-align: center; }
.action-row { display: flex; flex-wrap: wrap; gap: 10px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
.danger-button { margin-left: auto; }
.provider-note { margin: 24px 0 0; color: #94a3b8; font-size: 12px; }
@media (max-width: 780px) { .page-body { padding: 0 14px; margin: 16px 0; flex-direction: column; } .panel-header, .panel-body { padding: 20px; } .panel-header { flex-direction: column; } .connection-grid { grid-template-columns: 1fr; gap: 24px; } .action-row { align-items: stretch; } .danger-button { margin-left: 0; } }
</style>
