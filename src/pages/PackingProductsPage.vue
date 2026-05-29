<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="products-page">
      <section class="products-panel">
        <header class="products-header">
          <div>
            <h1>Pending Orders Products({{ totalProducts }})</h1>
            <p>Products currently waiting in pending packing orders.</p>
          </div>
          <button class="refresh-btn" type="button" :disabled="loading" @click="fetchStats">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M16 8h5V3" />
            </svg>
            Refresh
          </button>
        </header>

        <div class="table-wrap">
          <table class="products-table">
            <thead>
              <tr>
                <th>SR.</th>
                <th>Product Name</th>
                <th>Orders</th>
                <th>Last 7 Days</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="loading">
                <tr v-for="row in 7" :key="row">
                  <td v-for="col in 4" :key="col"><span class="skeleton"></span></td>
                </tr>
              </template>
              <tr v-else-if="pendingProducts.length === 0">
                <td colspan="4" class="empty-cell">No pending products.</td>
              </tr>
              <tr v-else v-for="(product, index) in pendingProducts" :key="product.key">
                <td class="serial-cell">{{ index + 1 }}</td>
                <td class="product-name-cell">{{ product.name || 'Unknown product' }}</td>
                <td>{{ formatNumber(product.orders) }}</td>
                <td>{{ formatNumber(product.last_seven_days) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import PackingLogService from '../services/PackingLogService';

const loading = ref(false);
const toast = ref('');
const stats = ref({
  pending_products: [],
});

const pendingProducts = computed(() => stats.value.pending_products || []);
const totalProducts = computed(() => pendingProducts.value.length);

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => {
    toast.value = '';
  }, 3000);
};

const formatNumber = value => Number(value || 0).toLocaleString();

const fetchStats = async () => {
  loading.value = true;
  try {
    const response = await PackingLogService.getStats();
    stats.value = response.data.data.stats;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to load pending products.');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStats);
</script>

<style scoped>
.products-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.products-panel {
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.products-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.products-header h1 {
  margin: 0;
  color: #172554;
  font-size: 17px;
  font-weight: 800;
}

.products-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  color: #4f46e5;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 11px;
  white-space: nowrap;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.products-table {
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 14px 20px;
  background: #f8fafc;
  color: #8a9ab3;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

td {
  height: 60px;
  padding: 10px 20px;
  color: #34558b;
  font-size: 13.5px;
  font-weight: 500;
  vertical-align: middle;
  border-bottom: 1px solid #e5e7eb;
}

th:nth-child(1) { width: 70px; }
th:nth-child(2) { width: 60%; }
th:nth-child(3) { width: 140px; }
th:nth-child(4) { width: 150px; }

.serial-cell,
.product-name-cell {
  color: #38558d;
  font-weight: 800;
}

.product-name-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-cell {
  height: 180px;
  color: #64748b;
  text-align: center;
}

.skeleton {
  display: block;
  width: 82%;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
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

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

@media (max-width: 760px) {
  .products-page {
    padding: 16px;
  }

  .products-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px;
  }
}
</style>
