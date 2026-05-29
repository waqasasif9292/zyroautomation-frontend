<template>
  <AppLayout>
    <div class="page-body">
      <SettingsSubNav />
      <main class="page-content">
        <BrandFormCard title="Add Brand" subtitle="Fill in the details to create a new brand.">
          <!-- Brand Name -->
          <div class="form-group">
            <label class="form-label">Brand Name</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.name }"
              placeholder="e.g. Zyro Store"
              maxlength="100"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="grid two">
            <div class="form-group">
              <label class="form-label">Brand Email</label>
              <input
                v-model="form.email"
                type="email"
                class="form-input"
                :class="{ 'input-error': errors.email }"
                placeholder="support@example.com"
                maxlength="160"
              />
              <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Brand Phone Number</label>
              <input
                v-model="form.phone"
                type="text"
                class="form-input"
                :class="{ 'input-error': errors.phone }"
                placeholder="+923001234567"
                maxlength="60"
              />
              <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Brand Address</label>
            <textarea
              v-model="form.address"
              class="form-input form-textarea"
              :class="{ 'input-error': errors.address }"
              placeholder="Office or warehouse address"
              maxlength="500"
              rows="3"
            ></textarea>
            <span v-if="errors.address" class="field-error">{{ errors.address }}</span>
          </div>

          <!-- Sources -->
          <div class="form-group">
            <label class="form-label">Sources</label>
            <p class="form-sublabel">Select all channels this brand receives orders from.</p>
            <SourceChecklist
              v-model="form.sources"
              :error="errors.sources"
            />
          </div>

          <!-- Actions -->
          <div class="panel-actions">
            <button
              type="button"
              class="btn-cancel"
              :disabled="saving"
              @click="router.push('/brands')"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-save"
              :disabled="saving"
              @click="handleSubmit"
            >
              <span v-if="saving" class="spinner"></span>
              <span v-else>Save Brand</span>
            </button>
          </div>
        </BrandFormCard>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import BrandFormCard from '../../components/brands/BrandFormCard.vue';
import SourceChecklist from '../../components/brands/SourceChecklist.vue';
import { useBrandStore } from '../../stores/brandStore';

const router     = useRouter();
const brandStore = useBrandStore();

const saving        = ref(false);
const errors        = reactive({});

const form = reactive({
  name:    '',
  email:   '',
  phone:   '',
  address: '',
  sources: [],
});

const handleSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k]);

  let valid = true;

  if (!form.name.trim()) {
    errors.name = 'Brand name is required.';
    valid = false;
  }

  if (!form.email.trim()) {
    errors.email = 'Brand email is required.';
    valid = false;
  }

  if (!form.phone.trim()) {
    errors.phone = 'Brand phone number is required.';
    valid = false;
  }

  if (!form.address.trim()) {
    errors.address = 'Brand address is required.';
    valid = false;
  }

  if (form.sources.length === 0) {
    errors.sources = 'Please select at least one source.';
    valid = false;
  }

  if (!valid) return;

  saving.value = true;
  try {
    await brandStore.createBrand({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      sources: form.sources,
    });
    router.push('/brands?toast=created');
  } catch (err) {
    const data = err.response?.data;
    if (data?.errors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(data.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      ));
    } else {
      errors.name = data?.message ?? 'Something went wrong.';
    }
  } finally {
    saving.value = false;
  }
};

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

.page-content {
  flex: 1;
  min-width: 0;
}

.grid.two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-sublabel {
  font-size: 12.5px;
  color: #9ca3af;
  margin-top: -2px;
}

.form-input {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
  color: #111827;
  outline: none;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.form-input:focus {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.07);
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-textarea {
  min-height: 92px;
  resize: vertical;
}

.input-error {
  border-color: #dc2626 !important;
}

.field-error {
  font-size: 12px;
  color: #ef4444;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.btn-cancel {
  padding: 9px 18px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save {
  padding: 9px 18px;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
  min-width: 110px;
  justify-content: center;
}

.btn-save:hover:not(:disabled) {
  background: #1f2937;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
