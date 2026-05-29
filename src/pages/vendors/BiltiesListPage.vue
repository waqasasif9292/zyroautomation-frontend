<template>
  <AppLayout>
    <transition name="toast-fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
    <main class="vendor-page"><section class="vendor-panel">
      <header class="vendor-header"><div><h1>Bilties</h1><p>Track cargo dispatches from your vendors.</p></div><button class="primary-btn" @click="openCreate">+ Add Bilty</button></header>
      <div class="filter-bar"><select v-model="filters.vendor_id" @change="fetchBilties(1)"><option value="">All Vendors</option><option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select><select v-model="filters.status" @change="fetchBilties(1)"><option value="">All Statuses</option><option value="in_transit">In Transit</option><option value="ready_for_pickup">Ready for Pickup</option><option value="picked_up">Picked Up</option><option value="received">Received</option><option value="issue">Issue</option></select><input v-model="filters.search" placeholder="Search bilty number" @input="debouncedSearch"></div>
      <div class="table-wrap"><table class="vendor-table"><thead><tr><th>Bilty #</th><th>Vendor</th><th>Transport</th><th>Route</th><th>Dispatch</th><th>Expected</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        <tr v-if="loading" v-for="row in 5" :key="row"><td v-for="col in 8" :key="col"><span class="skeleton"></span></td></tr>
        <tr v-else-if="bilties.length === 0"><td colspan="8" class="empty-cell"><strong>No bilties yet</strong><button class="primary-btn" @click="openCreate">Add Bilty</button></td></tr>
        <tr v-else v-for="bilty in bilties" :key="bilty.id" @click="openDetail(bilty)"><td class="mono">{{ bilty.bilty_number }}</td><td>{{ bilty.vendor_name || '—' }}</td><td>{{ bilty.transport_company || '—' }}</td><td>{{ bilty.from_city || '—' }} → {{ bilty.to_city || '—' }}</td><td>{{ date(bilty.dispatch_date) }}</td><td :class="{ 'amber-text': expectedNeedsAction(bilty) }">{{ date(bilty.expected_date) }}</td><td><VendorStatusBadge :status="bilty.status" /></td><td @click.stop><div class="actions"><button @click="openDetail(bilty)">View</button><button @click="openEdit(bilty)">Edit</button><button @click="confirmDelete(bilty)">Delete</button></div></td></tr>
      </tbody></table></div>
      <footer v-if="pagination.total_pages > 1" class="pager"><button :disabled="!pagination.has_prev || loading" @click="fetchBilties(pagination.current_page - 1)">Previous</button><span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span><button :disabled="!pagination.has_next || loading" @click="fetchBilties(pagination.current_page + 1)">Next</button></footer>
    </section></main>
    <BiltyFormPanel :show="formOpen" :bilty="selectedBilty" :vendors="vendors" :invoices="invoices" :saving="saving" @close="closePanels" @save="saveBilty" />
    <VendorDetailPanel :show="detailOpen" type="bilty" :record="selectedBilty || {}" @close="detailOpen = false" />
    <ConfirmDialog :show="deleteOpen" title="Delete Bilty?" message="This cargo record will be removed." :details="selectedBilty?.bilty_number || ''" eyebrow="Bilty" confirmText="Delete Bilty" cancelText="Keep Bilty" variant="danger" :loading="saving" @cancel="deleteOpen = false" @confirm="deleteBilty" />
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import AppLayout from '../../layouts/AppLayout.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import VendorStatusBadge from '../../components/vendors/VendorStatusBadge.vue';
import BiltyFormPanel from '../../components/vendors/BiltyFormPanel.vue';
import VendorDetailPanel from '../../components/vendors/VendorDetailPanel.vue';
import VendorService from '../../services/VendorService';
import VendorInvoiceService from '../../services/VendorInvoiceService';
import VendorBiltyService from '../../services/VendorBiltyService';

const vendors = ref([]), invoices = ref([]), bilties = ref([]);
const pagination = reactive({ current_page: 1, total_pages: 1 });
const filters = reactive({ vendor_id: '', status: '', search: '' });
const loading = ref(false), saving = ref(false), formOpen = ref(false), detailOpen = ref(false), deleteOpen = ref(false);
const selectedBilty = ref(null), toast = ref('');
let searchTimer = null;
const date = value => value ? new Date(value).toLocaleDateString('en-GB') : '—';
const showToast = message => { toast.value = message; setTimeout(() => { toast.value = ''; }, 3000); };
const expectedNeedsAction = bilty => bilty.expected_date && !['received', 'issue'].includes(bilty.status) && new Date(bilty.expected_date) <= new Date(new Date().toDateString());
const debouncedSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => fetchBilties(1), 400); };
const fetchLookups = async () => { vendors.value = (await VendorService.list({ per_page: 100 })).data.data.vendors; invoices.value = (await VendorInvoiceService.list({ per_page: 100 })).data.data.invoices; };
const fetchBilties = async (page = 1) => { loading.value = true; try { const res = await VendorBiltyService.list({ ...filters, page, per_page: 20 }); bilties.value = res.data.data.bilties; Object.assign(pagination, res.data.data.pagination); } finally { loading.value = false; } };
const openCreate = () => { selectedBilty.value = null; formOpen.value = true; };
const openEdit = bilty => { selectedBilty.value = bilty; formOpen.value = true; };
const openDetail = async bilty => { selectedBilty.value = bilty; detailOpen.value = true; selectedBilty.value = (await VendorBiltyService.get(bilty.id)).data.data.bilty; };
const closePanels = () => { formOpen.value = false; selectedBilty.value = null; };
const confirmDelete = bilty => { selectedBilty.value = bilty; deleteOpen.value = true; };
const saveBilty = async payload => { saving.value = true; try { selectedBilty.value?.id ? await VendorBiltyService.update(selectedBilty.value.id, payload) : await VendorBiltyService.create(payload); closePanels(); showToast('Bilty saved.'); await fetchBilties(pagination.current_page); } catch (e) { showToast(e.response?.data?.message || 'Failed to save bilty.'); } finally { saving.value = false; } };
const deleteBilty = async () => { saving.value = true; try { await VendorBiltyService.delete(selectedBilty.value.id); deleteOpen.value = false; showToast('Bilty deleted.'); await fetchBilties(pagination.current_page); } catch (e) { showToast(e.response?.data?.message || 'Failed to delete bilty.'); } finally { saving.value = false; } };
onMounted(async () => { await fetchLookups(); await fetchBilties(); });
</script>

<style scoped>
@import './vendor-pages.css';
.filter-bar { display: grid; grid-template-columns: 220px 190px 1fr; gap: 12px; padding: 22px 28px 18px; }
.filter-bar input, .filter-bar select { height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 11px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.amber-text { color: #92400e; font-weight: 850; }
</style>
