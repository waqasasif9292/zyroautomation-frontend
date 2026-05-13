<template>
  <AppLayout>
    <main class="tracking-page">
      <section class="tracking-header">
        <button class="back-btn" type="button" @click="router.push('/orders')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Orders
        </button>
        <div>
          <p class="eyebrow">Courier Tracking</p>
          <h1>{{ trackingNumber || 'Tracking' }}</h1>
        </div>
      </section>

      <div v-if="loading" class="tracking-shell loading-shell">
        <span v-for="item in 8" :key="item" class="skeleton"></span>
      </div>

      <section v-else-if="order" class="tracking-shell">
        <div class="summary-grid">
          <article class="summary-card primary">
            <span>Tracking Number</span>
            <strong>{{ trackingNumber || '—' }}</strong>
          </article>
          <article class="summary-card">
            <span>Courier Status</span>
            <strong>{{ trackingStatus }}</strong>
          </article>
          <article class="summary-card">
            <span>Customer</span>
            <strong>{{ order.customer?.name || '—' }}</strong>
          </article>
          <article class="summary-card">
            <span>Destination</span>
            <strong>{{ order.customer?.city || '—' }}</strong>
          </article>
        </div>

        <div class="journey-card">
          <div class="journey-head">
            <div>
              <h2>Shipment Journey</h2>
              <p>{{ history.length ? `${history.length} tracking events found` : 'No tracking history available yet.' }}</p>
            </div>
            <button class="refresh-btn" type="button" :disabled="trackingLoading" @click="fetchTracking">
              {{ trackingLoading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>

          <p v-if="trackingError" class="error-text">{{ trackingError }}</p>

          <div v-if="history.length" class="timeline-wrap">
            <ol class="timeline">
              <li v-for="(event, index) in history" :key="`${event.message}-${index}`" class="timeline-item">
                <div :class="['event-icon', eventTone(index)]">
                  <svg v-if="isDelivered(event)" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <svg v-else-if="isTransit(event)" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 17h4V5H2v12h3" />
                    <path d="M14 8h4l4 4v5h-3" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <svg v-else width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m21 8-9-5-9 5 9 5 9-5Z" />
                    <path d="M3 8v8l9 5 9-5V8" />
                    <path d="M12 13v8" />
                  </svg>
                </div>
                <span class="flag">F</span>
                <h3>{{ event.message }}</h3>
                <p>{{ formatEventDate(event.date) }}</p>
                <small v-if="event.code">Code {{ event.code }}</small>
              </li>
            </ol>
          </div>

          <div v-else class="empty-history">
            <div class="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <h3>No tracking history available yet.</h3>
            <p>PostEx returned the current courier status, but detailed journey events are not available for this order yet.</p>
          </div>
        </div>
      </section>

      <section v-else class="tracking-shell empty-history">
        <h3>Order not found.</h3>
        <p>This tracking page could not load the selected order.</p>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import OrderService from '../../services/OrderService';

const route = useRoute();
const router = useRouter();
const order = ref(null);
const history = ref([]);
const loading = ref(false);
const trackingLoading = ref(false);
const trackingError = ref('');
const trackingResponse = ref(null);

const trackingNumber = computed(() => order.value?.tracking_number || trackingResponse.value?.tracking_number || '');
const trackingStatus = computed(() => trackingResponse.value?.order_status || order.value?.status || '—');

const fetchOrder = async () => {
  const res = await OrderService.getOrder(route.params.id);
  order.value = res.data.data.order;
};

const fetchTracking = async () => {
  trackingLoading.value = true;
  trackingError.value = '';

  try {
    const res = await OrderService.getPostexTrackingHistory(route.params.id);
    trackingResponse.value = res.data.data;
    history.value = res.data.data.tracking_history || [];
    if (order.value && res.data.data.order_status) {
      order.value.status = res.data.data.order_status;
    }
  } catch (error) {
    trackingError.value = error.response?.data?.message || 'Unable to load tracking history.';
    history.value = [];
  } finally {
    trackingLoading.value = false;
  }
};

const loadPage = async () => {
  loading.value = true;
  try {
    await fetchOrder();
    if (order.value?.tracking_number) {
      await fetchTracking();
    }
  } finally {
    loading.value = false;
  }
};

const isDelivered = (event) => (event.message || '').toLowerCase().includes('delivered');
const isTransit = (event) => /departed|enroute|transit|arrived/i.test(event.message || '');
const eventTone = (index) => {
  if (isDelivered(history.value[index])) return 'done';
  if (isTransit(history.value[index])) return 'move';
  return index % 2 === 0 ? 'warehouse' : 'package';
};

const formatEventDate = (value) => {
  if (!value) return 'Date not available';
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

onMounted(loadPage);
</script>

<style scoped>
.tracking-page {
  min-height: 100vh;
  padding: 30px;
  background: #f1f5f9;
}

.tracking-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #fff;
  color: #334155;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.eyebrow {
  margin: 0 0 3px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.tracking-header h1 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 900;
}

.tracking-shell {
  display: grid;
  gap: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.summary-card.primary {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.summary-card span {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.summary-card strong {
  display: block;
  overflow: hidden;
  color: #172554;
  font-size: 18px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journey-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 24px;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
}

.journey-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 28px;
}

.journey-head h2 {
  margin: 0 0 5px;
  color: #111827;
  font-size: 18px;
  font-weight: 900;
}

.journey-head p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.refresh-btn {
  height: 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.timeline-wrap {
  overflow-x: auto;
  padding: 18px 0 26px;
}

.timeline {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(118px, 1fr);
  gap: 24px;
  min-width: max-content;
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline::before {
  content: "";
  position: absolute;
  top: 25px;
  left: 58px;
  right: 58px;
  height: 3px;
  border-radius: 999px;
  background: #dbeafe;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.event-icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  color: #fff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
}

.event-icon.warehouse { background: #0f172a; }
.event-icon.package { background: #b91c1c; }
.event-icon.move { background: #059669; }
.event-icon.done { background: #f5b800; }

.flag {
  position: absolute;
  top: -5px;
  left: calc(50% + 15px);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  border-radius: 999px;
  background: #22c55e;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
}

.timeline-item h3 {
  max-width: 112px;
  min-height: 42px;
  margin: 12px 0 6px;
  color: #111827;
  font-size: 11px;
  font-weight: 850;
  line-height: 1.25;
}

.timeline-item p,
.timeline-item small {
  max-width: 112px;
  margin: 0;
  color: #475569;
  font-size: 11px;
  font-weight: 650;
  line-height: 1.35;
}

.timeline-item small {
  margin-top: 4px;
  color: #94a3b8;
}

.empty-history {
  display: grid;
  justify-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  padding: 34px;
  text-align: center;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  margin-bottom: 12px;
  background: #e0f2fe;
  color: #0369a1;
}

.empty-history h3 {
  margin: 0 0 6px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 900;
}

.empty-history p,
.error-text {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.error-text {
  margin-bottom: 18px;
  color: #dc2626;
  font-weight: 750;
}

.loading-shell {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.skeleton {
  height: 96px;
  border-radius: 12px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

@media (max-width: 1050px) {
  .summary-grid,
  .loading-shell {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .tracking-page {
    padding: 18px;
  }

  .tracking-header,
  .journey-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-grid,
  .loading-shell {
    grid-template-columns: 1fr;
  }
}
</style>
