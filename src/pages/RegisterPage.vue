<template>
  <AuthLayout>
    <div>
      <h2 class="text-2xl font-bold text-blue-900 mb-6">Create Account</h2>
      <p v-if="errors.general" class="text-red-500 text-sm bg-red-50 p-3 rounded mb-4">{{ errors.general }}</p>
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            placeholder="John Doe"
            required
          />
          <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name[0] }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Business Email</label>
          <input
            v-model="form.email"
            type="email"
            @blur="validateEmail"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            :class="{ 'border-red-500': errors.email }"
            placeholder="your@business.com"
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
              @blur="validatePassword"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
              :class="{ 'border-red-500': errors.password }"
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

          <!-- Password Strength Indicator -->
          <div v-if="form.password" class="mt-3">
            <div class="flex gap-1 h-2">
              <div
                class="flex-1 rounded-full transition-colors"
                :style="{ backgroundColor: passwordStrength === 'weak' ? '#EF4444' : '#E2E8F0' }"
              ></div>
              <div
                class="flex-1 rounded-full transition-colors"
                :style="{ backgroundColor: ['fair', 'strong'].includes(passwordStrength) ? (passwordStrength === 'fair' ? '#F59E0B' : '#22C55E') : '#E2E8F0' }"
              ></div>
              <div
                class="flex-1 rounded-full transition-colors"
                :style="{ backgroundColor: passwordStrength === 'strong' ? '#22C55E' : '#E2E8F0' }"
              ></div>
            </div>
            <p class="text-xs mt-2" :style="{ color: getPasswordStrengthColor(passwordStrength) }">
              {{ passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1) }}
            </p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">Confirm Password</label>
          <input
            v-model="form.password_confirmation"
            type="password"
            @blur="checkPasswordMatch"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            :class="{ 'border-red-500': passwordMismatch || errors.password_confirmation }"
            placeholder="••••••••"
            required
          />
          <p v-if="passwordMismatch || errors.password_confirmation" class="text-red-500 text-sm mt-1">{{ errors.password_confirmation?.[0] || 'Passwords do not match' }}</p>
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
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </button>

        <p class="text-center text-sm text-gray-600">
          Already have an account?
          <router-link to="/login" class="text-blue-500 hover:text-blue-600 font-semibold">Sign in</router-link>
        </p>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useAuthValidation } from '../composables/useAuthValidation.js';
import AuthLayout from '../layouts/AuthLayout.vue';

const router = useRouter();
const authStore = useAuthStore();
const { validatePasswordStrength, getPasswordStrengthColor, validatePasswordMatch } = useAuthValidation();

const loading = ref(false);
const showPassword = ref(false);
const errors = ref({});
const passwordMismatch = ref(false);

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
});

const passwordStrength = computed(() => validatePasswordStrength(form.value.password));

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.value.email)) {
    errors.value.email = ['Please enter a valid email address'];
  } else {
    delete errors.value.email;
  }
};

const validatePassword = () => {
  if (form.value.password.length < 8) {
    errors.value.password = ['Password must be at least 8 characters'];
  } else if (!/[A-Z]/.test(form.value.password) || !/\d/.test(form.value.password) || !/[@$!%*?&]/.test(form.value.password)) {
    errors.value.password = ['Password must contain uppercase, number, and special character'];
  } else {
    delete errors.value.password;
  }
};

const checkPasswordMatch = () => {
  passwordMismatch.value = !validatePasswordMatch(form.value.password, form.value.password_confirmation);
};

const handleRegister = async () => {
  errors.value = {};

  if (form.value.password !== form.value.password_confirmation) {
    errors.value.password_confirmation = ['Passwords do not match'];
    return;
  }

  loading.value = true;

  try {
    await authStore.register(form.value);
    router.push('/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {};
    } else if (error.response?.status) {
      errors.value.general = error.response?.data?.message || 'An error occurred. Please try again.';
    } else {
      errors.value.general = 'Failed to connect to server. Please check your connection.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
