<template>
  <AppLayout>
    <transition name="toast-fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
    <main class="vendor-page"><section class="vendor-panel">
      <header class="vendor-header"><div><h1>Stock Receipts</h1><p>Record goods received from vendors.</p></div><button class="primary-btn" @click="openCreate">+ Add Receipt</button></header>
      <section class="stats-grid"><article><span>Complete This Month</span><strong>{{ money(summary.complete_this_month) }}</strong></article><article><span>Partial / Damaged</span><strong>{{ money(summary.issues_this_month) }}</strong></article><article><span>Items Received</span><strong>{{ money(summary.received_this_month) }}</strong></article></section>
      <div class="filter-bar"><select v-model="filters.vendor_id" @change="fetchReceipts(1)"><option value="">All Vendors</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select><select v-model="filters.status" @change="fetchReceipts(1)"><option value="">All Statuses</option><option value="complete">Complete</option><option value="partial">Partial</option><option value="damaged">Damaged</option><option value="mixed">Mixed</option></select><input v-model="filters.date_from" type="date" @change="fetchReceipts(1)"><input v-model="filters.date_to" type="date" @change="fetchReceipts(1)"></div>
      <div class="table-wrap"><table class="vendor-table"><thead><tr><th>Date</th><th>Vendor</th><th>Bilty #</th><th>Rider</th><th>Expected</th><th>Received</th><th>Damaged</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        <tr v-if="loading" v-for="row in 5" :key="row"><td v-for="col in 9" :key="col"><span class="skeleton"></span></td></tr>
        <tr v-else-if="receipts.length === 0"><td colspan="9" class="empty-cell"><strong>No stock receipts yet</strong><button class="primary-btn" @click="openCreate">Add Receipt</button></td></tr>
        <tr v-else v-for="receipt in receipts" :key="receipt.id" @click="openDetail(receipt)"><td>{{ date(receipt.receipt_date) }}</td><td>{{ receipt.vendor_name || '—' }}</td><td>{{ receipt.bilty_number || '—' }}</td><td>{{ receipt.rider_name || '—' }}</td><td>{{ money(receipt.total_expected) }}</td><td>{{ money(receipt.total_received) }}</td><td :class="receipt.total_damaged > 0 ? 'balance-due' : ''">{{ receipt.total_damaged > 0 ? money(receipt.total_damaged) : '—' }}</td><td><VendorStatusBadge :status="receipt.receipt_status" /></td><td @click.stop><div class="actions"><button @click="openDetail(receipt)">View</button><button @click="openEdit(receipt)">Edit</button><button @click="confirmDelete(receipt)">Delete</button></div></td></tr>
      </tbody></table></div>
      <footer v-if="pagination.total_pages > 1" class="pager"><button :disabled="!pagination.has_prev || loading" @click="fetchReceipts(pagination.current_page - 1)">Previous</button><span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span><button :disabled="!pagination.has_next || loading" @click="fetchReceipts(pagination.current_page + 1)">Next</button></footer>
    </section></main>
    <StockReceiptFormPanel :show="formOpen" :receipt="selectedReceipt" :vendors="vendors" :invoices="invoices" :bilties="bilties" :saving="saving" @close="closePanels" @save="saveReceipt" />
    <VendorDetailPanel :show="detailOpen" type="receipt" :record="selectedReceipt || {}" @close="detailOpen = false" />
    <ConfirmDialog :show="deleteOpen" title="Delete Stock Receipt?" message="This goods received note will be removed." :details="selectedReceipt?.vendor_name || ''" eyebrow="Stock Receipt" confirmText="Delete Receipt" cancelText="Keep Receipt" variant="danger" :loading="saving" @cancel="deleteOpen = false" @confirm="deleteReceipt" />
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import AppLayout from '../../layouts/AppLayout.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge.vue';
import StockReceiptFormPanel from '../../components/vendors/StockReceiptFormPanel.vue';
import VendorDetailPanel from '../../components/vendors/VendorDetailPanel.vue';
import VendorService from '../../services/VendorService';
import VendorInvoiceService from '../../services/VendorInvoiceService';
import VendorBiltyService from '../../services/VendorBiltyService';
import VendorStockReceiptService from '../../services/VendorStockReceiptService';

const vendors = ref([]), invoices = ref([]), bilties = ref([]), receipts = ref([]);
const summary = reactive({});
const pagination = reactive({ current_page: 1, total_pages: 1 });
const filters = reactive({ vendor_id: '', status: '', date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), date_to: new Date().toISOString().slice(0, 10) });
const loading = ref(false), saving = ref(false), formOpen = ref(false), detailOpen = ref(false), deleteOpen = ref(false);
const selectedReceipt = ref(null), toast = ref('');
const money = value => Number(value || 0).toLocaleString();
const date = value => value ? new Date(value).toLocaleDateString('en-GB') : '—';
const showToast = message => { toast.value = message; setTimeout(() => { toast.value = ''; }, 3000); };
const fetchLookups = async () => { vendors.value = (await VendorService.list({ per_page: 100 })).data.data.vendors; invoices.value = (await VendorInvoiceService.list({ per_page: 100 })).data.data.invoices; bilties.value = (await VendorBiltyService.list({ per_page: 100 })).data.data.bilties; };
const fetchReceipts = async (page = 1) => { loading.value = true; try { const res = await VendorStockReceiptService.list({ ...filters, page, per_page: 20 }); receipts.value = res.data.data.receipts; Object.assign(summary, res.data.data.summary); Object.assign(pagination, res.data.data.pagination); } finally { loading.value = false; } };
const openCreate = () => { selectedReceipt.value = null; formOpen.value = true; };
const openEdit = receipt => { selectedReceipt.value = receipt; formOpen.value = true; };
const openDetail = async receipt => { selectedReceipt.value = receipt; detailOpen.value = true; selectedReceipt.value = (await VendorStockReceiptService.get(receipt.id)).data.data.receipt; };
const closePanels = () => { formOpen.value = false; selectedReceipt.value = null; };
const confirmDelete = receipt => { selectedReceipt.value = receipt; deleteOpen.value = true; };
const saveReceipt = async payload => { saving.value = true; try { selectedReceipt.value?.id ? await VendorStockReceiptService.update(selectedReceipt.value.id, payload) : await VendorStockReceiptService.create(payload); closePanels(); showToast('Receipt saved.'); await fetchReceipts(pagination.current_page); } catch (e) { showToast(e.response?.data?.message || 'Failed to save receipt.'); } finally { saving.value = false; } };
const deleteReceipt = async () => { saving.value = true; try { await VendorStockReceiptService.delete(selectedReceipt.value.id); deleteOpen.value = false; showToast('Receipt deleted.'); await fetchReceipts(pagination.current_page); } catch (e) { showToast(e.response?.data?.message || 'Failed to delete receipt.'); } finally { saving.value = false; } };
onMounted(async () => { await fetchLookups(); await fetchReceipts(); });
</script>

<style scoped>
@import './vendor-pages.css';
.filter-bar { display: grid; grid-template-columns: 220px 180px 160px 160px; gap: 12px; padding: 0 28px 18px; }
.filter-bar input, .filter-bar select { height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 11px; }
</style>
