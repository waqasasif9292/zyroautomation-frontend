<template>
  <div class="table-wrap">
    <table class="brand-table">
      <thead>
        <tr>
          <th class="col-name">Brand Name</th>
          <th class="col-sources">Sources</th>
          <th class="col-webhook">Webhook URL</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <!-- Skeleton rows -->
        <template v-if="loading">
          <tr v-for="n in 3" :key="'sk' + n" class="skeleton-row">
            <td><div class="sk sk-name"></div></td>
            <td><div class="sk sk-sources"></div></td>
            <td><div class="sk sk-webhook"></div></td>
            <td><div class="sk sk-icon"></div></td>
          </tr>
        </template>

        <!-- Data rows -->
        <template v-else>
          <tr
            v-for="brand in brands"
            :key="brand.id"
            class="data-row"
          >
            <td class="cell-name">{{ brand.name }}</td>

            <td class="cell-sources">
              <span
                v-for="source in brand.sources"
                :key="source"
                class="source-pill"
              >{{ source }}</span>
            </td>

            <td class="cell-webhook">
              <div class="webhook-cell">
                <span class="webhook-url">{{ brand.webhook_url }}</span>
                <button
                  type="button"
                  class="copy-icon-btn"
                  :title="copiedId === brand.id ? 'Copied!' : 'Copy URL'"
                  @click="copyUrl(brand)"
                >
                  <svg v-if="copiedId !== brand.id" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>
            </td>

            <td class="cell-actions">
              <button
                type="button"
                class="edit-btn"
                title="Edit brand"
                @click="$emit('edit', brand.id)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  brands:  { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
});

defineEmits(['edit']);

const copiedId = ref(null);

const copyUrl = async (brand) => {
  try {
    await navigator.clipboard.writeText(brand.webhook_url);
  } catch {
    const el = document.createElement('textarea');
    el.value = brand.webhook_url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  copiedId.value = brand.id;
  setTimeout(() => { copiedId.value = null; }, 2000);
};
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
}

.brand-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.brand-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;
}

.col-name    { width: 22%; }
.col-sources { width: 25%; }
.col-webhook { width: 43%; }
.col-actions { width: 10%; }

.data-row {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.12s;
}

.data-row:last-child {
  border-bottom: none;
}

.data-row:hover {
  background: #f9fafb;
}

.cell-name {
  padding: 14px;
  font-weight: 500;
  color: #111827;
}

.cell-sources {
  padding: 14px;
}

.source-pill {
  display: inline-block;
  background: #f1f5f9;
  color: #4b5563;
  border-radius: 999px;
  font-size: 11.5px;
  padding: 2px 8px;
  margin-right: 4px;
  margin-bottom: 2px;
}

.cell-webhook {
  padding: 14px;
}

.webhook-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.webhook-url {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  color: #4b5563;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 340px;
}

.copy-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s;
}

.copy-icon-btn:hover {
  color: #374151;
}

.cell-actions {
  padding: 14px;
  text-align: right;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 5px;
  transition: color 0.15s, background 0.15s;
}

.edit-btn:hover {
  color: #111827;
  background: #f3f4f6;
}

/* Skeleton */
.skeleton-row td {
  padding: 14px;
}

.sk {
  border-radius: 5px;
  background: #e5e7eb;
  animation: pulse 1.4s ease-in-out infinite;
}

.sk-name    { height: 14px; width: 80%; }
.sk-sources { height: 14px; width: 70%; }
.sk-webhook { height: 14px; width: 90%; }
.sk-icon    { height: 14px; width: 24px; margin-left: auto; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}
</style>
