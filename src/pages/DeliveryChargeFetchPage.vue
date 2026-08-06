<template>
  <main class="fetch-page">
    <section class="fetch-panel">
      <div v-if="state === 'loading'" class="spinner" aria-hidden="true"></div>
      <div v-else class="status-icon" :class="state">
        <span>{{ state === 'success' ? '✓' : '!' }}</span>
      </div>

      <p class="eyebrow">{{ courierName }}</p>
      <h1>{{ title }}</h1>
      <p class="message">{{ message }}</p>

      <div v-if="summary" class="summary-grid">
        <div>
          <strong>{{ summary.checked }}</strong>
          <span>Checked</span>
        </div>
        <div>
          <strong>{{ summary.updated }}</strong>
          <span>Updated</span>
        </div>
        <div>
          <strong>{{ summary.failed }}</strong>
          <span>Failed</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DeliveryChargeService from '../services/DeliveryChargeService';

const route = useRoute();
const state = ref('loading');
const summary = ref(null);
const errorMessage = ref('');
let syncController = null;

const courierName = computed(() => {
  const slug = String(route.params.courierSlug || '');
  if (!slug) return 'Courier';

  return slug.charAt(0).toUpperCase() + slug.slice(1);
});

const title = computed(() => {
  if (state.value === 'success') return 'Delivery charges fetch completed';
  if (state.value === 'error') return 'Delivery charges fetch failed';

  return 'Fetching delivery charges';
});

const message = computed(() => {
  if (state.value === 'success') return 'Latest delivery charges have been fetched and saved.';
  if (state.value === 'error') return errorMessage.value || 'Unable to fetch delivery charges right now.';

  return 'We are fetching delivery charges. Please keep this tab open.';
});

onMounted(async () => {
  syncController = new AbortController();

  try {
    const res = await DeliveryChargeService.syncCourier({
      courier_slug: route.params.courierSlug,
      all: 1,
      ...syncFilters(),
    }, {
      signal: syncController.signal,
    });

    const data = res.data.data || {};
    summary.value = {
      checked: data.checked ?? 0,
      updated: data.updated ?? 0,
      failed: data.failed ?? 0,
    };
    state.value = 'success';
  } catch (error) {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return;
    }

    errorMessage.value = error.response?.data?.message || error.message || '';
    state.value = 'error';
  }
});

const syncFilters = () => Object.fromEntries(
  ['brand_id', 'courier_integration_id', 'date_from', 'date_to', 'search', 'source']
    .map(key => [key, route.query[key]])
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
);

const abortSync = () => {
  if (state.value === 'loading' && syncController) {
    syncController.abort();
  }
};

window.addEventListener('pagehide', abortSync);
window.addEventListener('beforeunload', abortSync);

onBeforeUnmount(() => {
  abortSync();
  window.removeEventListener('pagehide', abortSync);
  window.removeEventListener('beforeunload', abortSync);
});
</script>

<style scoped>
.fetch-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: #f8fafc;
}

.fetch-panel {
  width: min(440px, 100%);
  text-align: center;
}

.spinner,
.status-icon {
  display: grid;
  width: 58px;
  height: 58px;
  margin: 0 auto 18px;
  place-items: center;
}

.spinner {
  border: 4px solid #dbeafe;
  border-top-color: #2563eb;
  border-radius: 999px;
  animation: spin 0.9s linear infinite;
}

.status-icon {
  border-radius: 999px;
  color: #fff;
  font-size: 30px;
  font-weight: 900;
}

.status-icon.success {
  background: #16a34a;
}

.status-icon.error {
  background: #dc2626;
}

.eyebrow {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #111827;
  font-size: 26px;
  font-weight: 900;
}

.message {
  margin: 10px auto 0;
  color: #475569;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.5;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 22px;
}

.summary-grid div {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 10px;
  background: #fff;
}

.summary-grid strong,
.summary-grid span {
  display: block;
}

.summary-grid strong {
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.summary-grid span {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
