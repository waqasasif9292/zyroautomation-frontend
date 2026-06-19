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
              <div v-if="summary.blocked_orders_count" class="blocked-actions">
                <button
                  type="button"
                  class="recover-btn"
                  :disabled="recoveringBlocked || discardingBlocked"
                  @click="recoverBlockedOrders"
                >
                  {{ recoveringBlocked ? 'Recovering...' : `Recover ${formatNumber(summary.blocked_orders_count)} Blocked Orders` }}
                </button>
                <button
                  type="button"
                  class="discard-btn"
                  :disabled="recoveringBlocked || discardingBlocked"
                  @click="discardBlockedOrders"
                >
                  {{ discardingBlocked ? 'Discarding...' : 'Discard Blocked Orders' }}
                </button>
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
            <p v-if="billingMessage" class="billing-message">{{ billingMessage }}</p>

            <div class="payment-methods" aria-label="Payment account details">
              <article v-for="method in paymentMethods" :key="method.key" class="payment-method">
                <header>
                  <h3>{{ method.name }}</h3>
                  <span>{{ method.type }}</span>
                </header>
                <dl>
                  <template v-for="detail in method.details" :key="`${method.key}-${detail.label}`">
                    <dt>{{ detail.label }}</dt>
                    <dd>
                      <span>{{ detail.value }}</span>
                      <button
                        v-if="detail.copy"
                        type="button"
                        class="copy-detail-btn"
                        @click="copyDetail(detail.value)"
                      >
                        Copy
                      </button>
                    </dd>
                  </template>
                </dl>
              </article>
            </div>
          </section>

          <section class="billing-card">
            <div class="card-header">
              <div>
                <h2>Credit Transactions</h2>
                <p>Audit trail of credits added and credits used by orders.</p>
              </div>
            </div>

            <div class="transactions-toolbar">
              <p>
                Showing {{ transactionRange.from }}-{{ transactionRange.to }} of {{ formatNumber(pagination?.total || 0) }}
              </p>
              <label>
                <span>Rows</span>
                <select v-model.number="perPage" :disabled="transactionsLoading" @change="changePerPage">
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
              </label>
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
              <button type="button" :disabled="!pagination.has_prev || transactionsLoading" @click="changePage(1)">
                First
              </button>
              <button type="button" :disabled="!pagination.has_prev || transactionsLoading" @click="changePage(pagination.current_page - 1)">
                Previous
              </button>
              <div class="page-numbers" aria-label="Transaction pages">
                <button
                  v-for="pageNumber in visiblePages"
                  :key="pageNumber"
                  type="button"
                  :class="{ active: pageNumber === pagination.current_page }"
                  :disabled="transactionsLoading || pageNumber === pagination.current_page"
                  @click="changePage(pageNumber)"
                >
                  {{ pageNumber }}
                </button>
              </div>
              <button type="button" :disabled="!pagination.has_next || transactionsLoading" @click="changePage(pagination.current_page + 1)">
                Next
              </button>
              <button type="button" :disabled="!pagination.has_next || transactionsLoading" @click="changePage(pagination.total_pages)">
                Last
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
const recoveringBlocked = ref(false);
const discardingBlocked = ref(false);
const transactions = ref([]);
const pagination = ref(null);
const billingMessage = ref('');
const page = ref(1);
const perPage = ref(10);
const creditAmount = ref(100);
const summary = ref({
  total_credits: 0,
  used_credits: 0,
  remaining_credits: 0,
  remaining_percentage: 0,
  is_low: false,
  is_exhausted: false,
  blocked_orders_count: 0,
  price_per_credit: 5,
});
const payment = ref({
  instructions: 'Send payment via EasyPaisa, JazzCash, or bank transfer, then share the screenshot on WhatsApp for manual credit top-up.',
});
const paymentMethods = [
  {
    key: 'easypaisa',
    name: 'EasyPaisa',
    type: 'Mobile Wallet',
    details: [
      { label: 'Account Title', value: 'Usman zahid' },
      { label: 'Account Number', value: '03445326522', copy: true },
    ],
  },
  {
    key: 'jazzcash',
    name: 'JazzCash',
    type: 'Mobile Wallet',
    details: [
      { label: 'Account Title', value: 'Usman zahid' },
      { label: 'Account Number', value: '03175133307', copy: true },
    ],
  },
  {
    key: 'askari',
    name: 'Askari Bank Limited',
    type: 'Bank Transfer',
    details: [
      { label: 'Account Title', value: 'M USMAN ZAHID' },
      { label: 'Branch', value: 'Jinnah Avenue Branch' },
      { label: 'Account Number', value: '00080700004173', copy: true },
      { label: 'IBAN', value: 'PK09ASCM0000080700004173', copy: true },
    ],
  },
  {
    key: 'hbl',
    name: 'HBL',
    type: 'Bank Transfer',
    details: [
      { label: 'Account Title', value: 'USMAN ZAHID' },
      { label: 'Branch', value: 'SATELLITE TOWN, RWP' },
      { label: 'Account Number', value: '05047902890603', copy: true },
      { label: 'IBAN', value: 'PK09HABB0005047902890603', copy: true },
    ],
  },
];

