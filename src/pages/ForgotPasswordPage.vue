<template>
  <AuthLayout>
    <div>
      <h2 class="text-2xl font-bold text-blue-900 mb-2">Forgot Password?</h2>
      <p class="text-gray-600 text-sm mb-6">Enter your email and we'll send you a link to reset your password.</p>
      <form @submit.prevent="handleSubmit" class="space-y-4">
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

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>

        <p v-if="successMessage" class="text-green-600 text-sm text-center bg-green-50 p-3 rounded">
          {{ successMessage }}
        </p>

        <p class="text-center text-sm text-gray-600">
          Remember your password?
          <router-link to="/login" class="text-blue-500 hover:text-blue-600 font-semibold">Sign in</router-link>
        </p>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '../services/AuthService';
import AuthLayout from '../layouts/AuthLayout.vue';

const loading = ref(false);
const errors = ref({});
const successMessage = ref('');

const form = ref({
  email: '',
});

const handleSubmit = async () => {
  loading.value = true;
  errors.value = {};
  successMessage.value = '';

  try {
    const response = await axiosInstance.post('/password/email', form.value);
    successMessage.value = response.data.message || 'If an account with that email exists, a reset link has been sent.';
    form.value.email = '';
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
