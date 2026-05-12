<template>
  <AppLayout>
    <main class="create-order-page">
      <section class="order-card">
        <header class="card-header">
          <h1>Save Order</h1>
        </header>

        <form class="order-form" @submit.prevent="handleSave">
          <div class="grid two">
            <div class="field">
              <label>Brand</label>
              <select v-model="form.brand_id" :class="{ invalid: errors.brand_id }">
                <option value="">Select Brand</option>
                <option v-for="brand in brandStore.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
              </select>
              <span v-if="errors.brand_id" class="field-error">{{ errors.brand_id }}</span>
            </div>
            <div class="field">
              <label>Source</label>
              <select v-model="form.source" :class="{ invalid: errors.source }" :disabled="!selectedBrand">
                <option value="">Select Source</option>
                <option v-for="source in brandSources" :key="source" :value="source">{{ source }}</option>
              </select>
              <span v-if="errors.source" class="field-error">{{ errors.source }}</span>
            </div>
          </div>

          <div class="grid three">
            <div class="field">
              <label>Customer Name</label>
              <input v-model="form.customer_name" :class="{ invalid: errors.customer_name }" type="text" placeholder="Irfan Khan">
              <span v-if="errors.customer_name" class="field-error">{{ errors.customer_name }}</span>
            </div>
            <div class="field">
              <label>Customer Contact</label>
              <input v-model="form.customer_contact" :class="{ invalid: errors.customer_contact }" type="text" placeholder="+923009409648">
              <span v-if="errors.customer_contact" class="field-error">{{ errors.customer_contact }}</span>
            </div>
            <div class="field">
              <label>Customer Contact Two <span class="optional-label">Optional</span></label>
              <input v-model="form.customer_contact_two" type="text" placeholder="+923009409648">
            </div>
          </div>

          <div class="field">
            <label>Customer Address</label>
            <input v-model="form.customer_address" :class="{ invalid: errors.customer_address }" type="text" placeholder="Billal colony, Pattoki">
            <span v-if="errors.customer_address" class="field-error">{{ errors.customer_address }}</span>
          </div>

          <div class="section-line"></div>

          <div class="grid three">
            <div class="field">
              <label>Ship Through</label>
              <select v-model="form.courier" :class="{ invalid: errors.courier }">
                <option value="">Select Courier</option>
                <option v-for="courier in courierOptions" :key="courier.slug" :value="courier.slug">{{ courier.name }}</option>
              </select>
              <span v-if="errors.courier" class="field-error">{{ errors.courier }}</span>
            </div>
            <div v-if="isPostexSelected" class="field">
              <label>Pickup Address</label>
              <select v-model="form.pickup_address_code" :class="{ invalid: errors.pickup_address_code }">
                <option value="">Select Pickup Address</option>
                <option
                  v-for="integration in postexIntegrations"
                  :key="integration.id"
                  :value="integration.courier_options?.pickup_address_code"
                >
                  {{ pickupAddressName(integration) }}
                </option>
              </select>
              <span v-if="errors.pickup_address_code" class="field-error">{{ errors.pickup_address_code }}</span>
            </div>
            <div v-else class="field">
              <label>Origin City</label>
              <select v-model="form.origin_city" :class="{ invalid: errors.origin_city }">
                <option value=""></option>
                <option>Lahore</option>
                <option>Karachi</option>
                <option>Islamabad</option>
              </select>
              <span v-if="errors.origin_city" class="field-error">{{ errors.origin_city }}</span>
            </div>
            <div class="field">
              <label>Destination City</label>
              <select v-model="form.destination_city" :class="{ invalid: errors.destination_city }">
                <option value=""></option>
                <option>Lahore</option>
                <option>Karachi</option>
                <option>Islamabad</option>
              </select>
              <span v-if="errors.destination_city" class="field-error">{{ errors.destination_city }}</span>
            </div>
          </div>

          <div class="grid two compact">
            <div class="field">
              <label>Packet Weight</label>
              <input v-model="form.packet_weight" :class="{ invalid: errors.packet_weight }" type="number" min="0" step="0.1" placeholder="0.2">
              <span v-if="errors.packet_weight" class="field-error">{{ errors.packet_weight }}</span>
            </div>
            <div class="field">
              <label>Shipment Type</label>
              <select v-model="form.shipment_type" :class="{ invalid: errors.shipment_type }">
                <option value=""></option>
                <option>Overnight</option>
                <option>Same Day</option>
                <option>Detain</option>
              </select>
              <span v-if="errors.shipment_type" class="field-error">{{ errors.shipment_type }}</span>
            </div>
          </div>

          <div class="section-line"></div>

          <div class="grid cod-row">
            <div class="field">
              <label>Cash On Delivery</label>
              <input v-model="form.cod" :class="{ invalid: errors.cod }" type="number" min="0" placeholder="999">
              <span v-if="errors.cod" class="field-error">{{ errors.cod }}</span>
            </div>
            <div class="field">
              <label>Delivery Charges</label>
              <input v-model="form.delivery_charges" :class="{ invalid: errors.delivery_charges }" type="number" min="0" placeholder="150">
              <span v-if="errors.delivery_charges" class="field-error">{{ errors.delivery_charges }}</span>
            </div>
            <label class="checkbox-field">
              <input v-model="form.generate_label" type="checkbox">
              <span>Generate Label</span>
            </label>
          </div>

          <div class="field">
            <label>Special Instructions</label>
            <textarea v-model="form.special_instructions" :class="{ invalid: errors.special_instructions }" rows="3" placeholder="1 x Unbreakable Child Fridge Lock (Free Home Delivery)"></textarea>
            <span v-if="errors.special_instructions" class="field-error">{{ errors.special_instructions }}</span>
          </div>

          <div class="field">
            <label>Internal Notes</label>
            <textarea v-model="form.internal_notes" :class="{ invalid: errors.internal_notes }" rows="3" placeholder="Internal Notes..."></textarea>
            <span v-if="errors.internal_notes" class="field-error">{{ errors.internal_notes }}</span>
          </div>

          <div class="items-header">
            <label>Order Items...</label>
            <button type="button" class="copy-btn" @click="copyItems">Copy</button>
          </div>

          <div class="item-row">
            <select v-model="item.product" :class="{ invalid: errors.items }">
              <option value="">Select Product</option>
              <option>Heavy Duty Torch Light</option>
              <option>Unbreakable Child Fridge Lock</option>
              <option>Rechargeable Hammer Torch</option>
            </select>
            <input v-model.number="item.quantity" :class="{ invalid: errors.items }" type="number" min="0" placeholder="0">
            <button type="button" class="add-item-btn" @click="addItem">Add</button>
          </div>
          <span v-if="errors.items" class="field-error items-error">{{ errors.items }}</span>

          <div v-if="items.length" class="selected-items">
            <div v-for="(row, index) in items" :key="`${row.product}-${index}`" class="selected-item">
              <span>{{ index + 1 }}. {{ row.product }}</span>
              <strong>Qty: {{ row.quantity }}</strong>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="cancel-btn" @click="router.push('/orders')">Cancel</button>
            <button type="submit" class="save-btn">Save</button>
          </div>
        </form>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import { getCourierName } from '../../constants/couriers';
