<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <div class="page-body">
      <SettingsSubNav activeKey="team" />

      <main class="page-content">
        <div class="content-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Team Members</h2>
              <p class="panel-subtitle">Manage admins and collaborators for this workspace.</p>
            </div>
            <button class="btn-add" type="button" @click="router.push('/settings/team-members/create')">+ Add Member</button>
          </div>

          <div class="panel-body">
            <div v-if="loading" class="empty-state">Loading team members...</div>
            <div v-else-if="!members.length" class="empty-state">
              <p>No team members added yet.</p>
              <button class="btn-add" type="button" @click="router.push('/settings/team-members/create')">+ Add Member</button>
            </div>

            <table v-else class="members-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Module Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in members" :key="member.id">
                  <td class="strong">{{ member.name }}</td>
                  <td>{{ member.email }}</td>
                  <td><span class="role-pill">{{ roleLabel(member.role) }}</span></td>
                  <td>{{ permissionsLabel(member) }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="btn-secondary" type="button" @click="router.push(`/settings/team-members/${member.id}/edit`)">Edit</button>
                      <button class="btn-danger" type="button" @click="openDelete(member)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <ConfirmDialog
      :show="deleteOpen"
      title="Delete Team Member?"
      message="This user will lose access to the workspace."
      :details="deleteTarget?.name || 'Team member'"
      eyebrow="Team"
      confirmText="Delete Member"
      cancelText="Keep Member"
      variant="danger"
      :loading="deleteLoading"
      @cancel="closeDelete"
      @confirm="deleteMember"
    />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import TeamMemberService from '../../services/TeamMemberService';
import { sidebarPermissions } from '../../constants/sidebarPermissions';

const router = useRouter();
const route = useRoute();
const members = ref([]);
const loading = ref(false);
const toast = ref('');
const deleteOpen = ref(false);
const deleteLoading = ref(false);
const deleteTarget = ref(null);

const permissionLabels = computed(() => Object.fromEntries(sidebarPermissions.map(item => [item.key, item.label])));

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const loadMembers = async () => {
  loading.value = true;
  try {
    const res = await TeamMemberService.list();
    members.value = res.data.data.members;
  } finally {
    loading.value = false;
  }
};

const openDelete = (member) => {
  deleteTarget.value = member;
  deleteOpen.value = true;
};

const closeDelete = () => {
  deleteOpen.value = false;
  deleteTarget.value = null;
};

const deleteMember = async () => {
  if (!deleteTarget.value) return;
  deleteLoading.value = true;
  try {
    await TeamMemberService.delete(deleteTarget.value.id);
    closeDelete();
    showToast('Team member deleted.');
    await loadMembers();
  } finally {
    deleteLoading.value = false;
  }
};

const roleLabel = role => role === 'admin' ? 'Admin' : 'Collaborator';
const permissionsLabel = (member) => {
  if (member.role === 'admin') return 'All permissions';
  return (member.permissions || []).map(key => permissionLabels.value[key] || key).join(', ') || 'No permissions';
};

onMounted(async () => {
  await loadMembers();
  if (route.query.toast === 'created') {
    showToast('Team member added.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Team member updated.');
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

.page-content { flex: 1; min-width: 0; }

.content-panel {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f3f4f6;
  padding: 24px 32px;
}

.panel-title {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 700;
}

.panel-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.panel-body { padding: 24px 32px; }

.btn-add,
.btn-secondary,
.btn-danger {
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
}

.btn-add {
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
}

.btn-secondary {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.btn-danger {
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #e2e8f0;
  padding: 13px 10px;
  color: #334155;
  font-size: 14px;
  text-align: left;
  vertical-align: middle;
}

th {
  color: #64748b;
  font-weight: 800;
}

.strong {
  color: #0f172a;
  font-weight: 800;
}

.role-pill {
  display: inline-flex;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 800;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #64748b;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 9999;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
  font-size: 13.5px;
  font-weight: 600;
}

.toast-fade-enter-active,
.toast-fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-fade-enter-from,
.toast-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
