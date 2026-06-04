<template>
  <AppLayout>
    <main class="access-denied">
      <section class="access-panel">
        <p class="eyebrow">Access restricted</p>
        <h1>No module access assigned</h1>
        <p>
          Your account does not have permission for this section. Ask a workspace admin
          to update your collaborator permissions.
        </p>
        <button type="button" @click="authStore.logout">Logout</button>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import AppLayout from '../layouts/AppLayout.vue';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
</script>

<style scoped>
.access-denied {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: #f8fafc;
}

.access-panel {
  width: min(460px, 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 28px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.eyebrow {
  margin-bottom: 8px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.2;
}

p {
  color: #475569;
  line-height: 1.55;
}

button {
  margin-top: 22px;
  border: none;
  border-radius: 6px;
  background: #0f172a;
  color: #fff;
  padding: 11px 16px;
  font-weight: 800;
  cursor: pointer;
}

button:hover {
  background: #1e293b;
}
</style>