import { useBrandStore } from '../../stores/brandStore';
import { useIntegrationStore } from '../../stores/integrationStore';

const router = useRouter();
const brandStore = useBrandStore();
const integrationStore = useIntegrationStore();
const items = ref([]);
const errors = reactive({});

const form = reactive({
  brand_id: '',
  source: '',
  customer_name: '',
  customer_contact: '',
  customer_contact_two: '',
  customer_address: '',
  courier: '',
  pickup_address_code: '',
  origin_city: '',
  destination_city: '',
  packet_weight: '0.2',
  shipment_type: '',
  cod: '',
  delivery_charges: '',
  generate_label: false,
  special_instructions: '',
  internal_notes: '',
});

const item = reactive({
  product: '',
  quantity: 0,
});

const selectedBrand = computed(() => brandStore.brands.find(brand => brand.id === form.brand_id));
const brandSources = computed(() => selectedBrand.value?.sources || []);
const brandIntegrations = computed(() => integrationStore.integrations.filter((integration) => integration.brand?.id === form.brand_id));
const courierOptions = computed(() => {
  const bySlug = new Map();
  brandIntegrations.value.forEach((integration) => {
    if (!bySlug.has(integration.courier_slug)) {
      bySlug.set(integration.courier_slug, {
        slug: integration.courier_slug,
        name: integration.courier_name || getCourierName(integration.courier_slug),
      });
    }
  });
  return [...bySlug.values()];
});
const isPostexSelected = computed(() => form.courier === 'postex');
const postexIntegrations = computed(() => brandIntegrations.value.filter((integration) => integration.courier_slug === 'postex'));

watch(() => form.brand_id, () => {
  form.source = '';
  form.courier = '';
  form.pickup_address_code = '';
  form.origin_city = '';
  delete errors.brand_id;
  delete errors.source;
  delete errors.courier;
  delete errors.pickup_address_code;
  delete errors.origin_city;
});

watch(() => form.source, () => {
  delete errors.source;
});

watch(() => form.courier, () => {
  form.pickup_address_code = '';
  form.origin_city = '';
  delete errors.courier;
  delete errors.pickup_address_code;
  delete errors.origin_city;
});

watch(() => form.pickup_address_code, () => {
  delete errors.pickup_address_code;
});

