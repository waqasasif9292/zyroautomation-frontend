<template>
  <div class="line-editor">
    <div class="line-table-wrap">
      <table class="line-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th v-if="mode === 'receipt'">Expected</th>
            <th v-if="mode === 'receipt'">Received</th>
            <th v-if="mode === 'receipt'">Damaged</th>
            <th v-if="mode === 'receipt'">Good</th>
            <th v-if="mode !== 'receipt'">Qty</th>
            <th v-if="mode === 'invoice' || mode === 'receipt'">Unit Price</th>
            <th v-if="mode === 'invoice'">Total</th>
            <th v-if="mode === 'receipt'">Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in rows" :key="index">
            <td><input :value="item.product_name" @input="update(index, 'product_name', $event.target.value)"></td>
            <td v-if="mode === 'receipt'"><input type="number" min="0" :value="item.expected_quantity" @input="updateNumber(index, 'expected_quantity', $event.target.value)"></td>
            <td v-if="mode === 'receipt'"><input type="number" min="0" :value="item.received_quantity" @input="updateNumber(index, 'received_quantity', $event.target.value)"></td>
            <td v-if="mode === 'receipt'"><input type="number" min="0" :value="item.damaged_quantity" @input="updateNumber(index, 'damaged_quantity', $event.target.value)"></td>
            <td v-if="mode === 'receipt'" class="computed">{{ goodQuantity(item).toLocaleString() }}</td>
            <td v-if="mode !== 'receipt'"><input type="number" min="0" :value="item.quantity" @input="updateNumber(index, 'quantity', $event.target.value)"></td>
            <td v-if="mode === 'invoice' || mode === 'receipt'"><input type="number" min="0" :value="item.unit_price" @input="updateNumber(index, 'unit_price', $event.target.value)"></td>
            <td v-if="mode === 'invoice'" class="computed">PKR {{ money(lineTotal(item)) }}</td>
            <td v-if="mode === 'receipt'"><input :value="item.notes" @input="update(index, 'notes', $event.target.value)"></td>
            <td><button type="button" class="icon-btn" :disabled="rows.length === 1" @click="remove(index)">×</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button type="button" class="add-line-btn" @click="add">+ Add Item</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  mode: { type: String, default: 'invoice' },
});

const emit = defineEmits(['update:modelValue']);

const emptyRow = () => {
  if (props.mode === 'receipt') {
    return { product_name: '', expected_quantity: 0, received_quantity: 0, damaged_quantity: 0, unit_price: 0, notes: '' };
  }
  if (props.mode === 'bilty') {
    return { product_name: '', quantity: 0 };
  }
  return { product_name: '', quantity: 0, unit_price: 0 };
};

const rows = computed(() => props.modelValue.length ? props.modelValue : [emptyRow()]);
const cloneRows = () => rows.value.map(row => ({ ...row }));
const money = value => Number(value || 0).toLocaleString();
const lineTotal = item => Number(item.quantity || 0) * Number(item.unit_price || 0);
const goodQuantity = item => Math.max(Number(item.received_quantity || 0) - Number(item.damaged_quantity || 0), 0);

const update = (index, key, value) => {
  const next = cloneRows();
  next[index][key] = value;
  emit('update:modelValue', next);
};

const updateNumber = (index, key, value) => update(index, key, Number(value || 0));
const add = () => emit('update:modelValue', [...cloneRows(), emptyRow()]);
const remove = (index) => emit('update:modelValue', cloneRows().filter((_, rowIndex) => rowIndex !== index));
</script>

<style scoped>
.line-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.line-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.line-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
}

th,
td {
  padding: 9px;
  border-bottom: 1px solid #edf2f7;
  color: #334155;
  font-size: 12px;
  text-align: left;
}

th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 850;
}

input {
  width: 100%;
  height: 34px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #1e293b;
  padding: 0 8px;
}

.computed {
  color: #172554;
  font-weight: 850;
  white-space: nowrap;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #991b1b;
  cursor: pointer;
  font-weight: 900;
}

.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.add-line-btn {
  align-self: flex-start;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  background: #fff;
  color: #334155;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  padding: 8px 10px;
}
</style>
