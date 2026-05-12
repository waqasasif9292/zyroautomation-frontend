<template>
  <AppLayout>
    <main class="product-form-page">
      <ProductFormCard title="Edit Product" subtitle="Update product details and inventory.">
        <div v-if="pageLoading" class="loading-block"></div>
        <template v-else>
          <div class="form-group">
            <label class="form-label">Product Name</label>
            <input v-model="form.name" class="form-input" :class="{ 'input-error': errors.name }" type="text">
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Picture</label>
            <div v-if="currentPicture" class="current-picture">
              <img :src="currentPicture" :alt="form.name">
              <span>Current picture</span>
            </div>
            <input class="file-input" :class="{ 'input-error': errors.picture }" type="file" accept="image/png,image/jpeg,image/webp" @change="setPicture">
            <span v-if="errors.picture" class="field-error">{{ errors.picture }}</span>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Sale Price</label>
              <input v-model.number="form.sale_price" class="form-input" :class="{ 'input-error': errors.sale_price }" type="number" min="0" step="0.01">
              <span v-if="errors.sale_price" class="field-error">{{ errors.sale_price }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">Cost</label>
              <input v-model.number="form.cost" class="form-input" :class="{ 'input-error': errors.cost }" type="number" min="0" step="0.01">
              <span v-if="errors.cost" class="field-error">{{ errors.cost }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">Total Inventory</label>
              <input v-model.number="form.total_inventory" class="form-input" :class="{ 'input-error': errors.total_inventory }" type="number" min="0" step="1">
              <span v-if="errors.total_inventory" class="field-error">{{ errors.total_inventory }}</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn-cancel" type="button" :disabled="saving" @click="router.push('/products')">Cancel</button>
            <button class="btn-save" type="button" :disabled="saving" @click="submit">
              <span v-if="saving" class="spinner"></span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </template>
      </ProductFormCard>
    </main>
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProductFormCard from '../../components/products/ProductFormCard.vue';
import { useProductStore } from '../../stores/productStore';

const router = useRouter();
const route = useRoute();
const productStore = useProductStore();
const id = route.params.id;
const pageLoading = ref(true);
const saving = ref(false);
const picture = ref(null);
const currentPicture = ref('');
const errors = reactive({});

const form = reactive({
  name: '',
  sale_price: 0,
  cost: 0,
  total_inventory: 0,
});

const setPicture = (event) => {
  picture.value = event.target.files?.[0] || null;
};

onMounted(async () => {
  try {
    const product = await productStore.fetchProduct(id);
    form.name = product.name;
    form.sale_price = product.sale_price;
    form.cost = product.cost;
    form.total_inventory = product.total_inventory;
    currentPicture.value = product.picture_url;
  } catch {
    router.push('/products');
  } finally {
    pageLoading.value = false;
  }
});

const submit = async () => {
  Object.keys(errors).forEach(key => delete errors[key]);

  const payload = new FormData();
  payload.append('name', form.name.trim());
  payload.append('sale_price', form.sale_price);
  payload.append('cost', form.cost);
  payload.append('total_inventory', form.total_inventory);
  if (picture.value) payload.append('picture', picture.value);

  saving.value = true;
  try {
    await productStore.updateProduct(id, payload);
    router.push('/products?toast=updated');
  } catch (err) {
    const data = err.response?.data;
    if (data?.errors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      ));
    } else {
      errors.name = data?.message ?? 'Failed to update product.';
    }
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.product-form-page {
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.form-label {
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.form-input,
.file-input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.form-input:focus,
.file-input:focus {
  border-color: #1e293b;
}

.input-error {
  border-color: #ef4444;
}

.field-error {
  color: #ef4444;
  font-size: 13px;
}

.current-picture {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.current-picture img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-save {
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-save {
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
  min-width: 120px;
}

.loading-block {
  height: 260px;
  border-radius: 10px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
