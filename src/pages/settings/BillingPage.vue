<template>
  <AppLayout>
    <div class="settings-wrapper">
      <div class="settings-body">
        <SettingsSubNav activeKey="billing" />

        <main class="billing-content">
          <section class="billing-card">
            <div class="card-header">
              <div>
                <h1>Billing</h1>
                <p>Track credits, usage, and manual top-up details.</p>
              </div>
              <button class="refresh-btn" type="button" :disabled="loading" @click="loadBilling">
                {{ loading ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>

            <div class="summary-grid">
              <article v-for="card in summaryCards" :key="card.key" class="summary-card">
                <p>{{ card.label }}</p>
                <strong>{{ loading ? '—' : card.value }}</strong>
              </article>
            </div>

            <div class="credit-meter">
              <div class="meter-head">
                <span>Remaining Credits</span>
                <strong>{{ summary.remaining_percentage }}%</strong>
              </div>
              <div class="meter-track">
                <span class="meter-fill" :style="{ width: `${Math.min(summary.remaining_percentage || 0, 100)}%` }"></span>
              </div>
            </div>
          </section>

          <section class="billing-card">
            <div class="card-header">
              <div>
                <h2>Manual Top Up</h2>
                <p>1 credit costs PKR {{ summary.price_per_credit || 5 }}. Send payment screenshot on WhatsApp after transfer.</p>
              </div>
            </div>

            <div class="topup-grid">
              <label class="calculator-field">
                <span>Credits Needed</span>
                <input v-model.number="creditAmount" min="1" type="number">
              </label>
              <div class="estimated-cost">
                <span>Estimated Cost</span>
                <strong>PKR {{ estimatedCost.toLocaleString() }}</strong>
              </div>
            </div>

            <p class="instruction-text">{{ payment.instructions }}</p>
          </section>

          <section class="billing-card">
            <div class="card-header">
              <div>
                <h2>Credit Transactions</h2>
                <p>Audit trail of credits added and credits used by orders.</p>
              </div>
            </div>

            <div class="transactions-wrap">
              <table class="transactions-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Order</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="transactionsLoading">
                    <tr v-for="row in 5" :key="row">
                      <td v-for="col in 5" :key="col"><span class="skeleton"></span></td>
                    </tr>
                  </template>
                  <tr v-else-if="transactions.length === 0">
                    <td colspan="5" class="empty-cell">No credit transactions yet.</td>
                  </tr>
                  <tr v-else v-for="transaction in transactions" :key="transaction.id">
                    <td>{{ formatDate(transaction.created_at) }}</td>
                    <td>
                      <span :class="['type-badge', transaction.type]">{{ transaction.type }}</span>
                    </td>
                    <td class="amount-cell">{{ transaction.type === 'debit' ? '-' : '+' }}{{ transaction.amount }}</td>
                    <td>{{ transaction.reason || '—' }}</td>
                    <td>{{ transaction.meta?.order_name || transaction.order_id || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <footer v-if="pagination && pagination.total_pages > 1" class="pager">
              <button type="button" :disabled="!pagination.has_prev || transactionsLoading" @click="changePage(pagination.current_page - 1)">
                Previous
              </button>
              <span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span>
              <button type="button" :disabled="!pagination.has_next || transactionsLoading" @click="changePage(pagination.current_page + 1)">
                Next
              </button>
            </footer>
          </section>
        </main>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import BillingService from '../../services/BillingService';
import { useAuthStore } from '../../stores/authStore';

const authStore = useAuthStore();
const loading = ref(false);
const transactionsLoading = ref(false);
const transactions = ref([]);
const pagination = ref(null);
const page = ref(1);
const creditAmount = ref(100);
const summary = ref({
  total_credits: 0,
  used_credits: 0,
  remaining_credits: 0,
  remaining_percentage: 0,
  is_low: false,
  is_exhausted: false,
  price_per_credit: 5,
});
const payment = ref({
  instructions: 'Send payment via EasyPaisa, JazzCash, or bank transfer, then share the screenshot on WhatsApp for manual credit top-up.',
});

const summaryCards = computed(() => [
  { key: 'remaining', label: 'Remaining', value: formatNumber(summary.value.remaining_credits) },
  { key: 'total', label: 'Total Credits', value: formatNumber(summary.value.total_credits) },
  { key: 'used', label: 'Used Credits', value: formatNumber(summary.value.used_credits) },
  { key: 'price', label: 'Price / Credit', value: `PKR ${formatNumber(summary.value.price_per_credit || 5)}` },
]);
const estimatedCost = computed(() => Number(creditAmount.value || 0) * Number(summary.value.price_per_credit || 5));

const formatNumber = value => Number(value || 0).toLocaleString();

const loadSummary = async () => {
  loading.value = true;
  try {
    const response = await BillingService.getSummary();
    summary.value = response.data.data.summary;
    payment.value = response.data.data.payment;
    await authStore.fetchUser();
  } finally {
    loading.value = false;
  }
};

const loadTransactions = async () => {
  transactionsLoading.value = true;
  try {
    const response = await BillingService.getTransactions({ page: page.value, per_page: 20 });
    transactions.value = response.data.data.transactions;
    pagination.value = response.data.data.pagination;
  } finally {
    transactionsLoading.value = false;
  }
};

const loadBilling = async () => {
  await Promise.all([loadSummary(), loadTransactions()]);
};

const changePage = async (nextPage) => {
  page.value = nextPage;
  await loadTransactions();
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

onMounted(loadBilling);
</script>

<style scoped>
.settings-wrapper {
  min-height: 100vh;
  background: #f1f5f9;
}

.settings-body {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 28px;
}

.billing-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.billing-card {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h1,
.card-header h2 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
  font-weight: 800;
}

.card-header h2 {
  font-size: 18px;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.refresh-btn,
.pager button {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 9px 13px;
}

.refresh-btn:disabled,
.pager button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 24px 28px 10px;
}

.summary-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  padding: 18px;
}

.summary-card p,
.estimated-cost span,
.calculator-field span {
  display: block;
  margin: 0 0 7px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-card strong,
.estimated-cost strong {
  color: #172554;
  font-size: 24px;
  font-weight: 900;
}

.credit-meter {
  padding: 10px 28px 26px;
}

.meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.meter-track {
  overflow: hidden;
  height: 10px;
  border-radius: 999px;
  background: #e2e8f0;
}

.meter-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #3b82f6;
}

.topup-grid {
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(180px, 1fr);
  gap: 18px;
  padding: 24px 28px 10px;
}

.calculator-field input {
  width: 100%;
  height: 42px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #1e293b;
  font-size: 15px;
  padding: 0 12px;
}

.calculator-field input:focus {
  border-color: #1e293b;
  outline: none;
}

.instruction-text {
  margin: 0;
  padding: 0 28px 24px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.transactions-wrap {
  width: 100%;
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 13px 18px;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  text-transform: uppercase;
}

td {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
  font-size: 14px;
}

.type-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.type-badge.credit {
  background: #dcfce7;
  color: #166534;
}

.type-badge.debit {
  background: #fee2e2;
  color: #991b1b;
}

.amount-cell {
  color: #1e293b;
  font-weight: 800;
}

.empty-cell {
  height: 140px;
  color: #64748b;
  text-align: center;
}

.skeleton {
  display: block;
  width: 82%;
  height: 14px;
  border-radius: 4px;
  background: #e2e8f0;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 900px) {
  .settings-body {
    flex-direction: column;
  }

  .summary-grid,
  .topup-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 620px) {
  .settings-body {
    padding: 20px 16px;
  }

  .summary-grid,
  .topup-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }
}
</style>
