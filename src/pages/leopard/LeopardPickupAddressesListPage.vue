<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <div class="page-body">
      <SettingsSubNav />
      <main class="page-content">
        <div class="content-panel">
          <div class="panel-header">
            <div class="header-left">
              <h2 class="panel-title">Leopard Pickup Addresses</h2>
              <p class="panel-subtitle">Save shipper addresses that can be selected while booking Leopard orders.</p>
            </div>
            <button class="btn-add" @click="router.push('/leopard-pickup-addresses/create')">+ Add Address</button>
          </div>

          <div class="panel-body">
            <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>

            <div v-if="!loading && addresses.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9h1" />
                <path d="M9 13h1" />
              </svg>
              <p class="empty-title">No pickup addresses yet</p>
              <p class="empty-sub">Add your first Leopard pickup address to get started.</p>
              <button type="button" class="btn-add" @click="router.push('/leopard-pickup-addresses/create')">+ Add Address</button>
            </div>

            <div v-else class="table-wrap">
              <table class="address-table">
                <thead>
                  <tr>
                    <th class="col-name">Name</th>
                    <th class="col-city">Origin City</th>
                    <th class="col-city">Return City</th>
                    <th class="col-contact">Contact</th>
                    <th class="col-address">Address</th>
                    <th class="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-if="loading">
                    <tr v-for="n in 3" :key="'sk' + n" class="skeleton-row">
                      <td><div class="sk sk-name"></div></td>
                      <td><div class="sk sk-city"></div></td>
                      <td><div class="sk sk-city"></div></td>
                      <td><div class="sk sk-contact"></div></td>
                      <td><div class="sk sk-address"></div></td>
                      <td><div class="sk sk-icon"></div></td>
                    </tr>
                  </template>

                  <template v-else>
                    <tr v-for="address in addresses" :key="address.id" class="data-row">
                      <td class="cell-name">{{ address.shipment_name_eng }}</td>
                      <td class="cell-muted">{{ address.origin_city_name || address.origin_city }}</td>
                      <td class="cell-muted">{{ address.return_city_name || address.return_city }}</td>
                      <td class="cell-contact">
                        <span>{{ address.shipment_phone }}</span>
                        <small>{{ address.shipment_email }}</small>
                      </td>
                      <td class="cell-address">{{ address.shipment_address }}</td>
                      <td class="cell-actions">
                        <button
                          type="button"
                          class="icon-btn"
                          title="Edit pickup address"
                          @click="router.push(`/leopard-pickup-addresses/${address.id}/edit`)"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          v-if="canDeleteRecords"
                          type="button"
                          class="icon-btn danger"
                          title="Delete pickup address"
                          @click="openDeleteDialog(address)"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <ConfirmDialog
      :show="deleteDialogOpen"
      title="Delete Leopard pickup address?"
      message="This pickup address will no longer be available while creating Leopard orders."
      :details="deleteTarget?.shipment_name_eng || ''"
      eyebrow="Leopard pickup"
      confirmText="Delete address"
      cancelText="Keep address"
      variant="danger"
      :loading="deleteLoading"
      @cancel="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import { useAuthStore } from '../../stores/authStore';
import LeopardService from '../../services/LeopardService';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const deleteLoading = ref(false);
const deleteDialogOpen = ref(false);
const deleteTarget = ref(null);
const addresses = ref([]);
const toast = ref('');
const errorMessage = ref('');
const canDeleteRecords = computed(() => ['admin', 'owner'].includes(authStore.user?.team_role || 'admin'));

const showToast = (msg) => {
  toast.value = msg;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const loadAddresses = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await LeopardService.fetchPickupAddresses();
    addresses.value = res.data.data.addresses || [];
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load Leopard pickup addresses.';
  } finally {
    loading.value = false;
  }
};

const openDeleteDialog = (address) => {
  if (!canDeleteRecords.value) return;
  deleteTarget.value = address;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  if (deleteLoading.value) return;
  deleteDialogOpen.value = false;
  deleteTarget.value = null;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;

  deleteLoading.value = true;
  errorMessage.value = '';

  try {
    await LeopardService.deletePickupAddress(deleteTarget.value.id);
    addresses.value = addresses.value.filter(item => item.id !== deleteTarget.value.id);
    deleteDialogOpen.value = false;
    deleteTarget.value = null;
    showToast('Leopard pickup address deleted.');
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to delete Leopard pickup address.';
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(async () => {
  await loadAddresses();

  if (route.query.toast === 'created') {
    showToast('Leopard pickup address created.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Leopard pickup address updated.');
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.page-body {
  display: flex;
  flex: 1;
  max-width: none;
  width: 100%;
  margin: 28px 0;
  padding: 0 28px;
  gap: 24px;
  align-items: flex-start;
}

.page-content {
  flex: 1;
  min-width: 0;
}

.content-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  padding: 20px 28px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.panel-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.btn-add {
  padding: 9px 16px;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-add:hover {
  background: #1f2937;
}

.panel-body {
  padding: 0;
}

.table-wrap {
  overflow-x: auto;
}

.address-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.address-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;
}

.col-name { width: 18%; }
.col-city { width: 14%; }
.col-contact { width: 22%; }
.col-address { width: 24%; }
.col-actions { width: 8%; }

.data-row {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.12s;
}

.data-row:last-child {
  border-bottom: none;
}

.data-row:hover {
  background: #f9fafb;
}

.cell-name,
.cell-muted,
.cell-contact,
.cell-address,
.cell-actions {
  padding: 14px;
}

.cell-name {
  font-weight: 500;
  color: #111827;
}

.cell-muted {
  color: #4b5563;
}

.cell-contact {
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: #111827;
}

.cell-contact small {
  color: #6b7280;
  font-size: 12px;
}

.cell-address {
  color: #4b5563;
  max-width: 260px;
}

.cell-actions {
  text-align: right;
  white-space: nowrap;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 5px;
  transition: color 0.15s, background 0.15s;
}

.icon-btn:hover {
  color: #111827;
  background: #f3f4f6;
}

.icon-btn.danger:hover {
  color: #dc2626;
  background: #fee2e2;
}

.empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.empty-sub {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.alert {
  margin: 18px 28px 0;
  border-radius: 9px;
  padding: 11px 13px;
  font-size: 13px;
  font-weight: 600;
}

.alert-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.skeleton-row td {
  padding: 14px;
}

.sk {
  border-radius: 5px;
  background: #e5e7eb;
  animation: pulse 1.4s ease-in-out infinite;
}

.sk-name { height: 14px; width: 80%; }
.sk-city { height: 14px; width: 70%; }
.sk-contact { height: 14px; width: 82%; }
.sk-address { height: 14px; width: 90%; }
.sk-icon { height: 14px; width: 48px; margin-left: auto; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
</style>
