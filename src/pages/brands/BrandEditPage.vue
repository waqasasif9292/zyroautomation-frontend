<template>
  <AppLayout>
    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <div class="page-body">
      <SettingsSubNav />
      <main class="page-content">
        <!-- 404 state -->
        <BrandFormCard v-if="notFound" title="Edit Brand" subtitle="">
          <div class="not-found">
            <p class="not-found-text">Brand not found.</p>
            <button class="btn-back" @click="router.push('/brands')">← Go back to Brands</button>
          </div>
        </BrandFormCard>

        <!-- Loading skeleton -->
        <BrandFormCard v-else-if="pageLoading" title="Edit Brand" subtitle="Update the details for this brand.">
          <div class="sk-block sk-title"></div>
          <div class="sk-block sk-checklist"></div>
          <div class="sk-block sk-webhook"></div>
        </BrandFormCard>

        <!-- Form -->
        <BrandFormCard v-else title="Edit Brand" subtitle="Update the details for this brand.">
          <!-- Brand Name -->
          <div class="form-group">
            <label class="form-label">Brand Name</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.name }"
              placeholder="e.g. Zyro Store"
              maxlength="100"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <!-- Sources -->
          <div class="form-group">
            <label class="form-label">Sources</label>
            <p class="form-sublabel">Select all channels this brand receives orders from.</p>
            <SourceChecklist
              v-model="form.sources"
              :customSources="customSources"
              :error="errors.sources"
            />
          </div>

          <!-- Webhook URL -->
          <WebhookUrlField
            :webhookUrl="currentWebhookUrl"
            @requestRegenerate="showRegenModal = true"
          />

          <!-- Actions -->
          <div class="panel-actions">
            <button
              type="button"
              class="btn-cancel"
              :disabled="saving"
              @click="router.push('/brands')"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-save"
              :disabled="saving"
              @click="handleSubmit"
            >
              <span v-if="saving" class="spinner"></span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </BrandFormCard>
      </main>
    </div>

    <!-- Regenerate Modal -->
    <WebhookRegenModal
      :show="showRegenModal"
      :brandName="form.name"
      :loading="regenLoading"
      @confirm="handleRegenerate"
      @cancel="showRegenModal = false"
    />
  </AppLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import BrandFormCard from '../../components/brands/BrandFormCard.vue';
import SourceChecklist from '../../components/brands/SourceChecklist.vue';
import WebhookUrlField from '../../components/brands/WebhookUrlField.vue';
import WebhookRegenModal from '../../components/brands/WebhookRegenModal.vue';
import { useBrandStore } from '../../stores/brandStore';

const router     = useRouter();
const route      = useRoute();
const brandStore = useBrandStore();

const id                = route.params.id;
const pageLoading       = ref(true);
const notFound          = ref(false);
const saving            = ref(false);
const regenLoading      = ref(false);
const showRegenModal    = ref(false);
const currentWebhookUrl = ref('');
const customSources     = ref([]);
const toast             = ref('');
const errors            = reactive({});

const form = reactive({
  name:    '',
  sources: [],
});

const showToast = (msg) => {
  toast.value = msg;
  setTimeout(() => { toast.value = ''; }, 4000);
};

onMounted(async () => {
  try {
    const [brand, sources] = await Promise.all([
      brandStore.fetchBrand(id),
      brandStore.fetchCustomSources().catch(() => []),
    ]);

    form.name           = brand.name;
    form.sources        = [...(brand.sources ?? [])];
    currentWebhookUrl.value = brand.webhook_url;
    customSources.value = sources;
  } catch (err) {
    if (err.response?.status === 404) {
      notFound.value = true;
    }
  } finally {
    pageLoading.value = false;
  }
});

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k]);

  let valid = true;

  if (!form.name.trim()) {
    errors.name = 'Brand name is required.';
    valid = false;
  }

  if (form.sources.length === 0) {
    errors.sources = 'Please select at least one source.';
    valid = false;
  }

  if (!valid) return;

  saving.value = true;
  try {
    await brandStore.updateBrand(id, { name: form.name.trim(), sources: form.sources });
    router.push('/brands?toast=updated');
  } catch (err) {
    const data = err.response?.data;
    if (data?.errors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(data.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      ));
    } else {
      errors.name = data?.message ?? 'Something went wrong.';
    }
  } finally {
    saving.value = false;
  }
};

const handleRegenerate = async () => {
  regenLoading.value = true;
  try {
    const updated = await brandStore.regenerateWebhook(id);
    currentWebhookUrl.value = updated.webhook_url;
    showRegenModal.value    = false;
    showToast('Webhook URL regenerated. Update your Shopify settings.');
  } catch {
    showRegenModal.value = false;
  } finally {
    regenLoading.value = false;
  }
};

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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-sublabel {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: -2px;
}

.form-input {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
  color: #111827;
  outline: none;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.form-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.07);
}

.form-input::placeholder {
  color: #9ca3af;
}

.input-error {
  border-color: #dc2626 !important;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.btn-cancel {
  padding: 9px 18px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save {
  padding: 9px 18px;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
  min-width: 120px;
  justify-content: center;
}

.btn-save:hover:not(:disabled) {
  background: #1f2937;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Not found */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 20px 0;
}

.not-found-text {
  font-size: 15px;
  color: #374151;
}

.btn-back {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13.5px;
  cursor: pointer;
}

.btn-back:hover {
  text-decoration: underline;
}

/* Skeleton */
.sk-block {
  border-radius: 7px;
  background: #e5e7eb;
  animation: pulse 1.4s ease-in-out infinite;
}

.sk-title    { height: 38px; }
.sk-checklist { height: 180px; }
.sk-webhook  { height: 80px; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

/* Toast */
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
