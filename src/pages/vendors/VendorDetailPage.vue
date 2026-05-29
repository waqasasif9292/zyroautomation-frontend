<template>
  <AppLayout>
    <transition name="toast-fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
    <main class="vendor-page">
      <section class="detail-stack">
        <div class="vendor-panel">
          <header class="vendor-header"><div><h1>{{ vendor?.name || 'Vendor' }}</h1><p>{{ vendor?.city || '—' }} · {{ vendor?.phone || 'No phone' }}</p></div><button class="secondary-btn" @click="router.push('/vendors')">Back</button></header>
          <div class="info-body"><div><span>Contact</span><strong>{{ vendor?.contact_name || '—' }}</strong></div><div><span>Address</span><strong>{{ vendor?.address || '—' }}</strong></div><div><span>Notes</span><strong>{{ vendor?.notes || '—' }}</strong></div><button class="primary-btn" @click="openVendorEdit">Edit Vendor</button></div>
        </div>

        <div class="vendor-panel">
          <header class="vendor-header"><div><h1>Financial Summary</h1><p>Vendor ledger and outstanding balance.</p></div><button class="primary-btn" @click="openPayment()">+ Add Payment</button></header>
          <section class="stats-grid"><article><span>Total Invoiced</span><strong>PKR {{ money(summary.total_invoiced) }}</strong></article><article><span>Total Paid</span><strong>PKR {{ money(summary.total_paid) }}</strong></article><article><span>Balance</span><strong>PKR {{ money(summary.balance) }}</strong></article><article><span>Overdue Invoices</span><strong>{{ money(summary.overdue_invoices) }}</strong></article></section>
          <div class="progress-wrap"><div class="progress-track"><span :class="['progress-fill', progressTone]" :style="{ width: `${paidPercent}%` }"></span></div></div>
        </div>

        <ActivityCard title="Invoices" action="+ Add Invoice" :rows="invoices" :loading="loading" empty="No invoices." @action="openInvoiceCreate">
          <template #head><tr><th>Invoice #</th><th>Date</th><th>Due</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></template>
          <template #row="{ row }"><tr @click="openInvoiceDetail(row)"><td>{{ row.invoice_number || '—' }}</td><td>{{ date(row.invoice_date) }}</td><td>{{ date(row.due_date) }}</td><td>PKR {{ money(row.total_amount) }}</td><td class="paid">PKR {{ money(row.paid_amount) }}</td><td class="balance-due">PKR {{ money(row.balance) }}</td><td><VendorStatusBadge :status="row.status" /></td><td @click.stop><div class="actions"><button @click="openInvoiceDetail(row)">View</button><button @click="openInvoiceEdit(row)">Edit</button><button @click="confirmDelete('invoice', row)">Delete</button></div></td></tr></template>
        </ActivityCard>

        <ActivityCard title="Payments" action="+ Add Payment" :rows="payments" :loading="loading" empty="No payments." @action="openPayment">
          <template #head><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Invoice</th><th>Actions</th></tr></template>
          <template #row="{ row }"><tr><td>{{ date(row.payment_date) }}</td><td class="paid">PKR {{ money(row.amount) }}</td><td>{{ methodLabel(row.payment_method) }}</td><td>{{ row.reference || '—' }}</td><td>{{ row.invoice_number || '—' }}</td><td><div class="actions"><button @click="confirmDelete('payment', row)">Delete</button></div></td></tr></template>
        </ActivityCard>

        <ActivityCard title="Bilties" action="+ Add Bilty" :rows="bilties" :loading="loading" empty="No bilties." @action="openBiltyCreate">
          <template #head><tr><th>Bilty #</th><th>Transport</th><th>Route</th><th>Dispatch</th><th>Expected</th><th>Status</th><th>Actions</th></tr></template>
          <template #row="{ row }"><tr @click="openBiltyDetail(row)"><td>{{ row.bilty_number }}</td><td>{{ row.transport_company || '—' }}</td><td>{{ row.from_city || '—' }} → {{ row.to_city || '—' }}</td><td>{{ date(row.dispatch_date) }}</td><td>{{ date(row.expected_date) }}</td><td><VendorStatusBadge :status="row.status" /></td><td @click.stop><div class="actions"><button @click="openBiltyEdit(row)">Edit</button><button @click="confirmDelete('bilty', row)">Delete</button></div></td></tr></template>
        </ActivityCard>

        <ActivityCard title="Stock Receipts" action="+ Add Receipt" :rows="receipts" :loading="loading" empty="No receipts." @action="openReceiptCreate">
          <template #head><tr><th>Date</th><th>Rider</th><th>Items</th><th>Expected</th><th>Received</th><th>Damaged</th><th>Status</th><th>Actions</th></tr></template>
          <template #row="{ row }"><tr @click="openReceiptDetail(row)"><td>{{ date(row.receipt_date) }}</td><td>{{ row.rider_name || '—' }}</td><td>{{ row.items?.length || 0 }}</td><td>{{ money(row.total_expected) }}</td><td>{{ money(row.total_received) }}</td><td class="balance-due">{{ row.total_damaged > 0 ? money(row.total_damaged) : '—' }}</td><td><VendorStatusBadge :status="row.receipt_status" /></td><td @click.stop><div class="actions"><button @click="openReceiptEdit(row)">Edit</button><button @click="confirmDelete('receipt', row)">Delete</button></div></td></tr></template>
        </ActivityCard>
      </section>
    </main>

    <VendorFormPanel :show="vendorFormOpen" :vendor="vendor" :saving="saving" @close="vendorFormOpen = false" @save="saveVendor" />
    <InvoiceFormPanel :show="invoiceFormOpen" :invoice="selectedInvoice" :vendors="vendor ? [vendor] : []" :vendor-id="id" :saving="saving" @close="invoiceFormOpen = false" @save="saveInvoice" />
    <PaymentFormPanel :show="paymentOpen" :vendors="vendor ? [vendor] : []" :invoices="invoices" :vendor-id="id" :invoice-id="selectedInvoice?.id || ''" :saving="saving" @close="paymentOpen = false" @save="savePayment" />
    <BiltyFormPanel :show="biltyFormOpen" :bilty="selectedBilty" :vendors="vendor ? [vendor] : []" :invoices="invoices" :vendor-id="id" :saving="saving" @close="biltyFormOpen = false" @save="saveBilty" />
    <StockReceiptFormPanel :show="receiptFormOpen" :receipt="selectedReceipt" :vendors="vendor ? [vendor] : []" :invoices="invoices" :bilties="bilties" :vendor-id="id" :saving="saving" @close="receiptFormOpen = false" @save="saveReceipt" />
    <VendorDetailPanel :show="detailOpen" :type="detailType" :record="detailRecord || {}" :payments="invoicePayments" @close="detailOpen = false" @add-payment="openPayment" />
    <ConfirmDialog :show="deleteOpen" title="Delete Record?" message="This record will be removed." :details="deleteTargetLabel" eyebrow="Vendors" confirmText="Delete" cancelText="Keep" variant="danger" :loading="saving" @cancel="deleteOpen = false" @confirm="deleteRecord" />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge.vue';