const summaryCards = computed(() => [
  { key: 'remaining', label: 'Remaining', value: formatNumber(summary.value.remaining_credits) },
  { key: 'total', label: 'Total Credits', value: formatNumber(summary.value.total_credits) },
  { key: 'used', label: 'Used Credits', value: formatNumber(summary.value.used_credits) },
  { key: 'price', label: 'Price / Credit', value: `PKR ${formatNumber(summary.value.price_per_credit || 5)}` },
]);
const estimatedCost = computed(() => Number(creditAmount.value || 0) * Number(summary.value.price_per_credit || 5));
const transactionRange = computed(() => {
  const total = Number(pagination.value?.total || 0);
  if (!total) return { from: 0, to: 0 };

  const currentPage = Number(pagination.value?.current_page || page.value || 1);
  const size = Number(pagination.value?.per_page || perPage.value || 10);
  const from = ((currentPage - 1) * size) + 1;
  const to = Math.min(currentPage * size, total);

  return { from, to };
});
const visiblePages = computed(() => {
  const totalPages = Number(pagination.value?.total_pages || 1);
  const currentPage = Number(pagination.value?.current_page || page.value || 1);
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  for (let index = adjustedStart; index <= end; index += 1) {
    pages.push(index);
  }

  return pages;
});

const formatNumber = value => Number(value || 0).toLocaleString();

const copyDetail = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
};

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
    const response = await BillingService.getTransactions({ page: page.value, per_page: perPage.value });
    transactions.value = response.data.data.transactions;
    pagination.value = response.data.data.pagination;
  } finally {
    transactionsLoading.value = false;
  }
};

const loadBilling = async () => {
  await Promise.all([loadSummary(), loadTransactions()]);
};

const recoverBlockedOrders = async () => {
  const blockedCount = Number(summary.value.blocked_orders_count || 0);
  const message = blockedCount === 1
    ? 'Recover 1 blocked Shopify order now? This will create the order and use 1 billing credit.'
    : `Recover blocked Shopify orders now? This will create up to ${formatNumber(blockedCount)} orders and use 1 billing credit for each recovered order.`;

  if (!window.confirm(message)) return;

  recoveringBlocked.value = true;
  billingMessage.value = '';

  try {
    const response = await BillingService.recoverBlockedOrders();
    billingMessage.value = response.data?.message || 'Blocked orders recovered.';
    page.value = 1;
    await loadBilling();
  } catch (error) {
    billingMessage.value = error.response?.data?.message || 'Unable to recover blocked orders.';
  } finally {
    recoveringBlocked.value = false;
  }
};

const discardBlockedOrders = async () => {
  const blockedCount = Number(summary.value.blocked_orders_count || 0);
  const message = blockedCount === 1
    ? 'Discard 1 blocked Shopify order? This will permanently remove it from recovery and will not create an order.'
    : `Discard ${formatNumber(blockedCount)} blocked Shopify orders? This will permanently remove them from recovery and will not create orders.`;

  if (!window.confirm(message)) return;

  discardingBlocked.value = true;
  billingMessage.value = '';

  try {
    const response = await BillingService.discardBlockedOrders();
    billingMessage.value = response.data?.message || 'Blocked orders discarded.';
    page.value = 1;
    await loadBilling();
  } catch (error) {
    billingMessage.value = error.response?.data?.message || 'Unable to discard blocked orders.';
  } finally {
    discardingBlocked.value = false;
  }
};

const changePage = async (nextPage) => {
  if (!pagination.value) return;

  const lastPage = Number(pagination.value.total_pages || 1);
  if (nextPage < 1 || nextPage > lastPage || nextPage === page.value) return;

  page.value = nextPage;
  await loadTransactions();
};

const changePerPage = async () => {
  page.value = 1;
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
  background: #f9fafb;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.settings-body {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  max-width: none;
  margin: 28px 0;
  padding: 0 28px;
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
.pager button,
.recover-btn,
.discard-btn {
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
.pager button:disabled,
.recover-btn:disabled,
.discard-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.blocked-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.recover-btn {
  border-color: #1e293b;
  background: #1e293b;
  color: #fff;
}

.discard-btn {
  border-color: #fecaca;
  color: #b91c1c;
}

.discard-btn:hover {
  border-color: #fca5a5;
  background: #fef2f2;
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
  padding: 0 28px 18px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.billing-message {
  margin: -8px 28px 18px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
  font-weight: 800;
  padding: 10px 12px;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 0 28px 28px;
}

.payment-method {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 16px;
}

.payment-method header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.payment-method h3 {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 900;
}

.payment-method header span {
  flex: 0 0 auto;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
}

.payment-method dl {
  display: grid;
  grid-template-columns: minmax(105px, 0.4fr) minmax(0, 1fr);
  gap: 10px 12px;
  margin: 0;
}

.payment-method dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.payment-method dd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  margin: 0;
  color: #1e293b;
  font-size: 13px;
  font-weight: 800;
}

.payment-method dd span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.copy-detail-btn {
  flex: 0 0 auto;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
  padding: 5px 8px;
}

.copy-detail-btn:hover {
  border-color: #94a3b8;
}

.transactions-wrap {
  width: 100%;
  overflow-x: auto;
}

.transactions-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.transactions-toolbar p {
  margin: 0;
}

.transactions-toolbar label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.transactions-toolbar select {
  height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 13px;
  font-weight: 800;
  padding: 0 30px 0 10px;
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
  flex-wrap: wrap;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 13px;
}

.page-numbers {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.page-numbers button {
  min-width: 36px;
  padding: 9px 10px;
}

.page-numbers button.active {
  border-color: #1e293b;
  background: #1e293b;
  color: #fff;
  opacity: 1;
}

@media (max-width: 900px) {
  .settings-body {
    flex-direction: column;
  }

  .summary-grid,
  .topup-grid,
  .payment-methods {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 620px) {
  .settings-body {
    padding: 20px 16px;
  }

  .summary-grid,
  .topup-grid,
  .payment-methods {
    grid-template-columns: 1fr;
  }

  .payment-methods {
    padding: 0 20px 22px;
  }

  .instruction-text {
    padding: 0 20px 18px;
  }

  .billing-message {
    margin: -8px 20px 18px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 20px;
  }

  .transactions-toolbar,
  .pager {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
