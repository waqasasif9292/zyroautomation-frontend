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
                :errorMessage="errors.postex || postexError"
              />
              <LeopardOptionsForm
                v-else-if="form.courier_slug === 'leopard'"
                v-model="form.courier_options"
                :apiKeyError="errors.leopardApiKey || leopardApiKeyError"
                :apiPasswordError="errors.leopardApiPassword || leopardApiPasswordError"
                :generalError="errors.leopard"
              />
              <DastaqOptionsForm
                v-else-if="form.courier_slug === 'dastaq'"
                v-model="form.courier_options"
                :apiKeyError="errors.dastaqApiKey || dastaqApiKeyError"
                :apiSecretError="errors.dastaqApiSecret || dastaqApiSecretError"
                :generalError="errors.dastaq"
              />
              <ArgoOptionsForm
                v-else-if="form.courier_slug === 'argo'"
                v-model="form.courier_options"
                :apiKeyError="errors.argoApiKey || argoApiKeyError"
                :apiSecretError="errors.argoApiSecret || argoApiSecretError"
                :generalError="errors.argo"
              />
              <TraxOptionsForm
                v-else-if="form.courier_slug === 'trax'"
                v-model="form.courier_options"
                :apiKeyError="errors.traxApiKey || traxApiKeyError"
                :generalError="errors.trax"
              />
              <TcsOptionsForm
                v-else-if="form.courier_slug === 'tcs'"
                v-model="form.courier_options"
                :usernameError="errors.tcsUsername || tcsUsernameError"
                :passwordError="errors.tcsPassword || tcsPasswordError"
                :bearerTokenError="errors.tcsBearerToken || tcsBearerTokenError"
                :generalError="errors.tcs"
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import IntegrationFormCard from '../../components/integrations/IntegrationFormCard.vue';
import CourierSelector from '../../components/integrations/CourierSelector.vue';
import CourierOptionsBox from '../../components/integrations/CourierOptionsBox.vue';
import PostexOptionsForm from '../../components/integrations/PostexOptionsForm.vue';
import LeopardOptionsForm from '../../components/integrations/LeopardOptionsForm.vue';
import DastaqOptionsForm from '../../components/integrations/DastaqOptionsForm.vue';
import ArgoOptionsForm from '../../components/integrations/ArgoOptionsForm.vue';
import TraxOptionsForm from '../../components/integrations/TraxOptionsForm.vue';
import TcsOptionsForm from '../../components/integrations/TcsOptionsForm.vue';
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
  return !form.courier_options.api_token;
});
const postexError = computed(() => {
  if (form.courier_slug !== 'postex') return '';
  if (!form.courier_options.api_token) return 'The PostEx API token is required.';
  return '';
});
const leopardIncomplete = computed(() => {
  if (form.courier_slug !== 'leopard') return false;
  return !form.courier_options.api_key || !form.courier_options.api_password;
});
const leopardApiKeyError = computed(() => {
  if (form.courier_slug !== 'leopard') return '';
  if (!form.courier_options.api_key) return 'The Leopard API key is required.';
  return '';
});
const leopardApiPasswordError = computed(() => {
  if (form.courier_slug !== 'leopard') return '';
  if (!form.courier_options.api_password) return 'The Leopard API password is required.';
  return '';
});
const dastaqIncomplete = computed(() => {
  if (form.courier_slug !== 'dastaq') return false;
  return !form.courier_options.api_key || !form.courier_options.api_secret;
});
const dastaqApiKeyError = computed(() => {
  if (form.courier_slug !== 'dastaq') return '';
  if (!form.courier_options.api_key) return 'The Dastaq API key is required.';
  return '';
});
const dastaqApiSecretError = computed(() => {
  if (form.courier_slug !== 'dastaq') return '';
  if (!form.courier_options.api_secret) return 'The Dastaq API secret is required.';
  return '';
});
const argoIncomplete = computed(() => {
  if (form.courier_slug !== 'argo') return false;
  return !form.courier_options.api_key || !form.courier_options.api_secret;
});
const argoApiKeyError = computed(() => {
  if (form.courier_slug !== 'argo') return '';
  if (!form.courier_options.api_key) return 'The Argo API key is required.';
  return '';
});
const argoApiSecretError = computed(() => {
  if (form.courier_slug !== 'argo') return '';
  if (!form.courier_options.api_secret) return 'The Argo API secret is required.';
  return '';
});
const traxIncomplete = computed(() => {
  if (form.courier_slug !== 'trax') return false;
  return !form.courier_options.api_key;
});
const traxApiKeyError = computed(() => {
  if (form.courier_slug !== 'trax') return '';
  if (!form.courier_options.api_key) return 'The Trax API key is required.';
  return '';
});
const tcsIncomplete = computed(() => {
  if (form.courier_slug !== 'tcs') return false;
  return !form.courier_options.username || !form.courier_options.password || !form.courier_options.bearer_token;
});
const tcsUsernameError = computed(() => {
  if (form.courier_slug !== 'tcs') return '';
  if (!form.courier_options.username) return 'The TCS username is required.';
  return '';
});
const tcsPasswordError = computed(() => {
  if (form.courier_slug !== 'tcs') return '';
  if (!form.courier_options.password) return 'The TCS password is required.';
  return '';
});
const tcsBearerTokenError = computed(() => {
  if (form.courier_slug !== 'tcs') return '';
  if (!form.courier_options.bearer_token) return 'The TCS bearer token is required.';
  return '';
});
const disableSave = computed(() => saving.value || !form.name.trim() || postexIncomplete.value || leopardIncomplete.value || dastaqIncomplete.value || argoIncomplete.value || traxIncomplete.value || tcsIncomplete.value);