import VendorFormPanel from '../../components/vendors/VendorFormPanel.vue';
import InvoiceFormPanel from '../../components/vendors/InvoiceFormPanel.vue';
import PaymentFormPanel from '../../components/vendors/PaymentFormPanel.vue';
import BiltyFormPanel from '../../components/vendors/BiltyFormPanel.vue';
import StockReceiptFormPanel from '../../components/vendors/StockReceiptFormPanel.vue';
import VendorDetailPanel from '../../components/vendors/VendorDetailPanel.vue';
import VendorService from '../../services/VendorService';
import VendorInvoiceService from '../../services/VendorInvoiceService';
import VendorPaymentService from '../../services/VendorPaymentService';
import VendorBiltyService from '../../services/VendorBiltyService';
import VendorStockReceiptService from '../../services/VendorStockReceiptService';

const ActivityCard = {
  props: { title: String, action: String, rows: Array, loading: Boolean, empty: String },
  emits: ['action'],
  template: `<div class="vendor-panel"><header class="vendor-header"><div><h1>{{ title }}</h1></div><button class="primary-btn" @click="$emit('action')">{{ action }}</button></header><div class="table-wrap"><table class="vendor-table"><thead><slot name="head" /></thead><tbody><tr v-if="loading" v-for="row in 4" :key="row"><td colspan="8"><span class="skeleton"></span></td></tr><tr v-else-if="!rows.length"><td colspan="8" class="empty-cell">{{ empty }}</td></tr><slot v-else v-for="row in rows" name="row" :row="row" /></tbody></table></div></div>`,
};

