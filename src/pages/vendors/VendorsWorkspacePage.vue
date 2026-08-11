<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="vendor-page">
      <section class="vendor-shell">
        <header class="vendor-header">
          <div>
            <h1>Vendors</h1>
            <p>Purchases, vendor expenses, payments, and costing in one place.</p>
          </div>
          <div class="header-actions">
            <button type="button" class="secondary-btn" @click="refreshAll">Refresh</button>
          </div>
        </header>

        <nav class="vendor-tabs">
          <button v-for="tab in tabs" :key="tab.key" type="button" :class="{ active: activeTab === tab.key }" @click="setTab(tab.key)">
            {{ tab.label }}
          </button>
        </nav>

        <section v-if="activeTab === 'overview'" class="tab-panel">
          <div class="stats-grid compact">
            <article><span>Total Pending Balance</span><strong>PKR {{ money(dashboard.summary.total_pending_balance) }}</strong></article>
            <article><span>Not Received Yet</span><strong>{{ dashboard.summary.not_received_bill_count || dashboard.summary.open_bill_count || 0 }}</strong></article>
            <article><span>Vendors</span><strong>{{ dashboard.summary.vendor_count || 0 }}</strong></article>
          </div>

          <div class="overview-grid">
            <section class="data-section">
              <h2>Vendor Pending Balance</h2>
              <table class="vendor-table">
                <thead><tr><th>Vendor</th><th>Pending Balance</th></tr></thead>
                <tbody>
                  <tr v-if="dashboard.vendor_balances.length === 0"><td colspan="2" class="empty-cell">No pending vendor balance</td></tr>
                  <tr v-for="vendor in dashboard.vendor_balances" :key="vendor.vendor_id">
                    <td>{{ vendor.vendor_name }}</td>
                    <td class="balance-due">PKR {{ money(vendor.pending_balance) }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="data-section">
              <h2>Recent Bills</h2>
              <table class="vendor-table">
                <thead><tr><th>Date</th><th>Vendor</th><th>Status</th><th>Total</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr v-if="dashboard.recent_orders.length === 0"><td colspan="5" class="empty-cell">No bills yet</td></tr>
                  <tr v-for="order in dashboard.recent_orders" :key="order.id">
                    <td>{{ date(order.order_date) }}</td>
                    <td>{{ order.vendor_name }}</td>
                    <td><span :class="['status-pill', order.status]">{{ statusLabel(order.status) }}</span></td>
                    <td>PKR {{ money(order.total_amount) }}</td>
                    <td class="notes-cell">{{ order.notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="data-section">
              <h2>Recent Payments</h2>
              <table class="vendor-table">
                <thead><tr><th>Date</th><th>Vendor</th><th>Amount</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr v-if="dashboard.recent_payments.length === 0"><td colspan="4" class="empty-cell">No payments yet</td></tr>
                  <tr v-for="payment in dashboard.recent_payments" :key="payment.id">
                    <td>{{ date(payment.payment_date) }}</td>
                    <td>{{ payment.vendor_name }}</td>
                    <td>PKR {{ money(payment.amount) }}</td>
                    <td class="notes-cell">{{ payment.notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="data-section">
              <h2>Top Vendors</h2>
              <table class="vendor-table">
                <thead><tr><th>Vendor</th><th>Purchase Value</th></tr></thead>
                <tbody>
                  <tr v-if="dashboard.top_vendors.length === 0"><td colspan="2" class="empty-cell">No purchase history</td></tr>
                  <tr v-for="vendor in dashboard.top_vendors" :key="vendor.vendor_id">
                    <td>{{ vendor.vendor_name }}</td>
                    <td>PKR {{ money(vendor.total_purchase) }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </section>

        <section v-if="activeTab === 'vendors'" class="tab-panel">
          <section class="data-section">
            <div class="section-toolbar">
              <h2>Vendor List</h2>
              <div class="toolbar-fields">
                <input v-model="vendorSearch" type="search" placeholder="Search vendors">
                <button type="button" class="primary-btn compact-btn" @click="openVendorModal">New Vendor</button>
              </div>
            </div>
            <table class="vendor-table">
              <thead><tr><th>Name</th><th>Location</th><th>Phone</th><th>Purchase</th><th>Paid</th><th>Balance</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-if="filteredVendors.length === 0"><td colspan="7" class="empty-cell">No vendors found</td></tr>
                <tr v-for="vendor in filteredVendors" :key="vendor.id">
                  <td><button type="button" class="link-btn" @click="openLedger(vendor.id)">{{ vendor.name }}</button></td>
                  <td>{{ vendor.location || '-' }}</td>
                  <td>{{ vendor.phone_number || '-' }}</td>
                  <td>PKR {{ money(vendor.total_purchase) }}</td>
                  <td>PKR {{ money(vendor.total_paid) }}</td>
                  <td :class="vendor.balance > 0 ? 'balance-due' : 'balance-clear'">PKR {{ money(vendor.balance) }}</td>
                  <td class="actions">
                    <button type="button" @click="editVendor(vendor)">Edit</button>
                    <button type="button" @click="deleteVendor(vendor)">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </section>

        <section v-if="activeTab === 'orders'" class="tab-panel">
          <section class="data-section">
            <div class="section-toolbar">
              <h2>Purchase Bills</h2>
              <div class="toolbar-fields">
                <select v-model="orderFilters.status"><option value="">All Statuses</option><option value="pending">Pending</option><option value="received">Received</option></select>
                <select v-model="orderFilters.vendor_id"><option value="">All Vendors</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select>
                <button type="button" class="primary-btn compact-btn" @click="openOrderModal">New Bill</button>
              </div>
            </div>
            <table class="vendor-table">
              <thead><tr><th>Date</th><th>Vendor</th><th>Items</th><th>Status</th><th>Total</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-if="orders.length === 0"><td colspan="7" class="empty-cell">No bills found</td></tr>
                <tr v-for="order in orders" :key="order.id">
                  <td>{{ date(order.order_date) }}</td>
                  <td>{{ order.vendor_name }}</td>
                  <td>{{ order.total_quantity }}</td>
                  <td><span :class="['status-pill', order.status]">{{ statusLabel(order.status) }}</span></td>
                  <td>PKR {{ money(order.total_amount) }}</td>
                  <td class="notes-cell">{{ order.notes || '-' }}</td>
                  <td class="actions">
                    <button v-if="order.status === 'pending'" type="button" class="action-btn receive" @click="markReceived(order)">Receive</button>
                    <button type="button" class="action-btn edit" @click="editOrder(order)">Edit</button>
                    <button type="button" class="action-btn delete" @click="deleteOrder(order)">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-bar" v-if="orderPagination.total_pages > 1">
              <span>Page {{ orderPagination.current_page }} of {{ orderPagination.total_pages }} · {{ orderPagination.total }} bills</span>
              <div>
                <button type="button" class="secondary-btn compact-btn" :disabled="!orderPagination.has_prev || saving" @click="changeOrderPage(orderPagination.current_page - 1)">Previous</button>
                <button type="button" class="secondary-btn compact-btn" :disabled="!orderPagination.has_next || saving" @click="changeOrderPage(orderPagination.current_page + 1)">Next</button>
              </div>
            </div>
          </section>
        </section>

        <section v-if="activeTab === 'payments'" class="tab-panel">
          <section class="data-section">
            <div class="section-toolbar">
              <h2>Payment History</h2>
              <button type="button" class="primary-btn compact-btn" @click="openPaymentModal">New Payment</button>
            </div>
            <table class="vendor-table">
              <thead><tr><th>Date</th><th>Vendor</th><th>Amount</th><th>Account</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-if="payments.length === 0"><td colspan="6" class="empty-cell">No payments yet</td></tr>
                <tr v-for="payment in payments" :key="payment.id">
                  <td>{{ date(payment.payment_date) }}</td>
                  <td>{{ payment.vendor_name }}</td>
                  <td>PKR {{ money(payment.amount) }}</td>
                  <td>{{ payment.account || '-' }}</td>
                  <td class="notes-cell">{{ payment.notes || '-' }}</td>
                  <td class="actions">
                    <button type="button" class="action-btn edit" @click="editPayment(payment)">Edit</button>
                    <button type="button" class="action-btn delete" @click="deletePayment(payment)">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-bar" v-if="paymentPagination.total_pages > 1">
              <span>Page {{ paymentPagination.current_page }} of {{ paymentPagination.total_pages }} · {{ paymentPagination.total }} payments</span>
              <div>
                <button type="button" class="secondary-btn compact-btn" :disabled="!paymentPagination.has_prev || saving" @click="changePaymentPage(paymentPagination.current_page - 1)">Previous</button>
                <button type="button" class="secondary-btn compact-btn" :disabled="!paymentPagination.has_next || saving" @click="changePaymentPage(paymentPagination.current_page + 1)">Next</button>
              </div>
            </div>
          </section>
        </section>

        <section v-if="activeTab === 'ledger'" class="tab-panel">
          <div class="section-toolbar">
            <h2>Vendor Ledger</h2>
            <select v-model="ledgerVendorId" @change="fetchLedger">
              <option value="">Select vendor</option>
              <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option>
            </select>
          </div>
          <div v-if="ledger.summary" class="stats-grid compact">
            <article><span>Total Bills</span><strong>PKR {{ money(ledger.summary.total_purchase) }}</strong></article>
            <article><span>Total Payments</span><strong>PKR {{ money(ledger.summary.total_paid) }}</strong></article>
            <article><span>Remaining Balance</span><strong>PKR {{ money(ledger.summary.balance) }}</strong></article>
          </div>
          <table class="vendor-table">
            <thead><tr><th>Date</th><th>Entry</th><th>Details</th><th>Bill Amount</th><th>Paid Amount</th><th>Remaining Balance</th></tr></thead>
            <tbody>
              <tr v-if="ledger.entries.length === 0"><td colspan="6" class="empty-cell">{{ ledgerEmptyMessage }}</td></tr>
              <tr v-for="entry in ledger.entries" :key="`${entry.type}-${entry.id}`">
                <td>{{ date(entry.date) }}</td>
                <td>{{ ledgerEntryLabel(entry.type) }}</td>
                <td>{{ entry.description }}</td>
                <td>PKR {{ money(entry.debit) }}</td>
                <td>PKR {{ money(entry.credit) }}</td>
                <td>PKR {{ money(entry.balance) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-if="activeTab === 'average-cost'" class="tab-panel">
          <form class="cost-form" @submit.prevent="calculateAverageCost">
            <label>Product<select v-model="costForm.product_id" required><option value="">Select product</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option></select></label>
            <label>Start Date<input v-model="costForm.start_date" type="date"></label>
            <label>End Date<input v-model="costForm.end_date" type="date"></label>
            <button type="submit" class="primary-btn" :disabled="saving">Calculate</button>
          </form>
          <div v-if="averageCost.product" class="stats-grid compact">
            <article><span>Average Cost</span><strong>PKR {{ money(averageCost.average_cost) }}</strong></article>
            <article><span>Last Purchase</span><strong>PKR {{ money(averageCost.last_purchase_cost) }}</strong></article>
            <article><span>Purchased Qty</span><strong>{{ averageCost.total_quantity }}</strong></article>
          </div>
          <table class="vendor-table">
            <thead><tr><th>Date</th><th>Vendor</th><th>Quantity</th><th>Unit Cost</th><th>Total</th></tr></thead>
            <tbody>
              <tr v-if="averageCost.history.length === 0"><td colspan="5" class="empty-cell">No purchase history selected</td></tr>
              <tr v-for="row in averageCost.history" :key="row.order_id">
                <td>{{ date(row.order_date) }}</td>
                <td>{{ row.vendor_name }}</td>
                <td>{{ row.quantity }}</td>
                <td>PKR {{ money(row.cost_per_unit) }}</td>
                <td>PKR {{ money(row.line_total) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>
    </main>

    <div v-if="vendorModalOpen" class="modal-backdrop" @click.self="closeVendorModal">
      <form class="vendor-modal" @submit.prevent="saveVendor">
        <header class="modal-header">
          <div>
            <h2>{{ vendorForm.id ? 'Edit Vendor' : 'New Vendor' }}</h2>
            <p>Save supplier contact and account details.</p>
          </div>
          <button type="button" class="modal-close" aria-label="Close vendor modal" @click="closeVendorModal">x</button>
        </header>
        <div class="modal-body">
          <label>Name<input v-model="vendorForm.name" required autofocus></label>
          <label>Location<input v-model="vendorForm.location"></label>
          <label>Phone Number<input v-model="vendorForm.phone_number"></label>
          <label>Account Details<textarea v-model="vendorForm.account_details" rows="4"></textarea></label>
          <label>Notes<textarea v-model="vendorForm.notes" rows="3"></textarea></label>
        </div>
        <footer class="modal-actions">
          <button type="button" class="secondary-btn" @click="closeVendorModal">Cancel</button>
          <button type="submit" class="primary-btn" :disabled="saving">{{ vendorForm.id ? 'Update Vendor' : 'Save Vendor' }}</button>
        </footer>
      </form>
    </div>

    <div v-if="orderModalOpen" class="modal-backdrop" @click.self="closeOrderModal">
      <form class="vendor-modal order-modal" @submit.prevent="saveOrder">
        <header class="modal-header">
          <div>
            <h2>{{ orderForm.id ? 'Edit Bill' : 'New Bill' }}</h2>
            <p>Record purchase products or custom vendor expenses.</p>
          </div>
          <button type="button" class="modal-close" aria-label="Close bill modal" @click="closeOrderModal">x</button>
        </header>
        <div class="modal-body">
          <div class="modal-grid">
            <label>Vendor<select v-model="orderForm.vendor_id" required><option value="" disabled>Select vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
            <label>Order Date<input v-model="orderForm.order_date" type="date" required></label>
          </div>
          <div class="line-editor">
            <div v-for="(item, index) in orderForm.items" :key="index" :class="['line-row', { expense: item.line_type === 'expense' }]">
              <select v-model="item.line_type" @change="syncLineType(item)">
                <option value="product">Product</option>
                <option value="expense">Expense</option>
              </select>
              <select v-if="item.line_type === 'product'" v-model="item.product_id" :required="lineRequiresDetails(item)">
                <option value="" disabled>Select product</option>
                <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
              </select>
              <input v-else v-model="item.description" :required="lineRequiresDetails(item)" placeholder="Expense description">
              <input v-if="item.line_type === 'product'" v-model.number="item.quantity" type="number" min="1" placeholder="Qty" required>
              <input v-model.number="item.cost_per_unit" type="number" min="0" step="0.01" :placeholder="item.line_type === 'expense' ? 'Amount' : 'Cost'" required>
              <strong>PKR {{ money(lineTotal(item)) }}</strong>
              <button type="button" class="icon-btn" @click="removeLine(index)">x</button>
            </div>
            <div class="line-actions">
              <button type="button" class="secondary-btn" @click="addProductLine">Add Product</button>
              <button type="button" class="secondary-btn" @click="addExpenseLine">Add Expense</button>
            </div>
          </div>
          <label>Notes<textarea v-model="orderForm.notes" rows="3"></textarea></label>
          <div class="total-row"><span>Total</span><strong>PKR {{ money(orderTotal) }}</strong></div>
        </div>
        <footer class="modal-actions">
          <button type="button" class="secondary-btn" @click="closeOrderModal">Cancel</button>
          <button type="submit" class="primary-btn" :disabled="saving || vendors.length === 0 || orderTotal <= 0">{{ orderForm.id ? 'Update Bill' : 'Save Bill' }}</button>
        </footer>
      </form>
    </div>

    <div v-if="paymentModalOpen" class="modal-backdrop" @click.self="closePaymentModal">
      <form class="vendor-modal" @submit.prevent="savePayment">
        <header class="modal-header">
          <div>
            <h2>{{ paymentForm.id ? 'Edit Payment' : 'Record Payment' }}</h2>
            <p>Record a vendor payment.</p>
          </div>
          <button type="button" class="modal-close" aria-label="Close payment modal" @click="closePaymentModal">x</button>
        </header>
        <div class="modal-body">
          <label>Vendor<select v-model="paymentForm.vendor_id" required><option value="" disabled>Select vendor</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label>
          <div v-if="selectedPaymentVendor" class="payment-balance">
            <span>Pending Balance</span>
            <strong :class="selectedPaymentVendor.balance > 0 ? 'balance-due' : 'balance-clear'">PKR {{ money(selectedPaymentVendor.balance) }}</strong>
          </div>
          <div class="modal-grid">
            <label>Payment Date<input v-model="paymentForm.payment_date" type="date" required></label>
            <label>Amount<input v-model.number="paymentForm.amount" type="number" min="0.01" step="0.01" required></label>
          </div>
          <label>Account<input v-model="paymentForm.account" placeholder="Cash, bank, JazzCash"></label>
          <label>Notes<textarea v-model="paymentForm.notes" rows="3"></textarea></label>
        </div>
        <footer class="modal-actions">
          <button type="button" class="secondary-btn" @click="closePaymentModal">Cancel</button>
          <button type="submit" class="primary-btn" :disabled="saving || vendors.length === 0">{{ paymentForm.id ? 'Update Payment' : 'Save Payment' }}</button>
        </footer>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProductService from '../../services/ProductService';
import VendorService from '../../services/VendorService';
import VendorOrderService from '../../services/VendorOrderService';
import VendorPaymentService from '../../services/VendorPaymentService';

const route = useRoute();
const router = useRouter();
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'vendors', label: 'Vendors' },
  { key: 'orders', label: 'Bills' },
  { key: 'payments', label: 'Payments' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'average-cost', label: 'Average Cost' },
];

const today = () => new Date().toISOString().slice(0, 10);
const activeTab = ref(route.meta.vendorTab || 'overview');
const saving = ref(false);
const toast = ref('');
const vendorModalOpen = ref(false);
const orderModalOpen = ref(false);
const paymentModalOpen = ref(false);
const vendors = ref([]);
const orders = ref([]);
const payments = ref([]);
const products = ref([]);
const vendorSearch = ref('');
const orderFilters = reactive({ vendor_id: '', status: '' });
const orderPagination = reactive({ current_page: 1, per_page: 25, total: 0, total_pages: 1, has_next: false, has_prev: false });
const paymentPagination = reactive({ current_page: 1, per_page: 25, total: 0, total_pages: 1, has_next: false, has_prev: false });
const ledgerVendorId = ref('');
const dashboard = reactive({
  summary: {},
  recent_orders: [],
  recent_payments: [],
  top_vendors: [],
  vendor_balances: [],
});
const ledger = reactive({ vendor: null, summary: null, entries: [] });
const averageCost = reactive({ product: null, total_quantity: 0, total_cost: 0, average_cost: 0, last_purchase_cost: 0, history: [] });

const vendorForm = reactive({ id: '', name: '', location: '', phone_number: '', account_details: '', notes: '' });
const blankProductLine = () => ({ line_type: 'product', product_id: '', description: '', quantity: 1, cost_per_unit: 0 });
const blankExpenseLine = () => ({ line_type: 'expense', product_id: '', description: '', quantity: 1, cost_per_unit: 0 });
const orderForm = reactive({ id: '', vendor_id: '', order_date: today(), items: [blankProductLine()], notes: '' });
const paymentForm = reactive({ id: '', vendor_id: '', payment_date: today(), amount: '', account: '', notes: '' });
const costForm = reactive({ product_id: '', start_date: today(), end_date: today() });

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const money = (value) => Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
const date = (value) => value ? new Date(value).toLocaleDateString('en-PK') : '-';
const statusLabel = (status) => status === 'received' ? 'Received' : 'Not Received Yet';
const ledgerEntryLabel = (type) => type === 'payment' ? 'Payment Made' : 'Bill Added';
const lineTotal = (item) => (item.line_type === 'expense' ? 1 : Number(item.quantity || 0)) * Number(item.cost_per_unit || 0);
const lineRequiresDetails = (item) => lineTotal(item) > 0;
const orderTotal = computed(() => orderForm.items.reduce((sum, item) => sum + lineTotal(item), 0));

const filteredVendors = computed(() => {
  const query = vendorSearch.value.trim().toLowerCase();
  if (!query) return vendors.value;
  return vendors.value.filter(vendor => [vendor.name, vendor.location, vendor.phone_number].some(value => String(value || '').toLowerCase().includes(query)));
});

const selectedPaymentVendor = computed(() => vendors.value.find(vendor => vendor.id === paymentForm.vendor_id) || null);
const ledgerEmptyMessage = computed(() => ledgerVendorId.value ? 'No ledger entries for this vendor yet' : 'Select a vendor to view ledger');

const setTab = (key) => {
  const pathMap = {
    overview: '/vendors',
    vendors: '/vendors/list',
    orders: '/vendors/orders',
    payments: '/vendors/payments',
    ledger: '/vendors/ledger',
    'average-cost': '/vendors/average-cost',
  };
  activeTab.value = key;
  router.push(pathMap[key]);
};

watch(() => route.meta.vendorTab, (tab) => {
  activeTab.value = tab || 'overview';
});

watch(() => [orderFilters.vendor_id, orderFilters.status], () => {
  orderPagination.current_page = 1;
  fetchOrders();
});

const fetchVendors = async () => {
  vendors.value = (await VendorService.list({ per_page: 100 })).data.data.vendors;
};

const fetchOrders = async () => {
  const res = await VendorOrderService.list({
    page: orderPagination.current_page,
    per_page: orderPagination.per_page,
    vendor_id: orderFilters.vendor_id || undefined,
    status: orderFilters.status || undefined,
  });
  orders.value = res.data.data.orders;
  Object.assign(orderPagination, res.data.data.pagination || {});
  if (orderPagination.total_pages > 0 && orderPagination.current_page > orderPagination.total_pages) {
    orderPagination.current_page = orderPagination.total_pages;
    await fetchOrders();
  }
};

const fetchPayments = async () => {
  const res = await VendorPaymentService.list({
    page: paymentPagination.current_page,
    per_page: paymentPagination.per_page,
  });
  payments.value = res.data.data.payments;
  Object.assign(paymentPagination, res.data.data.pagination || {});
  if (paymentPagination.total_pages > 0 && paymentPagination.current_page > paymentPagination.total_pages) {
    paymentPagination.current_page = paymentPagination.total_pages;
    await fetchPayments();
  }
};

const changeOrderPage = async (page) => {
  if (page < 1 || page === orderPagination.current_page || saving.value) return;
  orderPagination.current_page = page;
  await fetchOrders();
};

const changePaymentPage = async (page) => {
  if (page < 1 || page === paymentPagination.current_page || saving.value) return;
  paymentPagination.current_page = page;
  await fetchPayments();
};

const fetchProducts = async () => {
  products.value = (await ProductService.getProducts({ per_page: 100 })).data.data.products;
};

const fetchDashboard = async () => {
  const res = await VendorService.dashboard();
  Object.assign(dashboard, {
    summary: res.data.data.summary || {},
    recent_orders: res.data.data.recent_orders || [],
    recent_payments: res.data.data.recent_payments || [],
    top_vendors: res.data.data.top_vendors || [],
    vendor_balances: res.data.data.vendor_balances || [],
  });
};

const refreshAll = async () => {
  await Promise.all([fetchVendors(), fetchOrders(), fetchPayments(), fetchProducts(), fetchDashboard()]);
  if (ledgerVendorId.value) await fetchLedger();
};

const resetVendorForm = () => Object.assign(vendorForm, { id: '', name: '', location: '', phone_number: '', account_details: '', notes: '' });
const openVendorModal = () => {
  resetVendorForm();
  vendorModalOpen.value = true;
};
const closeVendorModal = () => {
  if (saving.value) return;
  vendorModalOpen.value = false;
  resetVendorForm();
};
const editVendor = (vendor) => {
  Object.assign(vendorForm, {
    id: vendor.id,
    name: vendor.name || '',
    location: vendor.location || '',
    phone_number: vendor.phone_number || '',
    account_details: vendor.account_details || '',
    notes: vendor.notes || '',
  });
  vendorModalOpen.value = true;
};

const saveVendor = async () => {
  saving.value = true;
  try {
    const payload = { name: vendorForm.name, location: vendorForm.location, phone_number: vendorForm.phone_number, account_details: vendorForm.account_details, notes: vendorForm.notes };
    vendorForm.id ? await VendorService.update(vendorForm.id, payload) : await VendorService.create(payload);
    resetVendorForm();
    vendorModalOpen.value = false;
    await refreshAll();
    showToast('Vendor saved.');
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to save vendor.');
  } finally {
    saving.value = false;
  }
};

const deleteVendor = async (vendor) => {
  if (!window.confirm(`Delete ${vendor.name}?`)) return;
  saving.value = true;
  try {
    await VendorService.delete(vendor.id);
    await refreshAll();
    showToast('Vendor deleted.');
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to delete vendor.');
  } finally {
    saving.value = false;
  }
};

const addProductLine = () => orderForm.items.push(blankProductLine());
const addExpenseLine = () => orderForm.items.push(blankExpenseLine());
const removeLine = (index) => {
  if (orderForm.items.length === 1) {
    Object.assign(orderForm.items[0], blankProductLine());
    return;
  }

  orderForm.items.splice(index, 1);
};
const syncLineType = (item) => {
  if (item.line_type === 'expense') {
    item.product_id = '';
    item.quantity = 1;
    return;
  }

  item.description = '';
};
const resetOrderForm = () => Object.assign(orderForm, { id: '', vendor_id: '', order_date: today(), items: [blankProductLine()], notes: '' });
const openOrderModal = () => {
  resetOrderForm();
  orderModalOpen.value = true;
};
const closeOrderModal = () => {
  if (saving.value) return;
  orderModalOpen.value = false;
  resetOrderForm();
};
const editOrder = (order) => {
  Object.assign(orderForm, {
    id: order.id,
    vendor_id: order.vendor_id,
    order_date: order.order_date || today(),
    items: order.items.map(item => ({
      line_type: item.line_type || (item.product_id ? 'product' : 'expense'),
      product_id: item.product_id || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      cost_per_unit: item.cost_per_unit || 0,
    })),
    notes: order.notes || '',
  });
  orderModalOpen.value = true;
};

const saveOrder = async () => {
  saving.value = true;
  try {
    const payload = {
      vendor_id: orderForm.vendor_id,
      order_date: orderForm.order_date,
      items: orderForm.items.map(item => ({
        line_type: item.line_type,
        product_id: item.line_type === 'product' ? item.product_id : null,
        description: item.line_type === 'expense' ? item.description : null,
        quantity: item.line_type === 'expense' ? 1 : item.quantity,
        cost_per_unit: item.cost_per_unit,
      })),
      notes: orderForm.notes,
    };
    orderForm.id ? await VendorOrderService.update(orderForm.id, payload) : await VendorOrderService.create(payload);
    resetOrderForm();
    orderModalOpen.value = false;
    await refreshAll();
    showToast('Bill saved.');
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to save bill.');
  } finally {
    saving.value = false;
  }
};

const markReceived = async (order) => {
  saving.value = true;
  try {
    await VendorOrderService.markReceived(order.id);
    await refreshAll();
    showToast('Bill marked received.');
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to mark received.');
  } finally {
    saving.value = false;
  }
};

const deleteOrder = async (order) => {
  if (!window.confirm('Delete this bill?')) return;
  saving.value = true;
  try {
    await VendorOrderService.delete(order.id);
    await refreshAll();
    showToast('Bill deleted.');
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to delete bill.');
  } finally {
    saving.value = false;
  }
};

const resetPaymentForm = () => Object.assign(paymentForm, { id: '', vendor_id: '', payment_date: today(), amount: '', account: '', notes: '' });
const openPaymentModal = () => {
  resetPaymentForm();
  paymentModalOpen.value = true;
};
const closePaymentModal = () => {
  if (saving.value) return;
  paymentModalOpen.value = false;
  resetPaymentForm();
};
const editPayment = (payment) => {
  Object.assign(paymentForm, {
    id: payment.id,
    vendor_id: payment.vendor_id,
    payment_date: payment.payment_date || today(),
    amount: payment.amount || '',
    account: payment.account || '',
    notes: payment.notes || '',
  });
  paymentModalOpen.value = true;
};
const savePayment = async () => {
  saving.value = true;
  try {
    const payload = {
      vendor_id: paymentForm.vendor_id,
      payment_date: paymentForm.payment_date,
      amount: paymentForm.amount,
      account: paymentForm.account,
      notes: paymentForm.notes,
    };
    paymentForm.id ? await VendorPaymentService.update(paymentForm.id, payload) : await VendorPaymentService.create(payload);
    resetPaymentForm();
    paymentModalOpen.value = false;
    await refreshAll();
    showToast('Payment saved.');
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to save payment.');
  } finally {
    saving.value = false;
  }
};

const deletePayment = async (payment) => {
  if (!window.confirm('Delete this payment?')) return;
  saving.value = true;
  try {
    await VendorPaymentService.delete(payment.id);
    await refreshAll();
    showToast('Payment deleted.');
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to delete payment.');
  } finally {
    saving.value = false;
  }
};

const openLedger = async (vendorId) => {
  ledgerVendorId.value = vendorId;
  setTab('ledger');
  await fetchLedger();
};

const fetchLedger = async () => {
  if (!ledgerVendorId.value) {
    Object.assign(ledger, { vendor: null, summary: null, entries: [] });
    return;
  }
  const res = await VendorService.ledger(ledgerVendorId.value);
  Object.assign(ledger, res.data.data);
};

const calculateAverageCost = async () => {
  saving.value = true;
  try {
    const res = await VendorService.averageCost({
      product_id: costForm.product_id,
      start_date: costForm.start_date || undefined,
      end_date: costForm.end_date || undefined,
    });
    Object.assign(averageCost, res.data.data);
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to calculate average cost.');
  } finally {
    saving.value = false;
  }
};

onMounted(refreshAll);
</script>

<style scoped>
.vendor-page {
  min-height: 100vh;
  padding: 32px;
  background: #eef3f8;
}

.vendor-shell {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.vendor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.vendor-header h1,
.data-section h2,
.side-form h2,
.section-toolbar h2 {
  margin: 0;
  color: #0f172a;
}

.vendor-header h1 {
  font-size: 22px;
}

.vendor-header p {
  margin: 6px 0 0;
  color: #53657d;
}

.header-actions,
.form-actions,
.actions,
.toolbar-fields {
  display: flex;
  gap: 8px;
  align-items: center;
}

.primary-btn,
.secondary-btn,
.actions button,
.vendor-tabs button,
.link-btn,
.icon-btn {
  border: 0;
  cursor: pointer;
  font-weight: 700;
}

.primary-btn {
  background: #172237;
  color: #fff;
  border-radius: 8px;
  padding: 10px 14px;
}

.secondary-btn {
  background: #e8eef6;
  color: #172237;
  border-radius: 8px;
  padding: 10px 14px;
}

.compact-btn {
  min-height: 42px;
  white-space: nowrap;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.vendor-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 20px 0;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.vendor-tabs button {
  padding: 12px 14px;
  color: #52637c;
  background: transparent;
  border-bottom: 3px solid transparent;
}

.vendor-tabs button.active {
  color: #0f172a;
  border-bottom-color: #2563eb;
}

.tab-panel {
  padding: 22px;
}

.grid-panel {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 20px;
}

.wide-form {
  grid-template-columns: 430px minmax(0, 1fr);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.stats-grid.compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stats-grid article {
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 16px 18px;
  background: #fbfdff;
}

.stats-grid span {
  display: block;
  color: #65758b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.stats-grid strong {
  display: block;
  margin-top: 10px;
  color: #07153a;
  font-size: 22px;
}

.split-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.data-section,
.side-form {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.data-section {
  overflow: auto;
}

.data-section h2,
.side-form h2,
.section-toolbar h2 {
  font-size: 16px;
}

.side-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  align-self: start;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #344256;
  font-size: 13px;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #ccd7e5;
  border-radius: 8px;
  padding: 10px 11px;
  color: #0f172a;
  background: #fff;
  font: inherit;
}

textarea {
  resize: vertical;
}

.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.section-toolbar input,
.section-toolbar select,
.toolbar-fields select {
  min-width: 160px;
}

.toolbar-fields input {
  min-width: 260px;
}

.vendor-table {
  width: 100%;
  border-collapse: collapse;
}

.vendor-table th,
.vendor-table td {
  padding: 13px 14px;
  border-bottom: 1px solid #e9eef5;
  text-align: left;
  white-space: nowrap;
  color: #1f2d42;
}

.vendor-table th {
  background: #f8fafc;
  color: #7788a2;
  font-size: 12px;
  text-transform: uppercase;
}

.vendor-table .notes-cell {
  min-width: 180px;
  max-width: 320px;
  white-space: normal;
  line-height: 1.45;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-top: 1px solid #e9eef5;
  color: #64748b;
  font-size: 13px;
}

.pagination-bar div {
  display: flex;
  gap: 8px;
}

.empty-cell {
  color: #64748b;
  text-align: center;
}

.actions button,
.link-btn {
  background: transparent;
  color: #2563eb;
  padding: 4px 2px;
}

.actions .action-btn {
  min-width: 62px;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 7px 10px;
  font-size: 12px;
  line-height: 1;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.actions .action-btn:hover {
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
}

.actions .action-btn.receive {
  background: #ecfdf5;
  border-color: #bbf7d0;
  color: #047857;
}

.actions .action-btn.receive:hover {
  background: #d1fae5;
  border-color: #86efac;
}

.actions .action-btn.edit {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.actions .action-btn.edit:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.actions .action-btn.delete {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}

.actions .action-btn.delete:hover {
  background: #ffe4e6;
  border-color: #fda4af;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
}

.balance-due {
  color: #b45309 !important;
  font-weight: 800;
}

.balance-clear {
  color: #047857 !important;
  font-weight: 800;
}

.payment-balance {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #d8e1ee;
  border-radius: 8px;
  padding: 12px 14px;
  background: #f8fafc;
}

.payment-balance span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.payment-balance strong {
  color: #07153a;
  font-size: 18px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 800;
}

.status-pill.pending {
  background: #fff7ed;
  color: #9a3412;
}

.status-pill.received {
  background: #ecfdf5;
  color: #047857;
}

.line-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.line-row {
  display: grid;
  grid-template-columns: 110px minmax(180px, 1fr) 72px 100px 95px 32px;
  gap: 8px;
  align-items: center;
}

.line-row.expense {
  grid-template-columns: 110px minmax(220px, 1fr) 120px 95px 32px;
}

.line-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.line-row strong,
.total-row strong {
  color: #0f172a;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #e2e8f0;
}

.cost-form {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 180px 180px auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 18px;
}

.toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 20;
  padding: 12px 16px;
  border-radius: 8px;
  background: #172237;
  color: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.48);
}

.vendor-modal {
  width: min(560px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.order-modal {
  width: min(760px, 100%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.modal-header p {
  margin: 5px 0 0;
  color: #64748b;
}

.modal-close {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 8px;
  background: #eef3f8;
  color: #334155;
  cursor: pointer;
  font-weight: 800;
}

.modal-body {
  display: grid;
  gap: 13px;
  padding: 20px 22px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 22px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

@media (max-width: 1100px) {
  .grid-panel,
  .wide-form,
  .split-grid,
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid,
  .stats-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .vendor-page {
    padding: 16px;
  }

  .vendor-header,
  .section-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .vendor-tabs {
    overflow-x: auto;
  }

  .stats-grid,
  .stats-grid.compact,
  .cost-form,
  .modal-grid,
  .line-row,
  .line-row.expense {
    grid-template-columns: 1fr;
  }
}
</style>
