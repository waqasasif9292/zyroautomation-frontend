<template>
  <AppLayout>
    <main class="bulk-page">
      <section class="upload-shell">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Shopify recovery</p>
            <h1>Bulk order upload</h1>
          </div>
        </div>

        <form class="upload-form" @submit.prevent="submitUpload">
          <label class="field">
            <span>Brand</span>
            <select v-model="brandId" :disabled="loadingBrands || uploading" required>
              <option value="" disabled>Select brand</option>
              <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                {{ brand.display_name || brand.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Shopify CSV</span>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,text/csv"
              :disabled="uploading"
              required
              @change="handleFileChange"
            >
          </label>

          <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
          <div v-if="successMessage" class="alert success">{{ successMessage }}</div>

          <button class="submit-btn" type="submit" :disabled="!canSubmit">
            {{ uploading ? 'Uploading...' : 'Upload orders' }}
          </button>
        </form>

        <section v-if="summary" class="results-panel">
          <div class="result-grid">
            <div>
              <strong>{{ summary.total }}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{{ summary.created }}</strong>
              <span>Created</span>
            </div>
            <div>
              <strong>{{ summary.updated }}</strong>
              <span>Updated</span>
            </div>
            <div>
              <strong>{{ summary.skipped_existing }}</strong>
              <span>Existing</span>
            </div>
            <div>
              <strong>{{ summary.blocked }}</strong>
              <span>Blocked</span>
            </div>
            <div>
              <strong>{{ summary.skipped }}</strong>
              <span>Skipped</span>
            </div>
            <div>
              <strong>{{ summary.failed }}</strong>
              <span>Failed</span>
            </div>
          </div>

          <div v-if="visibleResults.length" class="result-list">
            <div v-for="result in visibleResults" :key="`${result.shopify_order_id}-${result.status}`" class="result-row">
              <span class="status-pill" :class="result.status">{{ result.status }}</span>
              <strong>{{ result.order_name || result.shopify_order_id || 'Order' }}</strong>
              <small v-if="result.message">{{ result.message }}</small>
            </div>
          </div>
        </section>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../layouts/AppLayout.vue';
import BrandService from '../services/BrandService';
import OrderService from '../services/OrderService';

const brands = ref([]);
const brandId = ref('');
const file = ref(null);
const fileInput = ref(null);
const loadingBrands = ref(false);
const uploading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const summary = ref(null);
const results = ref([]);

const canSubmit = computed(() => Boolean(brandId.value && file.value && !uploading.value));
const visibleResults = computed(() => results.value.filter(result => ['blocked', 'skipped', 'skipped_existing', 'failed'].includes(result.status)).slice(0, 12));

const handleFileChange = (event) => {
  file.value = event.target.files?.[0] || null;
  summary.value = null;
  results.value = [];
  errorMessage.value = '';
  successMessage.value = '';
};

const fetchBrands = async () => {
  loadingBrands.value = true;
  try {
    const response = await BrandService.getBrands();
    brands.value = response.data.data.brands || [];
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load brands.';
  } finally {
    loadingBrands.value = false;
  }
};

const submitUpload = async () => {
  if (!canSubmit.value) return;

  uploading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  summary.value = null;
  results.value = [];

  const formData = new FormData();
  formData.append('brand_id', brandId.value);
  formData.append('file', file.value);

  try {
    const response = await OrderService.bulkUploadShopifyOrders(formData);
    const data = response.data.data || {};
    summary.value = data.summary || null;
    results.value = data.results || [];
    successMessage.value = 'Upload completed.';
    file.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Upload failed.';
  } finally {
    uploading.value = false;
  }
};

onMounted(fetchBrands);
</script>

<style scoped>
.bulk-page {
  width: 100%;
  padding: 28px;
}

.upload-shell {
  max-width: 860px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 900;
}

.upload-form,
.results-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.upload-form {
  display: grid;
  gap: 16px;
  padding: 22px;
}

.field {
  display: grid;
  gap: 7px;
}

.field span {
  color: #334155;
  font-size: 13px;
  font-weight: 850;
}

select,
input[type="file"] {
  width: 100%;
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
  font-weight: 650;
}

select {
  padding: 0 12px;
}

input[type="file"] {
  padding: 9px 12px;
}

.submit-btn {
  width: fit-content;
  min-height: 42px;
  border: 1px solid #111827;
  border-radius: 8px;
  background: #111827;
  padding: 0 18px;
  color: #fff;
  font-size: 14px;
  font-weight: 850;
  cursor: pointer;
}

.submit-btn:disabled {
  border-color: #94a3b8;
  background: #94a3b8;
  cursor: not-allowed;
}

.alert {
  border-radius: 8px;
  padding: 11px 13px;
  font-size: 13px;
  font-weight: 800;
}

.alert.error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.alert.success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.results-panel {
  margin-top: 18px;
  padding: 18px;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.result-grid div {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 13px 10px;
}

.result-grid strong,
.result-grid span {
  display: block;
}

.result-grid strong {
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.result-grid span {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.result-list {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.result-row {
  display: grid;
  grid-template-columns: 92px minmax(120px, 1fr) minmax(160px, 2fr);
  gap: 10px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
}

.result-row strong {
  color: #0f172a;
  font-size: 13px;
}

.result-row small {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.status-pill {
  width: fit-content;
  border-radius: 999px;
  padding: 4px 8px;
  background: #e2e8f0;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.status-pill.blocked,
.status-pill.failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-pill.skipped,
.status-pill.skipped_existing {
  background: #fef3c7;
  color: #92400e;
}

@media (max-width: 760px) {
  .bulk-page {
    padding: 18px 14px;
  }

  .result-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .result-row {
    grid-template-columns: 1fr;
  }
}
</style>