const router = useRouter();
const route = useRoute();
const id = route.params.id;
const vendor = ref(null), summary = ref({}), invoices = ref([]), payments = ref([]), bilties = ref([]), receipts = ref([]);
const loading = ref(false), saving = ref(false), toast = ref('');
const vendorFormOpen = ref(false), invoiceFormOpen = ref(false), paymentOpen = ref(false), biltyFormOpen = ref(false), receiptFormOpen = ref(false), detailOpen = ref(false), deleteOpen = ref(false);
const selectedInvoice = ref(null), selectedBilty = ref(null), selectedReceipt = ref(null), invoicePayments = ref([]);
const detailType = ref('invoice'), detailRecord = ref(null), deleteKind = ref(''), deleteTarget = ref(null);
const paidPercent = computed(() => summary.value.total_invoiced ? Math.min((summary.value.total_paid / summary.value.total_invoiced) * 100, 100) : 0);
const balanceRatio = computed(() => summary.value.total_invoiced ? (summary.value.balance / summary.value.total_invoiced) * 100 : 0);
const progressTone = computed(() => balanceRatio.value > 80 ? 'red-fill' : balanceRatio.value > 50 ? 'amber-fill' : 'green-fill');
const deleteTargetLabel = computed(() => deleteTarget.value?.invoice_number || deleteTarget.value?.bilty_number || deleteTarget.value?.vendor_name || 'Record');
const money = value => Number(value || 0).toLocaleString();
const date = value => value ? new Date(value).toLocaleDateString('en-GB') : '—';
const methodLabel = value => ({ cash: 'Cash', bank_transfer: 'Bank Transfer', easypaisa: 'EasyPaisa', jazzcash: 'JazzCash', cheque: 'Cheque', other: 'Other' }[value] || value || '—');
const showToast = message => { toast.value = message; setTimeout(() => { toast.value = ''; }, 3000); };

