<template>
  <div class="table-wrapper">
    <div class="table-header">
      <div>Brand</div>
      <div>Courier</div>
      <div>Options</div>
      <div class="text-right">Actions</div>
    </div>

    <div v-if="loading" class="table-body">
      <div v-for="n in 3" :key="n" class="table-row skeleton">
        <div class="skeleton-cell"></div>
        <div class="skeleton-cell"></div>
        <div class="skeleton-cell"></div>
        <div class="skeleton-cell"></div>
      </div>
    </div>

    <div v-else class="table-body">
      <div
        v-for="integration in integrations"
        :key="integration.id"
        class="table-row"
      >
        <div class="brand-cell">{{ integration.brand?.name }}</div>
        <div class="courier-cell">
          <div class="logo-wrapper">
            <img
              v-if="!imgError[integration.courier_slug]"
              :src="getCourierImage(integration.courier_slug)"
              :alt="integration.courier_name"
              width="32"
              height="32"
              @error="() => onImgError(integration.courier_slug)"
            />
            <div v-else class="logo-fallback">
              <span>{{ integration.courier_name?.charAt(0) || '?' }}</span>
            </div>
          </div>
          <span>{{ integration.courier_name }}</span>
        </div>
        <div>
          <span v-if="hasOptions(integration.courier_options)" class="badge">Configured</span>
          <span v-else>—</span>
        </div>
        <div class="action-cell">
          <button class="icon-btn" @click="$emit('edit', integration.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
          <button class="icon-btn delete" @click="$emit('delete', integration)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M15 6V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { getCourierBySlug } from '../../constants/couriers';

const props = defineProps({
  integrations: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const hasOptions = (options) => {
  return options && Object.keys(options || {}).length > 0;
};

const getCourierImage = (slug) => getCourierBySlug(slug)?.image;

const imgError = reactive({});
const onImgError = (slug) => {
  imgError[slug] = true;
};
</script>

<style scoped>
.table-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.2fr 1.3fr 1fr 0.8fr;
  padding: 16px 20px;
  align-items: center;
}

.table-header {
  background: #f9fafb;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.table-body .table-row {
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #1f2937;
}

.table-body .table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f9fafb;
}

.brand-cell {
  font-weight: 600;
  color: #1e293b;
}

.courier-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-wrapper {
  width: 34px;
  height: 34px;
}

.logo-wrapper img,
.logo-fallback {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 4px;
  background: #fff;
  display: block;
}

.logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-weight: 600;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  color: #15803d;
  background: #dcfce7;
  border-radius: 999px;
  font-weight: 600;
}

.action-cell {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border 0.2s, color 0.2s;
  color: #9ca3af;
}

.icon-btn:hover {
  border-color: #1e293b;
  color: #1e293b;
}

.icon-btn.delete:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.skeleton {
  position: relative;
  overflow: hidden;
}

.skeleton-cell {
  height: 18px;
  border-radius: 6px;
  background: #f3f4f6;
  animation: pulse 1.4s ease infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
