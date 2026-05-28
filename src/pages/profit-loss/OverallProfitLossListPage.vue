<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="page">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h1>Overall Profit Loss</h1>
            <p>Saved overall reports from filtered order products and entered product costs.</p>
          </div>
          <button class="primary-btn" type="button" @click="router.push('/overall-profit-loss/create')">Create Report</button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date Range</th>
                <th>Orders</th>
                <th>Products</th>
                <th>Quantity</th>
                <th>Product Cost</th>
                <th>Final Profit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8">Loading overall profit/loss reports...</td>
              </tr>
              <tr v-else-if="!reports.length">
                <td class="empty-cell" colspan="8">
                  <div>
                    <strong>No overall profit/loss reports yet.</strong>
                    <button class="primary-btn" type="button" @click="router.push('/overall-profit-loss/create')">Create Report</button>
                  </div>
                </td>
              </tr>
              <tr v-for="report in reports" v-else :key="report.id">
                <td><button class="name-btn" type="button" @click="router.push(`/overall-profit-loss/${report.id}`)">{{ report.name }}</button></td>
                <td>{{ report.start_date }} to {{ report.end_date }}</td>
                <td>{{ number(report.summary?.orders_count) }}</td>
                <td>{{ number(report.summary?.products_count) }}</td>
                <td>{{ number(report.summary?.total_quantity) }}</td>
                <td>{{ money(report.summary?.total_product_cost) }}</td>
                <td :class="report.results?.totals?.final_profit >= 0 ? 'success' : 'danger'">{{ money(report.results?.totals?.final_profit) }}</td>
                <td>
                  <div class="actions">
                    <button type="button" @click="router.push(`/overall-profit-loss/${report.id}`)">View</button>
                    <button type="button" @click="router.push(`/overall-profit-loss/${report.id}/edit`)">Edit</button>
                    <button class="danger-btn" type="button" @click="remove(report)">Delete</button>
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
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import OverallProfitLossService from '../../services/OverallProfitLossService';

const router = useRouter();
const route = useRoute();
const reports = ref([]);
const loading = ref(true);
const toast = ref('');
const money = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const number = (value) => Number(value || 0).toLocaleString();

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const fetchReports = async () => {
  loading.value = true;
  try {
    const res = await OverallProfitLossService.getReports();
    reports.value = res.data.data.reports;
  } finally {
    loading.value = false;
  }
};

const remove = async (report) => {
  if (!confirm(`Delete ${report.name}?`)) return;
  await OverallProfitLossService.deleteReport(report.id);
  reports.value = reports.value.filter(item => item.id !== report.id);
  showToast('Report deleted.');
};

onMounted(async () => {
  await fetchReports();
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
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

h1,
p {
  margin: 0;
}

h1 {
  margin-bottom: 4px;
  color: #1e293b;
  font-size: 20px;
}

p {
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

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1040px;
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

.empty-cell div {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 28px;
  color: #64748b;
}

.empty-cell .primary-btn {
  width: fit-content;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.actions button {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  padding: 7px 10px;
  color: #334155;
  font-weight: 800;
  cursor: pointer;
}

.actions .danger-btn {
  border-color: #fecaca;
  color: #dc2626;
}

.success {
  color: #16a34a;
  font-weight: 800;
}

.danger {
  color: #dc2626;
  font-weight: 800;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 50;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  padding: 12px 14px;
  font-weight: 800;
}
</style>
