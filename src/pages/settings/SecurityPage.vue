<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow p-8">
        <h1 class="text-3xl font-bold text-blue-900 mb-2">Security Settings</h1>
        <p class="text-gray-600 mb-8">Change your password to keep your account secure.</p>

        <form @submit.prevent="handleChangePassword" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">Current Password</label>
            <div class="relative">
              <input
                v-model="form.current_password"
                :type="showCurrentPassword ? 'text' : 'password'"
                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                :class="{ 'border-red-500': errors.current_password }"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                @click="showCurrentPassword = !showCurrentPassword"
                class="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                <svg v-if="!showCurrentPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
            </div>
            <p v-if="errors.current_password" class="text-red-500 text-sm mt-1">{{ errors.current_password[0] }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">New Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showNewPassword ? 'text' : 'password'"
                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                :class="{ 'border-red-500': errors.password }"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                @click="showNewPassword = !showNewPassword"
                class="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                <svg v-if="!showNewPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">Confirm New Password</label>
            <input
              v-model="form.password_confirmation"
              type="password"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              :class="{ 'border-red-500': passwordMismatch }"
              placeholder="••••••••"
              required
            />
            <p v-if="passwordMismatch" class="text-red-500 text-sm mt-1">Passwords do not match</p>
          </div>

          <button
            type="submit"
            :disabled="loading || passwordMismatch"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Updating...' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../services/AuthService';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const errors = ref({});
const passwordMismatch = ref(false);

const form = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
});

const handleChangePassword = async () => {
  if (form.value.password !== form.value.password_confirmation) {
    passwordMismatch.value = true;
    return;
  }

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
      errors.value.general = error.response?.data?.message || 'An error occurred. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