watch(() => form.courier_options.api_token, () => {
  errors.postex = '';
});
watch(() => [form.courier_options.api_key, form.courier_options.api_password], () => {
  errors.leopard = '';
  errors.leopardApiKey = '';
  errors.leopardApiPassword = '';
});
watch(() => [form.courier_options.api_key, form.courier_options.api_secret], () => {
  errors.dastaq = '';
  errors.dastaqApiKey = '';
  errors.dastaqApiSecret = '';
  errors.argo = '';
  errors.argoApiKey = '';
  errors.argoApiSecret = '';
  errors.trax = '';
  errors.traxApiKey = '';
});
watch(() => [form.courier_options.username, form.courier_options.password, form.courier_options.bearer_token], () => {
  errors.tcs = '';
  errors.tcsUsername = '';
  errors.tcsPassword = '';
  errors.tcsBearerToken = '';
});

const applyOptionErrors = (responseErrors) => {
  const optionErrors = responseErrors?.courier_options;
  errors.postex = optionErrors?.api_token?.[0] || '';
  if (form.courier_slug === 'argo') {
    errors.argoApiKey = optionErrors?.api_key?.[0] || '';
    errors.argoApiSecret = optionErrors?.api_secret?.[0] || '';
    return;
  }
  if (form.courier_slug === 'dastaq') {
    errors.dastaqApiKey = optionErrors?.api_key?.[0] || '';
    errors.dastaqApiSecret = optionErrors?.api_secret?.[0] || '';
    return;
  }
  if (form.courier_slug === 'trax') {
    errors.traxApiKey = optionErrors?.api_key?.[0] || '';
    return;
  }
  if (form.courier_slug === 'tcs') {
    errors.tcsUsername = optionErrors?.username?.[0] || '';
    errors.tcsPassword = optionErrors?.password?.[0] || '';
    errors.tcsBearerToken = optionErrors?.bearer_token?.[0] || '';
    return;
  }
  errors.leopardApiKey = optionErrors?.api_key?.[0] || '';
  errors.leopardApiPassword = optionErrors?.api_password?.[0] || '';
};

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
      applyOptionErrors(error.response.data.errors);
    } else if (error.response?.data?.message) {
      if (form.courier_slug === 'leopard') {
        errors.leopard = error.response.data.message;
      } else if (form.courier_slug === 'argo') {
        errors.argo = error.response.data.message;
      } else if (form.courier_slug === 'dastaq') {
        errors.dastaq = error.response.data.message;
      } else if (form.courier_slug === 'trax') {
        errors.trax = error.response.data.message;
      } else if (form.courier_slug === 'tcs') {
        errors.tcs = error.response.data.message;
      } else {
        errors.postex = error.response.data.message;
      }
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
    form.courier_options = integration.courier_slug === 'trax'
      ? {
          service_type_id: 1,
          information_display: 0,
          item_product_type_id: 24,
          item_insurance: 0,
          shipping_mode_id: 1,
          payment_mode_id: 1,
          charges_mode_id: 4,
          default_consignee_email: 'orders@zyroautomation.com',
          ...(integration.courier_options || {}),
        }
      : (integration.courier_options || {});
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
