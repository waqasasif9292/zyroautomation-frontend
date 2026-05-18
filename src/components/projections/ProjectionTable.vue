<template>
  <div class="table-wrap">
    <table class="projections-table">
      <thead>
        <tr>
          <th class="col-serial">#</th>
          <th class="col-image">Image</th>
          <th>Product</th>
          <th>Sale Price</th>
          <th>Ads/Day</th>
          <th>Cancel</th>
          <th>Return</th>
          <th>Profit</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="row in 5" :key="row">
            <td v-for="col in 9" :key="col"><span class="skeleton"></span></td>
          </tr>
        </template>
        <tr v-else v-for="(projection, index) in projections" :key="projection.id">
          <td class="serial">{{ index + 1 }}</td>
          <td>
            <img v-if="projection.product_image_url" class="product-image" :src="projection.product_image_url" :alt="projection.product_name">
            <div v-else class="image-placeholder"></div>
          </td>
          <td>
            <button class="name-btn" type="button" @click="$emit('view', projection.id)">{{ projection.product_name }}</button>
          </td>
          <td class="money">{{ formatMoney(projection.sale_price) }}</td>
          <td class="money">{{ formatMoney(projection.ads_cost_per_day) }}</td>
          <td>{{ formatPercent(projection.cancel_rate) }}</td>
          <td>{{ formatPercent(projection.return_rate) }}</td>
          <td :class="['money', projection.calculations?.profit >= 0 ? 'success' : 'danger']">
            {{ formatMoney(projection.calculations?.profit) }}
          </td>
          <td>
            <div class="actions">
              <button class="icon-btn" type="button" title="View projection" aria-label="View projection" @click="$emit('view', projection.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="icon-btn" type="button" title="Edit projection" aria-label="Edit projection" @click="$emit('edit', projection.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              </button>
              <button class="icon-btn danger-btn" type="button" title="Delete projection" aria-label="Delete projection" @click="$emit('delete', projection)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  projections: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['view', 'edit', 'delete']);

const formatMoney = (value) => `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
const formatPercent = (value) => `${Number(value || 0).toLocaleString()}%`;
</script>

<style scoped>
.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.projections-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 12px 14px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 13px 14px;
  color: #374151;
  font-size: 14px;
  vertical-align: middle;
  border-bottom: 1px solid #f1f5f9;
}

tbody tr:hover {
  background: #f9fafb;
}

.col-serial {
  width: 56px;
}

.col-image {
  width: 82px;
}

.col-actions {
  width: 142px;
}

.serial,
.money {
  color: #1e293b;
  font-weight: 800;
}

.name-btn {
  border: 0;
  background: transparent;
  color: #1e293b;
  font: inherit;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.name-btn:hover {
  color: #2563eb;
}

.product-image,
.image-placeholder {
  width: 48px;
  height: 48px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.product-image {
  object-fit: cover;
}

.image-placeholder::before {
  content: "";
  display: block;
  width: 18px;
  height: 18px;
  margin: 14px auto;
  border-radius: 5px;
  background: #cbd5e1;
}

.success {
  color: #16a34a;
}

.danger {
  color: #dc2626;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.icon-btn:hover {
  color: #2563eb;
  border-color: #bfdbfe;
}

.danger-btn:hover {
  color: #ef4444;
  border-color: #fecaca;
}

.skeleton {
  display: block;
  width: 100%;
  height: 18px;
  border-radius: 5px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
</style>
