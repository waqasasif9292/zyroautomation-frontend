<template>
  <AppLayout>
    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <div class="page-body">
      <SettingsSubNav />
      <main class="page-content">
        <div class="content-panel">
          <!-- Panel Header -->
          <div class="panel-header">
            <div class="header-left">
              <h2 class="panel-title">Brands</h2>
              <p class="panel-subtitle">Manage the brands you operate under.</p>
            </div>
            <button class="btn-add" @click="router.push('/brands/create')">+ Add Brand</button>
          </div>

          <!-- Panel Body -->
          <div class="panel-body">
            <BrandEmptyState
              v-if="!loading && brands.length === 0"
              @add="router.push('/brands/create')"
            />

            <BrandTable
              v-else
              :brands="brands"
              :loading="loading"
              @edit="id => router.push(`/brands/${id}/edit`)"
            />
          </div>
        </div>
      </main>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import BrandTable from '../../components/brands/BrandTable.vue';
import BrandEmptyState from '../../components/brands/BrandEmptyState.vue';
import { useBrandStore } from '../../stores/brandStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const route  = useRoute();
const brandStore = useBrandStore();
const { brands, loading } = storeToRefs(brandStore);

const toast = ref('');

const showToast = (msg) => {
  toast.value = msg;
  setTimeout(() => { toast.value = ''; }, 3000);
};

onMounted(async () => {
  await brandStore.fetchBrands();

  if (route.query.toast === 'created') {
    showToast('Brand created.');
    router.replace({ query: {} });
  } else if (route.query.toast === 'updated') {
    showToast('Brand updated.');
    router.replace({ query: {} });
  }
});

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

.content-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  padding: 20px 28px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.panel-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.btn-add {
  padding: 9px 16px;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-add:hover {
  background: #1f2937;
}

.panel-body {
  padding: 0;
}

/* Toast */
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
