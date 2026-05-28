<template>
  <div id="app">
    <transition name="global-toast-fade">
      <div
        v-if="notificationStore.message"
        class="global-toast"
        :class="`global-toast-${notificationStore.type}`"
        role="status"
      >
        {{ notificationStore.message }}
      </div>
    </transition>
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/authStore';
import { useNotificationStore } from './stores/notificationStore';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

onMounted(async () => {
  await authStore.initializeAuth();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #F8FAFC;
}

.global-toast {
  position: fixed;
  z-index: 200;
  top: 18px;
  right: 22px;
  max-width: min(380px, calc(100vw - 32px));
  border-radius: 10px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.22);
  padding: 13px 16px;
  color: #fff;
  font-size: 13px;
  font-weight: 850;
  line-height: 1.45;
}

.global-toast-success {
  border: 1px solid #bbf7d0;
  background: #14532d;
}

.global-toast-error {
  border: 1px solid #fecaca;
  background: #991b1b;
}

.global-toast-fade-enter-active,
.global-toast-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.global-toast-fade-enter-from,
.global-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