[
  'customer_name',
  'customer_contact',
  'customer_address',
  'courier',
  'origin_city',
  'destination_city',
  'packet_weight',
  'shipment_type',
  'cod',
  'delivery_charges',
  'special_instructions',
  'internal_notes',
].forEach((key) => {
  watch(() => form[key], () => {
    delete errors[key];
  });
});

onMounted(async () => {
  await Promise.all([
    brandStore.brands.length ? Promise.resolve() : brandStore.fetchBrands(),
    integrationStore.integrations.length ? Promise.resolve() : integrationStore.fetchIntegrations(),
  ]);
});

const pickupAddressName = (integration) => {
  const address = integration.courier_options?.pickup_address;
  return address?.contactPersonName || address?.address || integration.courier_options?.pickup_address_code || 'Pickup Address';
};

const addItem = () => {
  if (!item.product) return;
  items.value.push({ product: item.product, quantity: item.quantity || 1 });
  item.product = '';
  item.quantity = 0;
  delete errors.items;
};

const copyItems = async () => {
  const text = items.value.map(row => `${row.quantity} x ${row.product}`).join('\n');
  if (navigator.clipboard && text) {
    await navigator.clipboard.writeText(text);
  }
};

const handleSave = () => {
  Object.keys(errors).forEach(key => delete errors[key]);

  if (!form.brand_id) {
    errors.brand_id = 'Brand is required.';
  }

  if (!form.source) {
    errors.source = 'Source is required.';
  }

  const requiredFields = {
    customer_name: 'Customer name is required.',
    customer_contact: 'Customer contact is required.',
    customer_address: 'Customer address is required.',
    courier: 'Courier is required.',
    destination_city: 'Destination city is required.',
    packet_weight: 'Packet weight is required.',
    shipment_type: 'Shipment type is required.',
    cod: 'Cash on delivery is required.',
    delivery_charges: 'Delivery charges are required.',
    special_instructions: 'Special instructions are required.',
    internal_notes: 'Internal notes are required.',
  };

  Object.entries(requiredFields).forEach(([key, message]) => {
    if (form[key] === null || form[key] === undefined || String(form[key]).trim() === '') {
      errors[key] = message;
    }
  });

  if (isPostexSelected.value) {
    if (!form.pickup_address_code) {
      errors.pickup_address_code = 'Pickup address is required.';
    }
  } else if (!form.origin_city) {
    errors.origin_city = 'Origin city is required.';
  }

  if (!items.value.length && !item.product) {
    errors.items = 'At least one order item is required.';
  }

  if (Object.keys(errors).length) return;

  window.alert('Create order backend workflow will be added later.');
};
</script>

<style scoped>
.create-order-page {
  min-height: 100vh;
  padding: 12px;
  background: #f1f5f9;
}

.order-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 18px 22px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h1 {
  margin: 0;
  color: #172554;
  font-size: 14px;
  font-weight: 800;
}

.order-form {
  display: grid;
  gap: 22px;
  padding: 22px 36px;
}

.grid {
  display: grid;
  gap: 22px;
}

.grid.two {
  grid-template-columns: 250px 250px;
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid.compact {
  grid-template-columns: 250px 250px;
}

.grid.cod-row {
  grid-template-columns: 250px 250px auto;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label,
.items-header label {
  color: #1e3a8a;
  font-size: 12px;
  font-weight: 700;
}

.optional-label {
  color: #94a3b8;
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  background: #fff;
  color: #1e293b;
  font-size: 12px;
  outline: none;
}

input,
select {
  height: 34px;
  padding: 0 10px;
}

textarea {
  min-height: 50px;
  padding: 10px;
  resize: vertical;
}

input::placeholder,
textarea::placeholder,
select {
  color: #94a3b8;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #1e293b;
}

select:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.invalid {
  border-color: #ef4444;
}

.field-error {
  color: #ef4444;
  font-size: 11px;
  font-weight: 600;
}

.items-error {
  margin-top: -16px;
}

.section-line {
  height: 3px;
  background: #128018;
  margin: 14px 0 0;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.checkbox-field input {
  width: 13px;
  height: 13px;
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: -14px;
}

.copy-btn {
  border: 1px solid #4f46e5;
  border-radius: 4px;
  background: #fff;
  color: #4f46e5;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}

.item-row {
  display: grid;
  grid-template-columns: minmax(260px, 340px) 160px 56px;
  gap: 22px;
  align-items: center;
}

.add-item-btn,
.save-btn {
  border: none;
  border-radius: 4px;
  background: #5865e8;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.add-item-btn {
  height: 28px;
}

.selected-items {
  display: grid;
  gap: 8px;
  max-width: 560px;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px 10px;
  color: #334155;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.cancel-btn {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.save-btn {
  padding: 7px 12px;
}

@media (max-width: 900px) {
  .order-form {
    padding: 20px;
  }

  .grid.two,
  .grid.three,
  .grid.compact,
  .grid.cod-row,
  .item-row {
    grid-template-columns: 1fr;
  }
}
</style>
