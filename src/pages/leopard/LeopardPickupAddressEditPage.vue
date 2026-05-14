<template>
  <AppLayout>
    <div class="page-body">
      <SettingsSubNav />
      <main class="page-content">
        <BrandFormCard v-if="notFound" title="Edit Leopard Pickup Address" subtitle="">
          <div class="not-found">
            <p class="not-found-text">Leopard pickup address not found.</p>
            <button class="btn-back" @click="router.push('/leopard-pickup-addresses')">Go back to pickup addresses</button>
          </div>
        </BrandFormCard>

        <BrandFormCard v-else-if="pageLoading" title="Edit Leopard Pickup Address" subtitle="Update this saved Leopard pickup address.">
          <div class="sk-block sk-title"></div>
          <div class="sk-block sk-grid"></div>
          <div class="sk-block sk-area"></div>
        </BrandFormCard>

        <BrandFormCard v-else title="Edit Leopard Pickup Address" subtitle="Update this saved Leopard pickup address.">
          <div v-if="loadError" class="alert alert-error">{{ loadError }}</div>

          <div class="form-group">
            <label class="form-label">Shipment Name</label>
            <input v-model="form.shipment_name_eng" type="text" class="form-input" :class="{ 'input-error': errors.shipment_name_eng }" maxlength="160" placeholder="e.g. Bachat Dukan" />
            <span v-if="errors.shipment_name_eng" class="field-error">{{ errors.shipment_name_eng }}</span>
          </div>

          <div class="grid two">
            <div class="form-group">
              <label class="form-label">Origin City</label>
              <select v-model.number="form.origin_city" class="form-input" :class="{ 'input-error': errors.origin_city }">
                <option value="">Select city</option>
                <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
              </select>
              <span v-if="errors.origin_city" class="field-error">{{ errors.origin_city }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Return City</label>
              <select v-model.number="form.return_city" class="form-input" :class="{ 'input-error': errors.return_city }">
                <option value="">Select city</option>
                <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
              </select>
              <span v-if="errors.return_city" class="field-error">{{ errors.return_city }}</span>
            </div>
          </div>

          <div class="grid two">
            <div class="form-group">
              <label class="form-label">Shipment Email</label>
              <input v-model="form.shipment_email" type="email" class="form-input" :class="{ 'input-error': errors.shipment_email }" maxlength="160" placeholder="support@example.com" />
              <span v-if="errors.shipment_email" class="field-error">{{ errors.shipment_email }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Shipment Phone</label>
              <input v-model="form.shipment_phone" type="text" class="form-input" :class="{ 'input-error': errors.shipment_phone }" maxlength="60" placeholder="+923001234567" />
              <span v-if="errors.shipment_phone" class="field-error">{{ errors.shipment_phone }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Shipment Address</label>
            <textarea v-model="form.shipment_address" class="form-input form-textarea" :class="{ 'input-error': errors.shipment_address }" maxlength="500" rows="3" placeholder="Pickup address"></textarea>
            <span v-if="errors.shipment_address" class="field-error">{{ errors.shipment_address }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Return Address</label>
            <textarea v-model="form.return_address" class="form-input form-textarea" :class="{ 'input-error': errors.return_address }" maxlength="500" rows="3" placeholder="Return address"></textarea>
            <span v-if="errors.return_address" class="field-error">{{ errors.return_address }}</span>
          </div>

          <div class="panel-actions">
            <button type="button" class="btn-cancel" :disabled="saving" @click="router.push('/leopard-pickup-addresses')">Cancel</button>
            <button type="button" class="btn-save" :disabled="saving" @click="handleSubmit">
              <span v-if="saving" class="spinner"></span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </BrandFormCard>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import BrandFormCard from '../../components/brands/BrandFormCard.vue';
import LeopardService from '../../services/LeopardService';

const router = useRouter();
const route = useRoute();
const id = route.params.id;

const cities = ref([]);
const pageLoading = ref(true);
const notFound = ref(false);
const saving = ref(false);
const loadError = ref('');
const errors = reactive({});

const form = reactive({
  shipment_name_eng: '',
  origin_city: '',
  return_city: '',
  shipment_email: '',
  shipment_phone: '',
  shipment_address: '',
  return_address: '',
});

const requiredFields = {
  shipment_name_eng: 'Shipment name is required.',
  origin_city: 'Origin city is required.',
  return_city: 'Return city is required.',
  shipment_email: 'Shipment email is required.',
  shipment_phone: 'Shipment phone is required.',
  shipment_address: 'Shipment address is required.',
  return_address: 'Return address is required.',
};

const fillForm = (address) => {
  form.shipment_name_eng = address.shipment_name_eng || '';
  form.origin_city = address.origin_city || '';
  form.return_city = address.return_city || '';
  form.shipment_email = address.shipment_email || '';
  form.shipment_phone = address.shipment_phone || '';
  form.shipment_address = address.shipment_address || '';
  form.return_address = address.return_address || '';
};

const loadPage = async () => {
  pageLoading.value = true;
  loadError.value = '';

  try {
    const [citiesRes, addressesRes] = await Promise.all([
      LeopardService.fetchCities(),
      LeopardService.fetchPickupAddresses(),
    ]);

    cities.value = citiesRes.data.data.cities || [];
    const address = (addressesRes.data.data.addresses || []).find(item => String(item.id) === String(id));

    if (!address) {
      notFound.value = true;
      return;
    }

    fillForm(address);
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Unable to load Leopard pickup address.';
  } finally {
    pageLoading.value = false;
  }
};

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k]);

  Object.entries(requiredFields).forEach(([field, message]) => {
    if (!String(form[field] || '').trim()) {
      errors[field] = message;
    }
  });

  return Object.keys(errors).length === 0;
};

const payload = () => ({
  shipment_name_eng: form.shipment_name_eng.trim(),
  origin_city: Number(form.origin_city),
  return_city: Number(form.return_city),
  shipment_email: form.shipment_email.trim(),
  shipment_phone: form.shipment_phone.trim(),
  shipment_address: form.shipment_address.trim(),
  return_address: form.return_address.trim(),
});

const handleSubmit = async () => {
  if (!validate()) return;

  saving.value = true;
  try {
    await LeopardService.updatePickupAddress(id, payload());
    router.push('/leopard-pickup-addresses?toast=updated');
  } catch (error) {
    const data = error.response?.data;
    if (data?.errors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(data.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      ));
    } else {
      loadError.value = data?.message || 'Unable to update Leopard pickup address.';
    }
  } finally {
    saving.value = false;
  }
};

onMounted(loadPage);
</script>

<style scoped>
.page-body {
  display: flex;
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 40px auto;
  padding: 0 28px;
  gap: 32px;
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

.btn-cancel,
.btn-save,
.btn-back {
  border-radius: 7px;
  padding: 9px 18px;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel,
.btn-back {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 118px;
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
}

.btn-cancel:disabled,
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.alert {
  border-radius: 9px;
  padding: 11px 13px;
  font-size: 13px;
  font-weight: 600;
}

.alert-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.not-found {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}

.not-found-text {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
}

.sk-block {
  border-radius: 8px;
  background: #e5e7eb;
  animation: pulse 1.4s ease-in-out infinite;
}

.sk-title { height: 38px; width: 100%; }
.sk-grid { height: 74px; width: 100%; }
.sk-area { height: 96px; width: 100%; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
</style>
