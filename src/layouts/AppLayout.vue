<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <slot />
    </div>
  </div>
</template>

<script setup>
import AppSidebar from '../components/AppSidebar.vue';
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f9fafb;
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
