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
          <div class="products-toolbar">
            <label class="search-field">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                v-model="searchDraft"
                type="search"
                placeholder="Search products"
                aria-label="Search products"
              >
            </label>
          </div>

          <ProductEmptyState
            v-if="!loading && products.length === 0 && !hasActiveSearch"
            @add="router.push('/products/create')"
          />
          <div v-else-if="!loading && products.length === 0" class="no-results">
            <h2>No products found</h2>
            <p>Try another product name, SKU, or Shopify ID.</p>
            <button type="button" @click="clearSearch">Clear Search</button>
          </div>
          <ProductTable
            v-else
            :products="products"
            :loading="loading"
            :serial-start="serialStart"
            @edit="id => router.push(`/products/${id}/edit`)"
            @orders="openProductOrders"
            @delete="confirmDelete"
          />
          <OrderPagination
            v-if="products.length > 0"
            class="products-pagination"
            :pagination="pagination"
            item-label="products"
            @page-change="changePage"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import OrderPagination from '../../components/orders/OrderPagination.vue';
import ProductEmptyState from '../../components/products/ProductEmptyState.vue';
import ProductTable from '../../components/products/ProductTable.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import { useAuthStore } from '../../stores/authStore';
import { useProductStore } from '../../stores/productStore';

const router = useRouter();
const route = useRoute();
const productStore = useProductStore();
const authStore = useAuthStore();
const { products, pagination, filters, loading } = storeToRefs(productStore);
const toast = ref('');
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const selectedProduct = ref(null);
const searchDraft = ref(filters.value.search || '');
let searchTimer = null;

const hasActiveSearch = computed(() => Boolean(filters.value.search));
const serialStart = computed(() => {
  if (!pagination.value) return 1;
  return ((pagination.value.current_page - 1) * pagination.value.per_page) + 1;
});

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

const openProductOrders = (product) => {
  authStore.prepareTabHandoff();
  const target = router.resolve({
    path: '/orders',
    query: { product_id: product.id },
  });
  window.open(target.href, '_blank', 'noopener');
};

const handleDelete = async () => {
  if (!selectedProduct.value) return;
  deleteLoading.value = true;
  try {
    await productStore.deleteProduct(selectedProduct.value.id);
    await productStore.fetchProductPage();
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

const changePage = async (page) => {
  await productStore.setPage(page);
};

const clearSearch = async () => {
  searchDraft.value = '';
  await productStore.setSearch('');
};

watch(searchDraft, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    productStore.setSearch(value.trim());
  }, 300);
});

onMounted(async () => {
  await productStore.fetchProductPage();

  if (route.query.toast === 'created') {
    showToast('Product created.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Product updated.');
    router.replace({ query: {} });
  }
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
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

.products-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.search-field {
  display: flex;
  align-items: center;
  width: min(100%, 360px);
  gap: 9px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
}

.search-field input {
  width: 100%;
  height: 40px;
  border: 0;
  outline: 0;
  color: #1e293b;
  font-size: 14px;
  background: transparent;
}

.search-field input::placeholder {
  color: #94a3b8;
}

.no-results {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 60px 20px;
  text-align: center;
}

.no-results h2 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
}

.no-results p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.no-results button {
  margin-top: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.products-pagination {
  margin: 0 20px;
  padding: 18px 0;
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

@media (max-width: 640px) {
  .products-page {
    padding: 18px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .products-toolbar {
    justify-content: stretch;
  }

  .search-field {
    width: 100%;
  }
}
</style>
