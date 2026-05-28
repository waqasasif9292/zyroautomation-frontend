<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="page">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h1>Product Wise Profit Loss</h1>
            <p>Saved product-wise profit/loss reports from actual order performance.</p>
          </div>
          <div class="header-actions">
            <button class="secondary-btn" type="button" @click="router.push('/overall-profit-loss/create')">Overall Report</button>
            <button class="primary-btn" type="button" @click="router.push('/profit-loss-calculations/create')">Add Report</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date Range</th>
                <th>Orders</th>
                <th>Delivered</th>
                <th>Returned</th>
                <th>Final Profit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7">Loading product wise profit/loss reports...</td>
              </tr>
              <tr v-else-if="!calculations.length">
                <td colspan="7">No product wise profit/loss reports yet.</td>
              </tr>
              <tr v-for="calculation in calculations" v-else :key="calculation.id">
                <td><button class="name-btn" type="button" @click="router.push(`/profit-loss-calculations/${calculation.id}`)">{{ calculation.name }}</button></td>
                <td>{{ calculation.start_date }} to {{ calculation.end_date }}</td>
                <td>{{ number(calculation.results?.summary?.total_orders) }}</td>
                <td>{{ number(calculation.results?.summary?.delivered_count) }}</td>
                <td>{{ number(calculation.results?.summary?.returned_count) }}</td>
                <td :class="calculation.results?.totals?.final_profit >= 0 ? 'success' : 'danger'">{{ money(calculation.results?.totals?.final_profit) }}</td>
                <td>
                  <div class="actions">
                    <button type="button" @click="router.push(`/profit-loss-calculations/${calculation.id}`)">View</button>
                    <button type="button" @click="router.push(`/profit-loss-calculations/${calculation.id}/edit`)">Edit</button>
                    <button class="danger-btn" type="button" @click="remove(calculation)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import { useProfitLossCalculationStore } from '../../stores/profitLossCalculationStore';

const router = useRouter();
const route = useRoute();
const store = useProfitLossCalculationStore();
const { calculations, loading } = storeToRefs(store);
const toast = ref('');
const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const remove = async (calculation) => {
  if (!confirm(`Delete ${calculation.name}?`)) return;
  await store.deleteCalculation(calculation.id);
  showToast('Report deleted.');
};

onMounted(async () => {
  await store.fetchCalculations();
  if (route.query.toast === 'created') {
    showToast('Report created.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Report updated.');
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

h1 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
}

p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.primary-btn {
  border: 1px solid #1e293b;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.secondary-btn {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;
}

th,
td {
  padding: 13px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 14px;
}

th {
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
}

.name-btn {
  border: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.actions button {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 7px 10px;
  cursor: pointer;
}

.danger-btn,
.danger {
  color: #dc2626;
}

.success {
  color: #16a34a;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 20;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  font-size: 13px;
}
</style>
