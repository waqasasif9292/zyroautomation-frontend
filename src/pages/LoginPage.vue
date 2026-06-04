<template>
  <AuthLayout>
    <div>
      <h2 class="text-2xl font-bold text-blue-900 mb-6">Sign In</h2>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            placeholder="your@email.com"
            required
          />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email[0] }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Password</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </button>
          </div>
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password[0] }}</p>
        </div>

        <div class="flex items-center">
          <input v-model="form.remember" type="checkbox" id="remember" class="w-4 h-4 rounded border-gray-300" />
          <label for="remember" class="ml-2 text-sm text-gray-700">Remember me for 30 days</label>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <p class="text-center text-sm text-gray-600">
          Don't have an account?
          <router-link to="/register" class="text-blue-500 hover:text-blue-600 font-semibold">Create one</router-link>
        </p>

        <p class="text-center text-sm">
          <router-link to="/forgot-password" class="text-blue-500 hover:text-blue-600">Forgot password?</router-link>
        </p>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { firstAccessiblePath } from '../constants/sidebarPermissions';
import AuthLayout from '../layouts/AuthLayout.vue';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const showPassword = ref(false);
const errors = ref({});

const form = ref({
  email: '',
  password: '',
  remember: false,
});

const handleLogin = async () => {
  loading.value = true;
  errors.value = {};

  try {
    await authStore.login(form.value);
    router.push(firstAccessiblePath(authStore.user));
  } catch (error) {
    if (error.response?.status === 429) {
      errors.value.general = 'Too many login attempts. Please try again later.';
    } else if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {};
    } else if (error.response?.status === 401) {
      errors.value.email = ['Invalid email or password.'];
    } else {
      errors.value.general = error.response?.data?.message || 'An error occurred. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
