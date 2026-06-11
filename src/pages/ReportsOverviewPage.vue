<template>
  <AppLayout>
    <main class="overview-page">
      <section class="page-head">
        <div>
          <p class="eyebrow">Reports</p>
          <h1>Overview</h1>
          <p>Monitor return and cancellation volume across the most important operating windows.</p>
        </div>
        <button class="refresh-btn" type="button" :disabled="loading" @click="fetchData">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </section>

      <section class="report-blocks" aria-label="Cancel and return summary">
        <article class="report-block cancel">
          <div class="block-head">
            <div>
              <span>Cancel Report</span>
              <h2>Cancelled orders</h2>
            </div>
            <button type="button" @click="router.push('/reports/cancel')">Open report</button>
          </div>
          <div class="stat-grid">
            <div v-for="item in cancelStats" :key="item.key" class="stat-card">
              <span>{{ item.label }}</span>
              <strong>{{ formatNumber(item.value) }}</strong>
            </div>
          </div>
        </article>

        <article class="report-block return">
          <div class="block-head">
            <div>
              <span>Return Report</span>
              <h2>Returned orders</h2>
            </div>
            <button type="button" @click="router.push('/reports/returns')">Open report</button>
          </div>
          <div class="stat-grid">
            <div v-for="item in returnStats" :key="item.key" class="stat-card">
              <span>{{ item.label }}</span>
              <strong>{{ formatNumber(item.value) }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="report-links">
        <button type="button" @click="router.push('/reports/cancel')">
          <span>Cancel Report</span>
          <strong>Review product and city cancellation risk</strong>
        </button>
        <button type="button" @click="router.push('/reports/returns')">
          <span>Return Report</span>
          <strong>Review product, city, courier, and order returns</strong>
        </button>
        <button type="button" @click="router.push('/reports/products')">
          <span>Product Report</span>
          <strong>Analyze selected products by status, courier, brand, and source</strong>
        </button>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import OrderPerformanceService from '../services/OrderPerformanceService';

const router = useRouter();
const loading = ref(false);
const data = ref({
  cancelled: { today: 0, yesterday: 0, this_month: 0 },
  returns: { today: 0, yesterday: 0, this_month: 0 },
});

const cancelStats = computed(() => [
  { key: 'today', label: 'Today', value: data.value.cancelled.today },
  { key: 'yesterday', label: 'Yesterday', value: data.value.cancelled.yesterday },
  { key: 'this-month', label: 'This month', value: data.value.cancelled.this_month },
]);

const returnStats = computed(() => [
  { key: 'today', label: 'Today', value: data.value.returns.today },
  { key: 'yesterday', label: 'Yesterday', value: data.value.returns.yesterday },
  { key: 'this-month', label: 'This month', value: data.value.returns.this_month },
]);

const formatNumber = value => Number(value || 0).toLocaleString();

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await OrderPerformanceService.getOverview();
    data.value = {
      cancelled: { ...data.value.cancelled, ...(res.data.data?.cancelled || {}) },
      returns: { ...data.value.returns, ...(res.data.data?.returns || {}) },
    };
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.overview-page {
  min-height: 100vh;
  padding: 28px;
  background: #f6f8fb;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.page-head h1 {
  margin: 0;
  color: #0f172a;
  font-size: 26px;
  font-weight: 900;
}

.page-head p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.refresh-btn,
.report-links button,
.block-head button {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.refresh-btn {
  min-width: 92px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
  padding: 9px 13px;
}

.refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.report-block,
.stat-card,
.report-links button {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.report-blocks {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.report-block {
  overflow: hidden;
  border-top-width: 5px;
  box-shadow: none;
}

.report-block.cancel {
  border-top-color: #dc2626;
}

.report-block.return {
  border-top-color: #2563eb;
}

.block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  padding: 18px;
}

.block-head span,
.stat-card span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.block-head h2 {
  margin: 5px 0 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 950;
}

.block-head button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  padding: 9px 12px;
  white-space: nowrap;
}

.report-block.cancel .block-head button:hover {
  border-color: #dc2626;
  color: #991b1b;
}

.report-block.return .block-head button:hover {
  border-color: #2563eb;
  color: #1e40af;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  background: #f8fafc;
  padding: 14px;
}

.stat-card {
  padding: 16px;
  box-shadow: none;
}

.stat-card strong {
  display: block;
  margin-top: 9px;
  color: #0f172a;
  font-size: 30px;
  font-weight: 950;
}

.report-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.report-links button {
  display: grid;
  gap: 5px;
  border-color: #cbd5e1;
  padding: 16px;
  color: #0f172a;
  text-align: left;
}

.report-links button:hover {
  border-color: #2563eb;
  background: #f8fbff;
}

.report-links span {
  color: #1e40af;
  font-size: 14px;
  font-weight: 900;
}

.report-links strong {
  color: #475569;
  font-size: 13px;
  font-weight: 750;
}

@media (max-width: 980px) {
  .report-blocks,
  .report-links {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .block-head {
    flex-direction: column;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .overview-page {
    padding: 18px;
  }

  .page-head {
    flex-direction: column;
  }
}
</style>
