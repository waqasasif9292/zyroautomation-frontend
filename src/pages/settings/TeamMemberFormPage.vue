<template>
  <AppLayout>
    <div class="page-body">
      <SettingsSubNav activeKey="team" />

      <main class="page-content">
        <div class="form-card">
          <div class="card-header">
            <div>
              <h2>{{ isEdit ? 'Edit Team Member' : 'Add Team Member' }}</h2>
              <p>{{ isEdit ? 'Update role, credentials, and module access.' : 'Create a login for an admin or collaborator.' }}</p>
            </div>
          </div>

          <div v-if="notFound" class="not-found">
            <p>Team member not found.</p>
            <button class="btn-secondary" type="button" @click="router.push('/settings/team-members')">Back to Team</button>
          </div>

          <form v-else class="member-form" @submit.prevent="saveMember">
            <section class="section">
              <header>
                <h3>Account Details</h3>
                <p>Use the same credentials format as signup.</p>
              </header>
              <div class="field-grid">
                <label>
                  <span>Name</span>
                  <input v-model="form.name" :class="{ invalid: errors.name }" type="text">
                  <small v-if="errors.name">{{ errors.name }}</small>
                </label>
                <label>
                  <span>Email</span>
                  <input v-model="form.email" :class="{ invalid: errors.email }" type="email">
                  <small v-if="errors.email">{{ errors.email }}</small>
                </label>
                <label>
                  <span>Password</span>
                  <input v-model="form.password" :class="{ invalid: errors.password }" type="password" autocomplete="new-password">
                  <small v-if="errors.password">{{ errors.password }}</small>
                </label>
                <label>
                  <span>Confirm password</span>
                  <input v-model="form.password_confirmation" type="password" autocomplete="new-password">
                </label>
              </div>
            </section>

            <section class="section">
              <header>
                <h3>Role</h3>
                <p>Admins get all access. Collaborators only get selected modules.</p>
              </header>
              <div class="segmented">
                <button type="button" :class="{ active: form.role === 'admin' }" @click="form.role = 'admin'">Admin</button>
                <button type="button" :class="{ active: form.role === 'collaborator' }" @click="form.role = 'collaborator'">Collaborator</button>
              </div>
            </section>

            <section class="section permissions" :class="{ disabled: form.role === 'admin' }">
              <header class="permissions-head">
                <div>
                  <h3>Module Permissions</h3>
                  <p>Choose which workspace modules this collaborator can access.</p>
                </div>
                <button type="button" class="link-btn" :disabled="form.role === 'admin'" @click="selectAllPermissions">Select all</button>
              </header>
              <div class="permission-grid">
                <label v-for="permission in permissionOptions" :key="permission.key" class="checkbox-row">
                  <input v-model="form.permissions" :value="permission.key" :disabled="form.role === 'admin'" type="checkbox">
                  <span>{{ permission.label }}</span>
                </label>
              </div>
            </section>

            <footer class="card-footer">
              <button class="btn-secondary" type="button" :disabled="saving" @click="router.push('/settings/team-members')">Cancel</button>
              <button class="btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Save Member') }}</button>
            </footer>
          </form>
        </div>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import TeamMemberService from '../../services/TeamMemberService';
import { sidebarPermissions } from '../../constants/sidebarPermissions';

const router = useRouter();
const route = useRoute();
const isEdit = computed(() => Boolean(route.params.id));
const permissionOptions = ref(sidebarPermissions);
const saving = ref(false);
const notFound = ref(false);
const errors = reactive({});

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'collaborator',
  permissions: ['dashboard', 'orders'],
});

const resetErrors = () => Object.keys(errors).forEach(key => delete errors[key]);
const selectAllPermissions = () => {
  form.permissions = permissionOptions.value.map(item => item.key);
};

const loadMember = async () => {
  if (!isEdit.value) return;
  const res = await TeamMemberService.list();
  permissionOptions.value = res.data.data.permissions || sidebarPermissions;
  const member = res.data.data.members.find(item => item.id === route.params.id);
  if (!member) {
    notFound.value = true;
    return;
  }

  Object.assign(form, {
    name: member.name,
    email: member.email,
    password: '',
    password_confirmation: '',
    role: member.role,
    permissions: [...(member.permissions || [])],
  });
};

const payload = () => ({
  name: form.name,
  email: form.email,
  password: form.password,
  password_confirmation: form.password_confirmation,
  role: form.role,
  permissions: form.role === 'admin' ? [] : form.permissions,
});

const saveMember = async () => {
  saving.value = true;
  resetErrors();
  try {
    if (isEdit.value) {
      await TeamMemberService.update(route.params.id, payload());
      router.push({ path: '/settings/team-members', query: { toast: 'updated' } });
    } else {
      await TeamMemberService.create(payload());
      router.push({ path: '/settings/team-members', query: { toast: 'created' } });
    }
  } catch (error) {
    const responseErrors = error.response?.data?.errors || {};
    Object.assign(errors, Object.fromEntries(
      Object.entries(responseErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    ));
  } finally {
    saving.value = false;
  }
};

onMounted(loadMember);
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

.page-content { flex: 1; min-width: 0; }

.form-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
}

.card-header {
  border-bottom: 1px solid #f3f4f6;
  padding: 24px 32px;
}

.card-header h2 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 700;
}

.card-header p,
.section p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.member-form { padding: 28px 32px 0; }

.section {
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 24px;
  margin-bottom: 24px;
}

.section h3 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 15px;
  font-weight: 800;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #1e293b;
  padding: 10px 11px;
  font: inherit;
}

input.invalid { border-color: #ef4444; }
small { color: #dc2626; font-weight: 650; }

.segmented {
  display: inline-flex;
  margin-top: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
}

.segmented button {
  border: 0;
  background: #fff;
  color: #475569;
  padding: 10px 16px;
  font-weight: 800;
  cursor: pointer;
}

.segmented button.active { background: #1e40af; color: #fff; }

.permissions.disabled { opacity: 0.65; }

.permissions-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.checkbox-row {
  min-height: 42px;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px 12px;
}

.checkbox-row input {
  width: 16px;
  height: 16px;
  accent-color: #1d4ed8;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin: 0 -32px;
  background: #f8fafc;
  padding: 18px 32px;
}

.btn-primary,
.btn-secondary,
.link-btn {
  border-radius: 9px;
  padding: 10px 15px;
  font-weight: 800;
  cursor: pointer;
}

.btn-primary { border: 1px solid #1e293b; background: #1e293b; color: #fff; }
.btn-secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
.link-btn { border: 0; background: transparent; color: #1e40af; padding: 0; }

.not-found {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

@media (max-width: 760px) {
  .field-grid,
  .permission-grid { grid-template-columns: 1fr; }
}
</style>
