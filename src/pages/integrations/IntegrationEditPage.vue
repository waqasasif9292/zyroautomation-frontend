<template>
  <AppLayout>
    <div class="page-body">
      <SettingsSubNav activeKey="integrations" />

      <main class="page-content">
        <IntegrationFormCard
          title="Edit Integration"
          subtitle="Update the configuration for this integration."
          :loading="initialLoading"
        >
          <template v-if="notFound">
            <div class="not-found">
              <p class="not-found-title">Integration not found.</p>
              <button class="btn-secondary" @click="router.push('/integrations')">Go back to Integrations</button>
            </div>
          </template>
          <template v-else>
            <section class="section">
              <header class="section-header">
                <div>
                  <p class="section-title">Name</p>
                  <p class="section-subtitle">Update the label for this courier account.</p>
                </div>
              </header>
              <div class="form-group">
                <input
                  v-model="form.name"
                  class="form-input"
                  :class="{ 'input-error': errors.name }"
                  type="text"
                  placeholder="Main PostEx account"
                />
                <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
              </div>
            </section>

            <div class="divider"></div>

            <section class="section">
              <header class="section-header">
                <div>
                  <p class="section-title">Courier</p>
                  <p class="section-subtitle">Courier cannot be changed. Delete this integration and create a new one to use a different courier.</p>
                </div>
              </header>
              <CourierSelector v-model="form.courier_slug" :disabled="true" :disabledSlug="form.courier_slug" />
              <p class="helper-text">Courier cannot be changed. Delete this integration and create a new one to use a different courier.</p>
            </section>

            <div class="divider"></div>

            <section class="section">
              <header class="section-header">
                <div>
                  <p class="section-title">Courier Options</p>
                  <p class="section-subtitle">Configuration fields will appear in a future update for {{ courierName }}.</p>
                </div>
              </header>
              <PostexOptionsForm
                v-if="form.courier_slug === 'postex'"
                v-model="form.courier_options"
                :errorMessage="postexError"
              />
              <CourierOptionsBox v-else :courierSlug="form.courier_slug" />
            </section>
          </template>

          <template #footer v-if="!notFound">
            <button class="btn-secondary" type="button" :disabled="saving" @click="router.push('/integrations')">Cancel</button>
            <button class="btn-primary" type="button" :disabled="disableSave" @click="handleSubmit">
              <span v-if="saving" class="spinner"></span>
              <span v-else>Save Changes</span>
            </button>
          </template>
        </IntegrationFormCard>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import IntegrationFormCard from '../../components/integrations/IntegrationFormCard.vue';
import CourierSelector from '../../components/integrations/CourierSelector.vue';
import CourierOptionsBox from '../../components/integrations/CourierOptionsBox.vue';
import PostexOptionsForm from '../../components/integrations/PostexOptionsForm.vue';
import { getCourierName } from '../../constants/couriers';
import { useIntegrationStore } from '../../stores/integrationStore';

const router = useRouter();
const route = useRoute();
const integrationStore = useIntegrationStore();

const form = reactive({
  id: '',
  name: '',
  courier_slug: '',
  courier_options: {},
});

const errors = reactive({});
const initialLoading = ref(true);
const saving = ref(false);
const notFound = ref(false);

const courierName = computed(() => getCourierName(form.courier_slug));
const postexIncomplete = computed(() => {
  if (form.courier_slug !== 'postex') return false;
  return !form.courier_options.api_token || !form.courier_options.pickup_address_code;
});
const postexError = computed(() => {
  if (form.courier_slug !== 'postex') return '';
  if (!form.courier_options.api_token) return 'The PostEx API token is required.';
  if (!form.courier_options.pickup_address_code) return 'Please fetch and select a PostEx pickup address.';
  return '';
});
const disableSave = computed(() => saving.value || !form.name.trim() || postexIncomplete.value);

const handleSubmit = async () => {
  if (disableSave.value) return;
  saving.value = true;
  try {
    await integrationStore.updateIntegration(form.id, {
      name: form.name.trim(),
      courier_options: form.courier_options,
    });
    router.push({ path: '/integrations', query: { toast: 'updated' } });
  } catch (error) {
    if (error.response?.data?.errors) {
      Object.assign(errors, error.response.data.errors);
    }
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  try {
    const integration = await integrationStore.fetchIntegration(route.params.id);
    form.id = integration.id;
    form.name = integration.name || '';
    form.courier_slug = integration.courier_slug;
    form.courier_options = integration.courier_options || {};
  } catch (error) {
    notFound.value = true;
  } finally {
    initialLoading.value = false;
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

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.section-subtitle {
  font-size: 13px;
  color: #9ca3af;
  margin: 4px 0 0;
}

.divider {
  border-top: 1px solid #f3f4f6;
  margin: 28px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  font-size: 15px;
  color: #111827;
}

.form-input:focus {
  outline: none;
  border-color: #1e293b;
}

.input-error {
  border-color: #ef4444 !important;
}

.field-error {
  font-size: 13px;
  color: #ef4444;
}

.helper-text {
  font-size: 13px;
  color: #9ca3af;
}

.btn-secondary,
.btn-primary {
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-primary {
  background: #1e293b;
  color: #fff;
}

.not-found {
  padding: 40px 20px;
  text-align: center;
}

.not-found-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
