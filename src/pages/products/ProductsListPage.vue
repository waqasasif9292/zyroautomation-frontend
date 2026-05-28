<template>
  <AppLayout>
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <main class="products-page">
      <section class="products-card">
        <div class="card-header">
          <div>
            <h1>Products</h1>
            <p>Manage product pricing, cost, and inventory.</p>
          </div>
          <button class="add-btn" type="button" @click="router.push('/products/create')">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add Product
          </button>
        </div>

        <div class="card-body">
          <ProductEmptyState
            v-if="!loading && products.length === 0"
            @add="router.push('/products/create')"
          />
          <ProductTable
            v-else
            :products="products"
            :loading="loading"
            @edit="id => router.push(`/products/${id}/edit`)"
            @delete="confirmDelete"
          />
        </div>
      </section>
    </main>

    <ConfirmDialog
      :show="showDeleteDialog"
      title="Delete Product?"
      message="This product will be removed from your products list. Existing orders will keep their saved order details."
      :details="selectedProduct?.name || ''"
      eyebrow="Product deletion"
      confirmText="Delete Product"
      cancelText="Keep Product"
      variant="danger"
      :loading="deleteLoading"
      @cancel="closeDeleteDialog"
      @confirm="handleDelete"
    />
  </AppLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProductEmptyState from '../../components/products/ProductEmptyState.vue';
import ProductTable from '../../components/products/ProductTable.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import { useProductStore } from '../../stores/productStore';

const router = useRouter();
const route = useRoute();
const productStore = useProductStore();
const { products, loading } = storeToRefs(productStore);
const toast = ref('');
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const selectedProduct = ref(null);

const showToast = (message) => {
  toast.value = message;
  setTimeout(() => { toast.value = ''; }, 3000);
};

const confirmDelete = (product) => {
  selectedProduct.value = product;
  showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
  if (deleteLoading.value) return;
  showDeleteDialog.value = false;
  selectedProduct.value = null;
};

const handleDelete = async () => {
  if (!selectedProduct.value) return;
  deleteLoading.value = true;
  try {
    await productStore.deleteProduct(selectedProduct.value.id);
    showToast('Product deleted.');
    showDeleteDialog.value = false;
    selectedProduct.value = null;
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Failed to delete product.');
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(async () => {
  await productStore.fetchProducts();

  if (route.query.toast === 'created') {
    showToast('Product created.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Product updated.');
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.products-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.products-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h1 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
  font-weight: 800;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.card-body {
  padding: 0;
}

.toast {
  position: fixed;
  top: 18px;
  right: 20px;
  background: #111827;
  color: #fff;
  padding: 11px 18px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
