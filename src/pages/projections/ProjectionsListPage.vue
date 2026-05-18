<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="projections-page">
      <section class="projections-card">
        <div class="card-header">
          <div>
            <h1>Projections</h1>
            <p>Forecast product profit from ad spend, fulfillment costs, cancels, and returns.</p>
          </div>
          <button class="add-btn" type="button" @click="router.push('/projections/create')">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add Projection
          </button>
        </div>

        <div class="card-body">
          <div v-if="!loading && projections.length === 0" class="empty-state">
            <h2>No projections yet</h2>
            <p>Create a projection to estimate monthly profit before scaling a product.</p>
            <button class="add-btn" type="button" @click="router.push('/projections/create')">Add Projection</button>
          </div>
          <ProjectionTable
            v-else
            :projections="projections"
            :loading="loading"
            @view="id => router.push(`/projections/${id}`)"
            @edit="id => router.push(`/projections/${id}/edit`)"
            @delete="confirmDelete"
          />
        </div>
      </section>
    </main>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Projection?"
      message="This saved projection will be removed from your account."
      :details="selectedProjection?.product_name || ''"
      eyebrow="Projection deletion"
      confirmText="Delete Projection"
      cancelText="Keep Projection"
      variant="danger"
      :loading="deleteLoading"
      @cancel="closeDeleteDialog"
      @confirm="handleDelete"
    />
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import ProjectionTable from '../../components/projections/ProjectionTable.vue';
import { useProjectionStore } from '../../stores/projectionStore';

const router = useRouter();
const route = useRoute();
const projectionStore = useProjectionStore();
const { projections, loading } = storeToRefs(projectionStore);
const toast = ref('');
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const selectedProjection = ref(null);

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const confirmDelete = (projection) => {
  selectedProjection.value = projection;
  showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
  if (deleteLoading.value) return;
  showDeleteDialog.value = false;
  selectedProjection.value = null;
};

const handleDelete = async () => {
  if (!selectedProjection.value) return;
  deleteLoading.value = true;
  try {
    await projectionStore.deleteProjection(selectedProjection.value.id);
    showToast('Projection deleted.');
    showDeleteDialog.value = false;
    selectedProjection.value = null;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to delete projection.');
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(async () => {
  await projectionStore.fetchProjections();

  if (route.query.toast === 'created') {
    showToast('Projection created.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Projection updated.');
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.projections-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.projections-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h1 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
  font-weight: 800;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.card-body {
  padding: 0;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 58px 24px;
  text-align: center;
}

.empty-state h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.empty-state p {
  max-width: 420px;
  margin: 0 0 8px;
  color: #64748b;
  font-size: 14px;
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
