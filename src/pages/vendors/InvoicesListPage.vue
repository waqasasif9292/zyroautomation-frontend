<template>
  <AppLayout>
    <transition name="toast-fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
    <main class="vendor-page">
      <section class="vendor-panel">
        <header class="vendor-header"><div><h1>Invoices</h1><p>All purchase invoices from your vendors.</p></div><button class="primary-btn" @click="openCreate">+ Add Invoice</button></header>
        <section class="stats-grid"><article><span>Total Unpaid</span><strong>PKR {{ money(summary.total_unpaid) }}</strong></article><article><span>Partially Paid</span><strong>PKR {{ money(summary.partially_paid) }}</strong></article><article><span>Paid This Month</span><strong>PKR {{ money(summary.paid_this_month) }}</strong></article></section>
        <div class="filter-bar"><select v-model="filters.vendor_id" @change="fetchInvoices(1)"><option value="">All Vendors</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select><select v-model="filters.status" @change="fetchInvoices(1)"><option value="">All Statuses</option><option value="unpaid">Unpaid</option><option value="partially_paid">Partially Paid</option><option value="paid">Paid</option></select><input v-model="filters.search" placeholder="Search invoice or vendor" @input="debouncedSearch"></div>
        <div class="table-wrap"><table class="vendor-table"><thead><tr><th>Invoice #</th><th>Vendor</th><th>Date</th><th>Due Date</th><th>Items</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          <tr v-if="loading" v-for="row in 5" :key="row"><td v-for="col in 10" :key="col"><span class="skeleton"></span></td></tr>
          <tr v-else-if="invoices.length === 0"><td colspan="10" class="empty-cell"><strong>No invoices yet</strong><button class="primary-btn" @click="openCreate">Add Invoice</button></td></tr>
          <tr v-else v-for="invoice in invoices" :key="invoice.id" @click="openDetail(invoice)"><td>{{ invoice.invoice_number || '—' }}</td><td>{{ invoice.vendor_name || '—' }}</td><td>{{ date(invoice.invoice_date) }}</td><td :class="{ 'balance-due': isOverdue(invoice) }">{{ date(invoice.due_date) }} <span v-if="isOverdue(invoice)">Overdue</span></td><td>{{ invoice.items?.length || 0 }}</td><td>PKR {{ money(invoice.total_amount) }}</td><td class="paid">PKR {{ money(invoice.paid_amount) }}</td><td :class="invoice.balance > 0 ? 'balance-due' : 'balance-clear'">PKR {{ money(invoice.balance) }}</td><td><VendorStatusBadge :status="invoice.status" /></td><td @click.stop><div class="actions"><button @click="openDetail(invoice)">View</button><button @click="openEdit(invoice)">Edit</button><button @click="confirmDelete(invoice)">Delete</button></div></td></tr>
        </tbody></table></div>
        <footer v-if="pagination.total_pages > 1" class="pager"><button :disabled="!pagination.has_prev || loading" @click="fetchInvoices(pagination.current_page - 1)">Previous</button><span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span><button :disabled="!pagination.has_next || loading" @click="fetchInvoices(pagination.current_page + 1)">Next</button></footer>
      </section>
    </main>
    <InvoiceFormPanel :show="formOpen" :invoice="selectedInvoice" :vendors="vendors" :saving="saving" @close="closePanels" @save="saveInvoice" />
    <PaymentFormPanel :show="paymentOpen" :vendors="vendors" :invoices="invoices" :vendor-id="selectedInvoice?.vendor_id || ''" :invoice-id="selectedInvoice?.id || ''" :saving="saving" @close="paymentOpen = false" @save="savePayment" />
    <VendorDetailPanel :show="detailOpen" type="invoice" :record="selectedInvoice || {}" :payments="invoicePayments" @close="detailOpen = false" @add-payment="openPayment" />
    <ConfirmDialog :show="deleteOpen" title="Delete Invoice?" message="This invoice will be removed if it has no linked payments." :details="selectedInvoice?.invoice_number || 'Invoice'" eyebrow="Invoice" confirmText="Delete Invoice" cancelText="Keep Invoice" variant="danger" :loading="saving" @cancel="deleteOpen = false" @confirm="deleteInvoice" />
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import AppLayout from '../../layouts/AppLayout.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge.vue';
import InvoiceFormPanel from '../../components/vendors/InvoiceFormPanel.vue';
import PaymentFormPanel from '../../components/vendors/PaymentFormPanel.vue';
import VendorDetailPanel from '../../components/vendors/VendorDetailPanel.vue';
import VendorService from '../../services/VendorService';
import VendorInvoiceService from '../../services/VendorInvoiceService';
import VendorPaymentService from '../../services/VendorPaymentService';

