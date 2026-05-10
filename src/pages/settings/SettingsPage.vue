<template>
  <AppLayout>
  <div class="settings-wrapper">

    <!-- Body -->
    <div class="settings-body">
      <!-- Sidebar -->
      <SettingsSubNav :activeKey="activeTab" @change="handleNavClick" />

      <!-- Content -->
      <main class="settings-content">

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Profile</h2>
            <p class="panel-subtitle">Update your personal information and account details.</p>
          </div>

          <div class="panel-body">
            <!-- Alert -->
            <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
            <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

            <!-- Name Row -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">First name</label>
                <input
                  class="form-input"
                  type="text"
                  v-model="form.first_name"
                  placeholder="First name"
                  :class="{ 'input-error': errors.first_name }"
                />
                <span v-if="errors.first_name" class="field-error">{{ errors.first_name }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">Last name</label>
                <input
                  class="form-input"
                  type="text"
                  v-model="form.last_name"
                  placeholder="Last name"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                class="form-input"
                type="email"
                v-model="form.email"
                placeholder="Email address"
                :class="{ 'input-error': errors.email }"
              />
              <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
            </div>

            <!-- Bio -->
            <div class="form-group">
              <label class="form-label">Bio</label>
              <textarea
                class="form-textarea"
                v-model="form.bio"
                placeholder="Tell us about yourself"
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="panel-actions">
              <button class="btn-cancel" type="button" @click="resetForm">Cancel</button>
              <button class="btn-save" type="button" @click="saveProfile" :disabled="saving">
                <span v-if="saving">Saving...</span>
                <span v-else>Save changes</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Brands Tab -->
        <div v-else-if="activeTab === 'brands'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Brands</h2>
            <p class="panel-subtitle">Manage your brand identities and assets.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Brand settings coming soon.</p>
          </div>
        </div>

        <!-- Integrations Tab -->
        <div v-else-if="activeTab === 'integrations'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Integrations</h2>
            <p class="panel-subtitle">Connect your favourite tools and services.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Integration settings coming soon.</p>
          </div>
        </div>

        <!-- Notifications Tab -->
        <div v-else-if="activeTab === 'notifications'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Notifications</h2>
            <p class="panel-subtitle">Control how and when you get notified.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Notification settings coming soon.</p>
          </div>
        </div>

        <!-- Billing Tab -->
        <div v-else-if="activeTab === 'billing'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Billing</h2>
            <p class="panel-subtitle">Manage your subscription and payment methods.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Billing settings coming soon.</p>
          </div>
        </div>

        <!-- Team Tab -->
        <div v-else-if="activeTab === 'team'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Team</h2>
            <p class="panel-subtitle">Invite and manage your team members.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Team settings coming soon.</p>
          </div>
        </div>

        <!-- Security Tab -->
        <div v-else-if="activeTab === 'security'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Security</h2>
            <p class="panel-subtitle">Keep your account secure.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Security settings coming soon.</p>
          </div>
        </div>

      </main>
    </div>
  </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';

const router    = useRouter();
const authStore = useAuthStore();
const activeTab = ref('profile');

const handleNavClick = (key) => {
  activeTab.value = key;
};
const saving = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const errors = reactive({});

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  bio: '',
});


const loadFromStore = () => {
  const u = authStore.user;
  if (!u) return;
  form.first_name = u.first_name ?? u.name?.split(' ')[0] ?? '';
  form.last_name  = u.last_name  ?? u.name?.split(' ').slice(1).join(' ') ?? '';
  form.email      = u.email ?? '';
  form.bio        = u.bio ?? '';
};

loadFromStore();

watch(() => authStore.user, loadFromStore);

const resetForm = () => {
  loadFromStore();
  Object.keys(errors).forEach(k => delete errors[k]);
  successMsg.value = '';
  errorMsg.value = '';
};

const saveProfile = async () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  successMsg.value = '';
  errorMsg.value = '';
  saving.value = true;

  try {
    await authStore.updateProfile({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      bio: form.bio,
    });
    successMsg.value = 'Profile updated successfully.';
    setTimeout(() => { successMsg.value = ''; }, 3000);
  } catch (err) {
    const data = err.response?.data;
    if (data?.errors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(data.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      ));
    } else {
      errorMsg.value = data?.message ?? 'Failed to update profile.';
    }
  } finally {
    saving.value = false;
  }
};

</script>

<style scoped>
.settings-wrapper {
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Body */
.settings-body {
  display: flex;
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 40px auto;
  padding: 0 28px;
  gap: 32px;
  align-items: flex-start;
}

/* Sidebar */
.settings-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13.5px;
  color: #374151;
  font-weight: 500;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.nav-item.active .nav-icon {
  color: #1d4ed8;
}

.nav-icon {
  display: flex;
  align-items: center;
  color: #9ca3af;
  flex-shrink: 0;
}

/* Content */
.settings-content {
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
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.panel-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.panel-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Form */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.form-input {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #fff;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
  color: #111827;
  outline: none;
  resize: vertical;
  min-height: 96px;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #fff;
}

.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea::placeholder,
.form-input::placeholder {
  color: #9ca3af;
}

/* Actions */
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

.btn-cancel:hover {
  background: #f9fafb;
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
  transition: background 0.15s;
}

.btn-save:hover {
  background: #1f2937;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 10px 14px;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
}

.alert-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.input-error {
  border-color: #dc2626 !important;
}

.field-error {
  font-size: 11.5px;
  color: #dc2626;
  margin-top: 2px;
}
</style>
