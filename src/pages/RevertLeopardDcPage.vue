<template>
  <main class="reset-page">
    <section class="reset-panel">
      <div v-if="state === 'loading'" class="spinner" aria-hidden="true"></div>
      <div v-else class="status-icon" :class="state">
        <span>{{ state === 'success' ? 'OK' : '!' }}</span>
      </div>

      <p class="eyebrow">Leopard DC Reset</p>
      <h1>{{ title }}</h1>
      <p class="message">{{ message }}</p>

      <div v-if="summary" class="summary-grid">
        <div>
          <strong>{{ summary.matched }}</strong>
          <span>Matched</span>
        </div>
        <div>
          <strong>{{ summary.updated }}</strong>
          <span>Updated</span>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axiosInstance from '../services/AuthService';

const route = useRoute();
const state = ref('loading');
const summary = ref(null);
const errorMessage = ref('');

const title = computed(() => {
  if (state.value === 'success') return 'Delivery charges reset';
  if (state.value === 'error') return 'Reset failed';

  return 'Resetting delivery charges';
});

const message = computed(() => {
  if (state.value === 'success') {
    return `Leopard delivery charges were reset for ${summary.value.date_from} to ${summary.value.date_to}.`;
  }

  if (state.value === 'error') return errorMessage.value || 'Unable to reset Leopard delivery charges.';

  return 'Please keep this tab open.';
});

onMounted(async () => {
  try {
    const res = await axiosInstance.get('/revert_leopard_dc', {
      params: {
        date_from: route.query.date_from,
        date_to: route.query.date_to,
      },
    });

    summary.value = res.data.data || {};
    state.value = 'success';
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || '';
    state.value = 'error';
  }
});
</script>

<style scoped>
.reset-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: #f8fafc;
}

.reset-panel {
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
  font-size: 16px;
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
  grid-template-columns: repeat(2, 1fr);
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
