<template>
  <AppLayout>
    <main class="product-form-page">
      <ProductFormCard title="Add Product" subtitle="Create a product with pricing and inventory details.">
        <div class="form-group">
          <label class="form-label">Product Name</label>
          <input v-model="form.name" class="form-input" :class="{ 'input-error': errors.name }" type="text" placeholder="e.g. Heavy Duty Torch Light">
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Picture</label>
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
            <label class="form-label">Available Stock</label>
            <input v-model.number="form.available_stock" class="form-input" :class="{ 'input-error': errors.available_stock || errors.total_inventory }" type="number" step="1">
            <span v-if="errors.available_stock || errors.total_inventory" class="field-error">{{ errors.available_stock || errors.total_inventory }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">SKU</label>
            <input v-model="form.sku" class="form-input" :class="{ 'input-error': errors.sku }" type="text">
            <span v-if="errors.sku" class="field-error">{{ errors.sku }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Low Stock Alert</label>
            <input v-model.number="form.low_stock_threshold" class="form-input" :class="{ 'input-error': errors.low_stock_threshold }" type="number" min="0" step="1">
            <span v-if="errors.low_stock_threshold" class="field-error">{{ errors.low_stock_threshold }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Shopify Product ID</label>
            <input v-model="form.shopify_product_id" class="form-input" :class="{ 'input-error': errors.shopify_product_id }" type="text">
            <span v-if="errors.shopify_product_id" class="field-error">{{ errors.shopify_product_id }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Shopify Variant ID</label>
            <input v-model="form.shopify_variant_id" class="form-input" :class="{ 'input-error': errors.shopify_variant_id }" type="text">
            <span v-if="errors.shopify_variant_id" class="field-error">{{ errors.shopify_variant_id }}</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-cancel" type="button" :disabled="saving" @click="router.push('/products')">Cancel</button>
          <button class="btn-save" type="button" :disabled="saving" @click="submit">
            <span v-if="saving" class="spinner"></span>
            <span v-else>Save Product</span>
          </button>
        </div>
      </ProductFormCard>
    </main>
  </AppLayout>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProductFormCard from '../../components/products/ProductFormCard.vue';
import { useProductStore } from '../../stores/productStore';

const router = useRouter();
const productStore = useProductStore();
const saving = ref(false);
const picture = ref(null);
const errors = reactive({});

const form = reactive({
  name: '',
  sale_price: 0,
  cost: 0,
  available_stock: 0,
  low_stock_threshold: 0,
  sku: '',
  shopify_product_id: '',
  shopify_variant_id: '',
});

const setPicture = (event) => {
  picture.value = event.target.files?.[0] || null;
};

const submit = async () => {
  Object.keys(errors).forEach(key => delete errors[key]);

  const payload = new FormData();
  payload.append('name', form.name.trim());
  payload.append('sale_price', form.sale_price);
  payload.append('cost', form.cost);
  payload.append('available_stock', form.available_stock);
  payload.append('low_stock_threshold', form.low_stock_threshold);
  payload.append('sku', form.sku.trim());
  payload.append('shopify_product_id', form.shopify_product_id.trim());
  payload.append('shopify_variant_id', form.shopify_variant_id.trim());
  if (picture.value) payload.append('picture', picture.value);

  saving.value = true;
  try {
    await productStore.createProduct(payload);
    router.push('/products?toast=created');
  } catch (err) {
    const data = err.response?.data;
    if (data?.errors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      ));
    } else {
      errors.name = data?.message ?? 'Failed to save product.';
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

.spinner {
  display: inline-block;
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
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
