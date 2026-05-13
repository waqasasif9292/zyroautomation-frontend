<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <div class="page-body">
      <SettingsSubNav activeKey="integrations" />

      <main class="page-content">
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Courier Integrations</h2>
              <p class="panel-subtitle">Connect courier services.</p>
            </div>
            <button class="btn-add" @click="router.push('/integrations/create')">+ Add Integration</button>
          </div>

          <div class="panel-body">
            <IntegrationEmptyState v-if="!loading && integrations.length === 0">
              <button class="btn-add" @click="router.push('/integrations/create')">+ Add Integration</button>
            </IntegrationEmptyState>

            <IntegrationTable
              v-else
              :integrations="integrations"
              :loading="loading"
              @edit="(id) => router.push(`/integrations/${id}/edit`)"
              @delete="openDeleteModal"
            />
          </div>
        </div>
      </main>
    </div>

    <ConfirmDialog
      :show="showDelete"
      title="Delete Integration?"
      message="This courier integration will be removed from your account. Orders already created will keep their saved courier details."
      :details="selectedIntegration?.name || selectedIntegration?.courier_name || 'Courier'"
      eyebrow="Courier integration"
      confirmText="Delete Integration"
      cancelText="Keep Integration"
      variant="danger"
      :loading="deleteLoading"
      @cancel="closeDeleteModal"
      @confirm="handleDelete"
    />
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import IntegrationTable from '../../components/integrations/IntegrationTable.vue';
import IntegrationEmptyState from '../../components/integrations/IntegrationEmptyState.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import { useIntegrationStore } from '../../stores/integrationStore';

const router = useRouter();
const route = useRoute();
const integrationStore = useIntegrationStore();
const { integrations, loading } = storeToRefs(integrationStore);

const toast = ref('');
const showDelete = ref(false);
const deleteLoading = ref(false);
const selectedIntegration = ref(null);

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => {
    toast.value = '';
  }, 3000);
};

const openDeleteModal = (integration) => {
  selectedIntegration.value = integration;
  showDelete.value = true;
};

const closeDeleteModal = () => {
  showDelete.value = false;
  selectedIntegration.value = null;
};

const handleDelete = async () => {
  if (!selectedIntegration.value) return;
  deleteLoading.value = true;
  try {
    await integrationStore.deleteIntegration(selectedIntegration.value.id);
    showToast('Integration deleted.');
    showDelete.value = false;
    selectedIntegration.value = null;
  } catch (error) {
    console.error(error);
    showToast('Failed to delete integration.');
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(async () => {
  await integrationStore.fetchIntegrations();

  if (route.query.toast === 'created') {
    showToast('Integration created.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Integration updated.');
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.page-body {
  display: flex;
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 40px auto;
  padding: 0 28px;
  gap: 32px;
  align-items: flex-start;
}

.page-content {
  flex: 1;
  min-width: 0;
}

.content-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.panel-header {
  padding: 24px 32px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.panel-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.panel-body {
  padding: 24px 32px;
}

.btn-add {
  padding: 10px 18px;
  background: #1e293b;
  border: 1px solid #1e293b;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #111827;
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
</style>
