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
            @ai-suggestions="getAiSuggestions"
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

    <div v-if="showAiModal" class="modal-backdrop" @click.self="closeAiModal">
      <section class="ai-modal">
        <div class="modal-header">
          <div>
            <h2>AI Improvement Suggestions</h2>
            <p>{{ selectedAiProjection?.product_name || 'Projection' }}</p>
          </div>
          <button class="modal-close" type="button" aria-label="Close modal" @click="closeAiModal">x</button>
        </div>

        <div class="modal-body">
          <p v-if="aiError" class="ai-error">{{ aiError }}</p>
          <p v-else-if="aiLoading" class="ai-loading">Reviewing projection data and preparing suggestions...</p>
          <template v-else>
            <p v-if="aiInsights.summary" class="ai-summary">{{ aiInsights.summary }}</p>
            <div v-if="aiInsights.suggestions?.length" class="suggestions-list">
              <article v-for="suggestion in aiInsights.suggestions" :key="suggestion.title" class="suggestion-card">
                <div class="suggestion-title-row">
                  <h3>{{ suggestion.title }}</h3>
                  <span>{{ suggestion.impact || 'medium' }}</span>
                </div>
                <p>{{ suggestion.recommendation }}</p>
                <small>{{ suggestion.reason }}</small>
              </article>
            </div>
            <p v-else class="ai-empty">No structured suggestions were returned.</p>
          </template>
        </div>
      </section>
    </div>
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
const showAiModal = ref(false);
const aiLoading = ref(false);
const aiError = ref('');
const selectedAiProjection = ref(null);
const aiInsights = ref({
  summary: '',
  suggestions: [],
});

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

const getAiSuggestions = async (projection) => {
  selectedAiProjection.value = projection;
  showAiModal.value = true;
  aiLoading.value = true;
  aiError.value = '';
  aiInsights.value = { summary: '', suggestions: [] };

  try {
    aiInsights.value = await projectionStore.fetchAiSuggestions(projection.id);
  } catch (error) {
    aiError.value = error.response?.data?.message || 'Failed to get AI suggestions.';
  } finally {
    aiLoading.value = false;
  }
};

const closeAiModal = () => {
  if (aiLoading.value) return;
  showAiModal.value = false;
  selectedAiProjection.value = null;
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

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.55);
}

.ai-modal {
  width: min(760px, 100%);
  max-height: min(760px, 90vh);
  overflow: hidden;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.modal-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.modal-body {
  display: grid;
  gap: 14px;
  max-height: 620px;
  overflow: auto;
  padding: 20px 22px;
}

.ai-summary {
  margin: 0;
  padding: 14px;
  border: 1px dashed #b6c6dc;
  border-radius: 8px;
  background: #f3f8ff;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.6;
}

.suggestions-list {
  display: grid;
  gap: 12px;
}

.suggestion-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.suggestion-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.suggestion-title-row h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 800;
}

.suggestion-title-row span {
  padding: 4px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.suggestion-card p {
  margin: 0;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.55;
}

.suggestion-card small {
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.ai-error,
.ai-loading,
.ai-empty {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.ai-error {
  color: #dc2626;
}

.ai-loading,
.ai-empty {
  color: #475569;
}
</style>
