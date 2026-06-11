<template>
  <div class="table-wrap">
    <table class="products-table">
      <thead>
        <tr>
          <th class="col-serial">#</th>
          <th class="col-picture">Picture</th>
          <th>Name</th>
          <th>Sale Price</th>
          <th>Cost</th>
          <th>Avg Cost</th>
          <th>Latest Cost</th>
          <th>Batches</th>
          <th>Available</th>
          <th>Booked</th>
          <th>Sold</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <template v-if="loading">
          <tr v-for="row in 5" :key="row">
            <td v-for="col in 12" :key="col"><span class="skeleton"></span></td>
          </tr>
        </template>
        <tr v-else v-for="(product, index) in products" :key="product.id">
          <td class="serial">{{ serialStart + index }}</td>
          <td>
            <img
              v-if="product.picture_url && !brokenImages[product.id]"
              class="product-image"
              :src="product.picture_url"
              :alt="product.name"
              @error="markBroken(product.id)"
            >
            <div v-else class="product-image placeholder">No image</div>
          </td>
          <td>
            <div class="product-name">{{ product.name }}</div>
          </td>
          <td class="money">{{ formatMoney(product.sale_price) }}</td>
          <td class="money">{{ formatMoney(product.cost) }}</td>
          <td class="money">{{ formatMoney(product.average_purchase_cost) }}</td>
          <td class="money">{{ formatMoney(product.latest_purchase_cost) }}</td>
          <td class="stock">{{ formatStock(product.batch_count) }}</td>
          <td :class="stockClass(product.available_stock)">{{ formatStock(product.available_stock) }}</td>
          <td>{{ formatStock(product.booked_stock) }}</td>
          <td>{{ formatStock(product.sold_stock) }}</td>
          <td>
            <div class="actions">
              <button class="icon-btn" type="button" title="Edit product" aria-label="Edit product" @click="$emit('edit', product.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button class="icon-btn" type="button" title="View product orders" aria-label="View product orders" @click="$emit('orders', product)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </button>
              <button class="icon-btn danger" type="button" title="Delete product" aria-label="Delete product" @click="$emit('delete', product)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

defineProps({
  products: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  serialStart: {
    type: Number,
    default: 1,
  },
});

defineEmits(['edit', 'orders', 'delete']);

const brokenImages = reactive({});
const markBroken = (id) => {
  brokenImages[id] = true;
};
const formatMoney = (value) => `PKR ${Number(value || 0).toLocaleString()}`;
const formatStock = (value) => Number(value || 0).toLocaleString();
const stockClass = (value) => Number(value || 0) < 0 ? 'stock-negative' : 'stock';
</script>

<style scoped>
.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  padding: 12px 14px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
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
  width: 60px;
}

.col-picture {
  width: 90px;
}

.col-actions {
  width: 146px;
}

.serial,
.money,
.stock,
.product-name {
  color: #1e293b;
  font-weight: 700;
}

.stock-negative {
  color: #dc2626;
  font-weight: 800;
}

.product-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.product-image.placeholder {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
  text-transform: uppercase;
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
  color: #3b82f6;
  border-color: #bfdbfe;
}

.icon-btn.danger:hover {
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
