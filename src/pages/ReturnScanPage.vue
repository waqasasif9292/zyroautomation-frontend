<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="scan-page">
      <section class="scan-panel">
        <header class="scan-header">
          <div>
            <h1>Scan Returns</h1>
            <p>Scan pending return tracking numbers to mark them as received.</p>
          </div>
          <RouterLink class="back-btn" to="/returns/pending">Back to Pending</RouterLink>
        </header>

        <section class="scanner-panel">
          <div class="scanner-controls">
            <div>
              <h2>Scanner</h2>
              <p>Scanned Returns For Receiving ({{ scannedOrders.length }})</p>
            </div>
            <div class="scanner-input-group">
              <input
                ref="scannerInput"
                v-model="scannerTrackingNumber"
                class="scanner-input"
                type="text"
                placeholder="Tracking number"
                autocomplete="off"
                :disabled="scannerLoading"
                @keydown.enter.prevent="handleScannerSubmit"
              >
              <button class="scanner-submit-btn" type="button" :disabled="scannerLoading" @click="handleScannerSubmit">
                {{ scannerLoading ? 'Processing...' : 'Mark Received' }}
              </button>
            </div>
          </div>

          <div class="scanned-table-wrap">
            <table class="scanned-table">
              <thead>
                <tr>
                  <th>Created At</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Tracking Number</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="scannedOrders.length === 0">
                  <td colspan="4" class="empty-scanned-cell">No scanned returns.</td>
                </tr>
                <tr v-for="order in scannedOrders" v-else :key="order.id">
                  <td>{{ formatDateTime(order.created_at || order.shopify_created_at) }}</td>
                  <td>{{ order.customer_name || order.order_name || '-' }}</td>
                  <td>{{ formatPhone(order.contact) || '-' }}</td>
                  <td>{{ order.tracking_number || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import ReturnManagementService from '../services/ReturnManagementService';
import { formatPhone } from '../utils/phoneNormalizer';

const scannerInput = ref(null);
const scannerTrackingNumber = ref('');
const scannerLoading = ref(false);
const scannedOrders = ref([]);
const toast = ref('');

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => {
    toast.value = '';
  }, 3000);
};

const focusScanner = async () => {
  await nextTick();
  scannerInput.value?.focus();
};

const handleScannerSubmit = async () => {
  const trackingNumber = scannerTrackingNumber.value.trim();
  if (!trackingNumber || scannerLoading.value) {
    await focusScanner();
    return;
  }

  scannerLoading.value = true;
  try {
    const response = await ReturnManagementService.markReceivedByTracking(trackingNumber);
    const order = response.data.data.order;
    scannedOrders.value = [
      order,
      ...scannedOrders.value.filter(item => item.id !== order.id),
    ];
    scannerTrackingNumber.value = '';
    showToast(`Return marked as received: ${order.tracking_number}`);
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to scan return.');
  } finally {
    scannerLoading.value = false;
    await focusScanner();
  }
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

onMounted(focusScanner);
</script>

<style scoped>
.scan-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.scan-panel {
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.scan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid #e2e8f0;
}

.scan-header h1 {
  margin: 0;
  color: #172554;
  font-size: 18px;
  font-weight: 900;
}

.scan-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  color: #4f46e5;
  padding: 8px 12px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.scanner-panel {
  margin: 22px;
  border: 1px solid #dbe4ef;
  border-radius: 8px;
  background: #f8fafc;
}

.scanner-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.scanner-controls h2 {
  margin: 0;
  color: #172554;
  font-size: 15px;
  font-weight: 900;
}

.scanner-controls p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
}

.scanner-input-group {
  display: grid;
  grid-template-columns: minmax(260px, 360px) 132px;
  gap: 10px;
  align-items: center;
}

.scanner-input {
  width: 100%;
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #fff;
  color: #1e293b;
  font-size: 14px;
  outline: none;
  padding: 0 12px;
}

.scanner-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.scanner-submit-btn {
  height: 42px;
  border: none;
  border-radius: 5px;
  background: #1e293b;
  color: #fff;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.scanner-submit-btn:disabled,
.scanner-input:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.scanned-table-wrap {
  overflow-x: auto;
}

.scanned-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  table-layout: fixed;
}

.scanned-table th {
  padding: 12px 16px;
  background: #eef4fb;
  color: #64748b;
  font-size: 12px;
  text-align: left;
}

.scanned-table td {
  height: 48px;
  padding: 9px 16px;
  background: #fff;
  color: #34558b;
  font-size: 13px;
  font-weight: 650;
  border-bottom: 1px solid #e2e8f0;
}

.empty-scanned-cell {
  color: #64748b;
  text-align: center;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 9999;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  font-size: 13.5px;
  font-weight: 500;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 760px) {
  .scan-page {
    padding: 16px;
  }

  .scan-header,
  .scanner-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .scanner-panel {
    margin: 16px;
  }

  .scanner-input-group {
    grid-template-columns: 1fr;
  }
}
</style>