const loadAll = async () => {
  loading.value = true;
  try {
    const [vendorRes, summaryRes, invoicesRes, paymentsRes, biltiesRes, receiptsRes] = await Promise.all([
      VendorService.get(id), VendorService.summary(id), VendorInvoiceService.list({ vendor_id: id, per_page: 100 }), VendorPaymentService.list({ vendor_id: id }), VendorBiltyService.list({ vendor_id: id, per_page: 100 }), VendorStockReceiptService.list({ vendor_id: id, per_page: 100 }),
    ]);
    vendor.value = vendorRes.data.data.vendor;
    summary.value = summaryRes.data.data.summary;
    invoices.value = invoicesRes.data.data.invoices;
    payments.value = paymentsRes.data.data.payments;
    bilties.value = biltiesRes.data.data.bilties;
    receipts.value = receiptsRes.data.data.receipts;
  } finally { loading.value = false; }
};
const openVendorEdit = () => { vendorFormOpen.value = true; };
const openInvoiceCreate = () => { selectedInvoice.value = null; invoiceFormOpen.value = true; };
const openInvoiceEdit = invoice => { selectedInvoice.value = invoice; invoiceFormOpen.value = true; };
const openInvoiceDetail = async invoice => { detailType.value = 'invoice'; detailOpen.value = true; const res = await VendorInvoiceService.get(invoice.id); detailRecord.value = res.data.data.invoice; invoicePayments.value = res.data.data.payments; selectedInvoice.value = res.data.data.invoice; };
const openPayment = invoice => { selectedInvoice.value = invoice || null; paymentOpen.value = true; };
const openBiltyCreate = () => { selectedBilty.value = null; biltyFormOpen.value = true; };
const openBiltyEdit = bilty => { selectedBilty.value = bilty; biltyFormOpen.value = true; };
const openBiltyDetail = async bilty => { detailType.value = 'bilty'; detailOpen.value = true; detailRecord.value = (await VendorBiltyService.get(bilty.id)).data.data.bilty; };
const openReceiptCreate = () => { selectedReceipt.value = null; receiptFormOpen.value = true; };
const openReceiptEdit = receipt => { selectedReceipt.value = receipt; receiptFormOpen.value = true; };
const openReceiptDetail = async receipt => { detailType.value = 'receipt'; detailOpen.value = true; detailRecord.value = (await VendorStockReceiptService.get(receipt.id)).data.data.receipt; };
const confirmDelete = (kind, record) => { deleteKind.value = kind; deleteTarget.value = record; deleteOpen.value = true; };
const wrapSave = async (fn, close) => { saving.value = true; try { await fn(); close(); showToast('Saved.'); await loadAll(); } catch (e) { showToast(e.response?.data?.message || 'Save failed.'); } finally { saving.value = false; } };
const saveVendor = payload => wrapSave(() => VendorService.update(id, payload), () => { vendorFormOpen.value = false; });
const saveInvoice = payload => wrapSave(() => selectedInvoice.value?.id ? VendorInvoiceService.update(selectedInvoice.value.id, payload) : VendorInvoiceService.create(payload), () => { invoiceFormOpen.value = false; });
const savePayment = payload => wrapSave(() => VendorPaymentService.create(payload), () => { paymentOpen.value = false; });
const saveBilty = payload => wrapSave(() => selectedBilty.value?.id ? VendorBiltyService.update(selectedBilty.value.id, payload) : VendorBiltyService.create(payload), () => { biltyFormOpen.value = false; });
const saveReceipt = payload => wrapSave(() => selectedReceipt.value?.id ? VendorStockReceiptService.update(selectedReceipt.value.id, payload) : VendorStockReceiptService.create(payload), () => { receiptFormOpen.value = false; });
const deleteRecord = async () => {
  saving.value = true;
  try {
    if (deleteKind.value === 'invoice') await VendorInvoiceService.delete(deleteTarget.value.id);
    if (deleteKind.value === 'payment') await VendorPaymentService.delete(deleteTarget.value.id);
    if (deleteKind.value === 'bilty') await VendorBiltyService.delete(deleteTarget.value.id);
    if (deleteKind.value === 'receipt') await VendorStockReceiptService.delete(deleteTarget.value.id);
    deleteOpen.value = false;
    showToast('Deleted.');
    await loadAll();
  } catch (e) { showToast(e.response?.data?.message || 'Delete failed.'); } finally { saving.value = false; }
};
onMounted(loadAll);
</script>

<style scoped>
@import './vendor-pages.css';
.detail-stack { display: flex; flex-direction: column; gap: 20px; }
.info-body { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: 14px; padding: 22px 28px; align-items: start; }
.info-body div { border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; padding: 14px; }
.info-body span { display: block; margin-bottom: 6px; color: #64748b; font-size: 12px; font-weight: 850; text-transform: uppercase; }
.info-body strong { color: #172554; font-size: 14px; }
.progress-wrap { padding: 0 28px 24px; }
.progress-track { height: 10px; overflow: hidden; border-radius: 999px; background: #f1f5f9; }
.progress-fill { display: block; height: 100%; border-radius: inherit; }
.green-fill { background: #22c55e; }
.amber-fill { background: #f59e0b; }
.red-fill { background: #ef4444; }
</style>
