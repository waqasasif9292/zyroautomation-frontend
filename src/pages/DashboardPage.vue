<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-blue-900">Zyro Automation</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-700">Welcome, {{ authStore.user?.name }}</span>
          <router-link to="/settings/security" class="text-blue-500 hover:text-blue-600">Settings</router-link>
          <button @click="handleLogout" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Logout</button>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Dashboard</h2>
        <p class="text-gray-600">Welcome to Zyro Automation. This is your main dashboard.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
};
</script>
