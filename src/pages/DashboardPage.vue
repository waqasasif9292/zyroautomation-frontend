<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Dashboard</h2>
        <p class="text-gray-600">Welcome to Zyro Automation. This is your main dashboard.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import TopBar from '../components/TopBar.vue';
</script>
