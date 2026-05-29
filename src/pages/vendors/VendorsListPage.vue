<template>
  <AppLayout>
    <transition name="toast-fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>
    <main class="vendor-page">
      <section class="vendor-panel">
        <header class="vendor-header">
          <div><h1>Vendors</h1><p>Manage your suppliers and track outstanding balances.</p></div>
          <button class="primary-btn" type="button" @click="openCreate">+ Add Vendor</button>
        </header>

        <section class="stats-grid">
          <article><span>Total Vendors</span><strong>{{ money(summary.total_vendors) }}</strong></article>
          <article><span>Outstanding Balance</span><strong>PKR {{ money(summary.total_outstanding) }}</strong></article>
          <article><span>Invoices Due This Month</span><strong>{{ money(summary.invoices_due_this_month) }}</strong></article>
        </section>

        <div class="table-wrap">
          <table class="vendor-table">
            <thead><tr><th>Vendor</th><th>Contact</th><th>Invoices</th><th>Total Invoiced</th><th>Paid</th><th>Balance</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-if="loading" v-for="row in 5" :key="row"><td v-for="col in 7" :key="col"><span class="skeleton"></span></td></tr>
              <tr v-else-if="vendors.length === 0"><td colspan="7" class="empty-cell"><strong>No vendors yet</strong><button class="primary-btn" type="button" @click="openCreate">Add your first vendor</button></td></tr>
              <tr v-else v-for="vendor in vendors" :key="vendor.id">
                <td><button class="link-cell" type="button" @click="router.push(`/vendors/${vendor.id}`)">{{ vendor.name }}</button><span>{{ vendor.city || '—' }}</span></td>
                <td>{{ vendor.contact_name || '—' }}<span>{{ vendor.phone || '—' }}</span></td>
                <td><span class="count-pill">{{ vendor.invoice_count }} invoices</span></td>
                <td>PKR {{ money(vendor.total_invoiced) }}</td>
                <td class="paid">PKR {{ money(vendor.total_paid) }}</td>
                <td :class="vendor.balance > 0 ? 'balance-due' : 'balance-clear'">PKR {{ money(vendor.balance) }}</td>
                <td><div class="actions"><button @click="router.push(`/vendors/${vendor.id}`)">View</button><button @click="openEdit(vendor)">Edit</button><button @click="confirmDelete(vendor)">Delete</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="pagination.total_pages > 1" class="pager">
          <button :disabled="!pagination.has_prev || loading" @click="changePage(pagination.current_page - 1)">Previous</button>
          <span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span>
          <button :disabled="!pagination.has_next || loading" @click="changePage(pagination.current_page + 1)">Next</button>
        </footer>
      </section>
    </main>

    <VendorFormPanel :show="formOpen" :vendor="selectedVendor" :saving="saving" @close="closeForm" @save="saveVendor" />
    <ConfirmDialog :show="deleteOpen" title="Delete Vendor?" message="This vendor will be removed if it has no linked records." :details="selectedVendor?.name || ''" eyebrow="Vendor" confirmText="Delete Vendor" cancelText="Keep Vendor" variant="danger" :loading="saving" @cancel="deleteOpen = false" @confirm="deleteVendor" />
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import VendorFormPanel from '../../components/vendors/VendorFormPanel.vue';
import VendorService from '../../services/VendorService';

const router = useRouter();
const vendors = ref([]);
const summary = reactive({ total_vendors: 0, total_outstanding: 0, invoices_due_this_month: 0 });
const pagination = reactive({ current_page: 1, total_pages: 1, has_prev: false, has_next: false });
const loading = ref(false);
const saving = ref(false);
const formOpen = ref(false);
const deleteOpen = ref(false);
const selectedVendor = ref(null);
const toast = ref('');

const money = value => Number(value || 0).toLocaleString();
const showToast = message => { toast.value = message; setTimeout(() => { toast.value = ''; }, 3000); };

const fetchVendors = async (page = pagination.current_page || 1) => {
  loading.value = true;
  try {
    const res = await VendorService.list({ page, per_page: 20 });
    vendors.value = res.data.data.vendors;
    Object.assign(summary, res.data.data.summary);
    Object.assign(pagination, res.data.data.pagination);
  } finally {
    loading.value = false;
  }
};

const openCreate = () => { selectedVendor.value = null; formOpen.value = true; };
const openEdit = vendor => { selectedVendor.value = vendor; formOpen.value = true; };
const closeForm = () => { formOpen.value = false; selectedVendor.value = null; };
const confirmDelete = vendor => { selectedVendor.value = vendor; deleteOpen.value = true; };
const changePage = page => fetchVendors(page);

const saveVendor = async (payload) => {
  saving.value = true;
  try {
    if (selectedVendor.value?.id) await VendorService.update(selectedVendor.value.id, payload);
    else await VendorService.create(payload);
    closeForm();
    showToast(selectedVendor.value?.id ? 'Vendor updated.' : 'Vendor created.');
    await fetchVendors();
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to save vendor.');
  } finally {
    saving.value = false;
  }
};

const deleteVendor = async () => {
  if (!selectedVendor.value) return;
  saving.value = true;
  try {
    await VendorService.delete(selectedVendor.value.id);
    deleteOpen.value = false;
    showToast('Vendor deleted.');
    await fetchVendors();
  } catch (error) {
    showToast(error.response?.data?.message || 'Failed to delete vendor.');
  } finally {
    saving.value = false;
  }
};

onMounted(() => fetchVendors(1));
</script>

<style scoped>
@import './vendor-pages.css';
</style>
