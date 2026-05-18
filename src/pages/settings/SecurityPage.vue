<template>
  <AppLayout>
    <div class="settings-wrapper">
      <div class="settings-body">
        <SettingsSubNav activeKey="security" />

        <main class="settings-content">
          <section class="content-panel">
            <div class="panel-header">
              <h1>Change Password</h1>
              <p>Update your password to keep your account secure.</p>
            </div>

            <form class="panel-body" @submit.prevent="handleChangePassword">
              <div v-if="errors.general" class="alert alert-error">{{ errors.general }}</div>

              <div class="form-group">
                <label class="form-label">Current Password</label>
                <div class="password-field">
                  <input
                    v-model="form.current_password"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    :class="['form-input', { 'input-error': errors.current_password }]"
                    placeholder="Current password"
                    required
                  >
                  <button type="button" class="visibility-btn" @click="showCurrentPassword = !showCurrentPassword">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7S3.73 16.06 2.46 12Z" />
                    </svg>
                  </button>
                </div>
                <span v-if="errors.current_password" class="field-error">{{ firstError(errors.current_password) }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="password-field">
                  <input
                    v-model="form.password"
                    :type="showNewPassword ? 'text' : 'password'"
                    :class="['form-input', { 'input-error': errors.password }]"
                    placeholder="New password"
                    required
                  >
                  <button type="button" class="visibility-btn" @click="showNewPassword = !showNewPassword">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7S3.73 16.06 2.46 12Z" />
                    </svg>
                  </button>
                </div>
                <span v-if="errors.password" class="field-error">{{ firstError(errors.password) }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input
                  v-model="form.password_confirmation"
                  type="password"
                  :class="['form-input', { 'input-error': passwordMismatch }]"
                  placeholder="Confirm new password"
                  required
                >
                <span v-if="passwordMismatch" class="field-error">Passwords do not match.</span>
              </div>

              <div class="panel-actions">
                <button class="btn-cancel" type="button" @click="resetForm">Cancel</button>
                <button class="btn-save" type="submit" :disabled="loading || passwordMismatch">
                  {{ loading ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../services/AuthService';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const errors = ref({});

const form = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
});

const passwordMismatch = computed(() => (
  form.value.password_confirmation &&
  form.value.password !== form.value.password_confirmation
));

const firstError = value => Array.isArray(value) ? value[0] : value;

const resetForm = () => {
  form.value = {
    current_password: '',
    password: '',
    password_confirmation: '',
  };
  errors.value = {};
};

const handleChangePassword = async () => {
  if (passwordMismatch.value) return;

  loading.value = true;
  errors.value = {};

  try {
    await axiosInstance.put('/user/password', form.value);
    authStore.clearAuth();
    router.push('/login');
  } catch (error) {
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {};
    } else {
      errors.value.general = error.response?.data?.message || 'Unable to update password.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.settings-wrapper {
  min-height: 100vh;
  background: #f1f5f9;
}

.settings-body {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 28px;
}

.settings-content {
  flex: 1;
  min-width: 0;
}

.content-panel {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.panel-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h1 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
  font-weight: 800;
}

.panel-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 28px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

.password-field {
  position: relative;
}

.form-input {
  width: 100%;
  height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 15px;
  outline: none;
  padding: 0 42px 0 12px;
}

.form-input:focus {
  border-color: #1e293b;
}

.input-error {
  border-color: #ef4444;
}

.visibility-btn {
  position: absolute;
  top: 50%;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transform: translateY(-50%);
}

.field-error {
  color: #ef4444;
  font-size: 13px;
}

.alert-error {
  border-radius: 8px;
  background: #fee2e2;
  color: #991b1b;
  padding: 11px 13px;
  font-size: 13px;
  font-weight: 700;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

.btn-cancel,
.btn-save {
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  padding: 10px 14px;
}

.btn-cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-save {
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
}

.btn-save:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 900px) {
  .settings-body {
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .settings-body {
    padding: 20px 16px;
  }

  .panel-header,
  .panel-body {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