const vendors = ref([]);
const invoices = ref([]);
const invoicePayments = ref([]);
const summary = reactive({});
const pagination = reactive({ current_page: 1, total_pages: 1 });
const filters = reactive({ vendor_id: '', status: '', search: '' });
const loading = ref(false);
const saving = ref(false);
const formOpen = ref(false);
const detailOpen = ref(false);
const paymentOpen = ref(false);
const deleteOpen = ref(false);
const selectedInvoice = ref(null);
const toast = ref('');
let searchTimer = null;

const money = value => Number(value || 0).toLocaleString();
const date = value => value ? new Date(value).toLocaleDateString('en-GB') : '—';
const showToast = message => { toast.value = message; setTimeout(() => { toast.value = ''; }, 3000); };
const isOverdue = invoice => invoice.due_date && invoice.status !== 'paid' && new Date(invoice.due_date) < new Date(new Date().toDateString());
const debouncedSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => fetchInvoices(1), 400); };

const fetchVendors = async () => { vendors.value = (await VendorService.list({ per_page: 100 })).data.data.vendors; };
const fetchInvoices = async (page = 1) => {
  loading.value = true;
  try {
    const res = await VendorInvoiceService.list({ ...filters, page, per_page: 20 });
    invoices.value = res.data.data.invoices;
    Object.assign(summary, res.data.data.summary);
    Object.assign(pagination, res.data.data.pagination);
  } finally { loading.value = false; }
};
const openCreate = () => { selectedInvoice.value = null; formOpen.value = true; };
const openEdit = invoice => { selectedInvoice.value = invoice; formOpen.value = true; };
const openDetail = async (invoice) => { selectedInvoice.value = invoice; detailOpen.value = true; const res = await VendorInvoiceService.get(invoice.id); selectedInvoice.value = res.data.data.invoice; invoicePayments.value = res.data.data.payments; };
const openPayment = invoice => { selectedInvoice.value = invoice; paymentOpen.value = true; };
const closePanels = () => { formOpen.value = false; selectedInvoice.value = null; };
const confirmDelete = invoice => { selectedInvoice.value = invoice; deleteOpen.value = true; };
const saveInvoice = async (payload) => { saving.value = true; try { selectedInvoice.value?.id ? await VendorInvoiceService.update(selectedInvoice.value.id, payload) : await VendorInvoiceService.create(payload); closePanels(); showToast('Invoice saved.'); await fetchInvoices(pagination.current_page); } catch (e) { showToast(e.response?.data?.message || 'Failed to save invoice.'); } finally { saving.value = false; } };
const savePayment = async (payload) => { saving.value = true; try { await VendorPaymentService.create(payload); paymentOpen.value = false; showToast('Payment saved.'); await fetchInvoices(pagination.current_page); if (selectedInvoice.value?.id) await openDetail(selectedInvoice.value); } catch (e) { showToast(e.response?.data?.message || 'Failed to save payment.'); } finally { saving.value = false; } };
const deleteInvoice = async () => { saving.value = true; try { await VendorInvoiceService.delete(selectedInvoice.value.id); deleteOpen.value = false; showToast('Invoice deleted.'); await fetchInvoices(pagination.current_page); } catch (e) { showToast(e.response?.data?.message || 'Failed to delete invoice.'); } finally { saving.value = false; } };
onMounted(async () => { await fetchVendors(); await fetchInvoices(); });
</script>

<style scoped>
@import './vendor-pages.css';
.filter-bar { display: grid; grid-template-columns: 220px 180px 1fr; gap: 12px; padding: 0 28px 18px; }
.filter-bar input, .filter-bar select { height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 11px; }
</style>
