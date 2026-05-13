<template>
  <AppLayout>
    <main class="create-order-page">
      <section class="order-card">
        <header class="card-header">
          <div>
            <p class="eyebrow">Orders</p>
            <h1>{{ isEditMode ? 'Edit Order' : 'Create Order' }}</h1>
          </div>
          <span class="status-pill">{{ isEditMode ? 'Draft update' : 'Manual entry' }}</span>
        </header>

        <form class="order-form" @submit.prevent="handleSave">
          <div class="section-title">
            <span>01</span>
            <h2>Brand & Source</h2>
          </div>

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

          <div class="section-title">
            <span>02</span>
            <h2>Customer</h2>
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

          <div class="section-title section-title-spaced">
            <span>03</span>
            <h2>Shipping</h2>
          </div>

          <div class="grid three">
            <div class="field">
              <label>Ship Through</label>
              <select v-model="form.courier_integration_id" :class="{ invalid: errors.courier_integration_id }" @change="handleCourierChange">
                <option value="">Select Courier</option>
                <option v-for="integration in integrationStore.integrations" :key="integration.id" :value="integration.id">
                  {{ integration.name || integration.courier_name }}
                </option>
              </select>
              <span v-if="errors.courier_integration_id" class="field-error">{{ errors.courier_integration_id }}</span>
            </div>
            <div v-if="isPostexSelected" class="field">
              <label>Pickup Address</label>
              <select
                v-model="form.pickup_address_code"
                :class="{ invalid: errors.pickup_address_code }"
                :disabled="postexPickupLoading"
                @focus="ensurePostexPickupAddresses"
              >
                <option value="">
                  {{ postexPickupLoading ? 'Fetching pickup addresses...' : 'Select Pickup Address' }}
                </option>
                <option
                  v-for="address in postexPickupAddresses"
                  :key="address.addressCode"
                  :value="address.addressCode"
                >
                  {{ pickupAddressName(address) }}
                </option>
              </select>
              <span v-if="postexPickupLoading" class="helper-text">Fetching pickup addresses from PostEx...</span>
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
              <select
                v-model="form.destination_city"
                :class="{ invalid: errors.destination_city }"
                :disabled="isPostexSelected && postexCityLoading"
                @focus="ensurePostexDeliveryCities"
              >
                <option value="">
                  {{ postexCityLoading ? 'Fetching cities...' : 'Select Destination City' }}
                </option>
                <option
                  v-for="city in destinationCityOptions"
                  :key="city.value"
                  :value="city.value"
                >
                  {{ city.label }}
                </option>
              </select>
              <span v-if="postexCityLoading" class="helper-text">Fetching delivery cities from PostEx...</span>
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

          <div class="section-title section-title-spaced">
            <span>04</span>
            <h2>Payment & Notes</h2>
          </div>

          <div class="grid cod-row">
            <div class="field">
              <label>Cash On Delivery</label>
              <input v-model="form.cod" :class="{ invalid: errors.cod }" type="number" min="0" placeholder="999">
              <span v-if="errors.cod" class="field-error">{{ errors.cod }}</span>
            </div>
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

          <div class="items-header section-title-spaced">
            <div class="section-title inline">
              <span>05</span>
              <h2>Order Items</h2>
            </div>
            <button type="button" class="copy-btn" @click="copyItems">Copy</button>
          </div>

          <div class="item-row">
            <div class="field no-gap">
              <select v-model="item.product_id" :class="{ invalid: errors.items }">
                <option value="">Select Product</option>
                <option v-for="product in productStore.products" :key="product.id" :value="product.id">
                  {{ product.name }}
                </option>
              </select>
            </div>
            <div class="field no-gap">
              <input v-model.number="item.quantity" :class="{ invalid: errors.items }" type="number" min="0" placeholder="0">
            </div>
            <button type="button" class="add-item-btn" @click="addItem">Add</button>
          </div>
          <span v-if="errors.items || !hasOrderProducts" class="field-error items-error">
            {{ errors.items || 'Add at least one product before saving.' }}
          </span>

          <div v-if="items.length" class="selected-items">
            <div v-for="(row, index) in items" :key="row.product_id" class="selected-item">
              <img class="item-image" :src="row.picture_url" :alt="row.name">
              <div class="item-main">
                <span>{{ index + 1 }} x {{ row.name }}</span>
                <strong>Rs. {{ Number(row.sale_price || 0).toLocaleString() }} Per Piece</strong>
              </div>
              <div class="item-qty">
                <label>Qty</label>
                <input v-model.number="row.quantity" type="number" min="1">
              </div>
              <button class="remove-item-btn" type="button" @click="removeItem(row.product_id)">Remove</button>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="cancel-btn" @click="router.push('/orders')">Cancel</button>
            <button type="button" class="hold-btn" :disabled="saving || creatingShipment || !hasOrderProducts" @click="handleSave('hold')">
              {{ saving ? 'Saving...' : 'Save as Hold' }}
            </button>
            <button type="button" class="create-btn" :disabled="saving || creatingShipment || !hasOrderProducts" @click="handleSave('create')">
              {{ creatingShipment ? 'Creating...' : 'Create Order' }}
            </button>
          </div>
        </form>
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import IntegrationService from '../../services/IntegrationService';
import { useBrandStore } from '../../stores/brandStore';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useOrderStore } from '../../stores/orderStore';
import { useProductStore } from '../../stores/productStore';

const router = useRouter();
const route = useRoute();
const brandStore = useBrandStore();
const integrationStore = useIntegrationStore();
const orderStore = useOrderStore();
const productStore = useProductStore();
const items = ref([]);
const errors = reactive({});
const saving = ref(false);
const creatingShipment = ref(false);
const hydratingOrder = ref(false);
const postexPickupAddresses = ref([]);
const postexPickupLoading = ref(false);
const postexPickupError = ref('');
const postexDeliveryCities = ref([]);
const postexCityLoading = ref(false);
const postexCityError = ref('');

const form = reactive({
  brand_id: '',
  source: '',
  customer_name: '',
  customer_contact: '',
  customer_contact_two: '',
  customer_address: '',
  courier_integration_id: '',
  pickup_address_code: '',
  origin_city: '',
  destination_city: '',
  packet_weight: '0.2',
  shipment_type: '',
  cod: '',
  special_instructions: '',
  internal_notes: '',
});

const item = reactive({
  product_id: '',
  quantity: 0,
});

const isEditMode = computed(() => Boolean(route.params.id));
const hasOrderProducts = computed(() => items.value.length > 0);
const selectedBrand = computed(() => brandStore.brands.find(brand => brand.id === form.brand_id));
const brandSources = computed(() => selectedBrand.value?.sources || []);
const selectedIntegration = computed(() => integrationStore.integrations.find((integration) => String(integration.id) === String(form.courier_integration_id)));
const isPostexSelected = computed(() => selectedIntegration.value?.courier_slug === 'postex');
const destinationCityOptions = computed(() => {
  if (isPostexSelected.value) {
    return postexDeliveryCities.value.map((city) => ({
      value: city.operationalCityName,
      label: city.countryName ? `${city.operationalCityName} - ${city.countryName}` : city.operationalCityName,
    }));
  }

  return ['Lahore', 'Karachi', 'Islamabad'].map((city) => ({
    value: city,
    label: city,
  }));
});

watch(() => form.brand_id, () => {
  if (hydratingOrder.value) return;

  form.source = '';
  form.courier_integration_id = '';
  form.pickup_address_code = '';
  form.origin_city = '';
  form.destination_city = '';
  delete errors.brand_id;
  delete errors.source;
  delete errors.courier_integration_id;
  delete errors.pickup_address_code;
  delete errors.origin_city;
  delete errors.destination_city;
});

watch(() => form.source, () => {
  delete errors.source;
});

const resetCourierDependentFields = () => {
  form.pickup_address_code = '';
  form.origin_city = '';
  form.destination_city = '';
  postexPickupAddresses.value = [];
  postexPickupError.value = '';
  postexDeliveryCities.value = [];
  postexCityError.value = '';
  delete errors.courier_integration_id;
  delete errors.pickup_address_code;
  delete errors.origin_city;
  delete errors.destination_city;
};

const loadPostexRuntimeData = async () => {
  if (isPostexSelected.value) {
    await Promise.all([
      fetchPostexPickupAddresses(),
      fetchPostexDeliveryCities(),
    ]);
  }
};

const handleCourierChange = async () => {
  resetCourierDependentFields();
  await loadPostexRuntimeData();
};

watch(() => form.pickup_address_code, () => {
  delete errors.pickup_address_code;
});

[
  'customer_name',
  'customer_contact',
  'customer_address',
  'courier_integration_id',
  'destination_city',
  'packet_weight',
  'shipment_type',
  'cod',
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
    productStore.products.length ? Promise.resolve() : productStore.fetchProducts(),
  ]);

  if (isEditMode.value) {
    await loadOrderForEdit(route.params.id);
  }
});

const loadOrderForEdit = async (id) => {
  const order = await orderStore.fetchOrder(id);
  orderStore.closePanel();
  const manual = order.manual_order || {};

  hydratingOrder.value = true;
  form.brand_id = order.brand_id || '';
  form.source = order.source || '';
  form.customer_name = order.customer?.name || '';
  form.customer_contact = order.customer?.phone_local || order.customer?.phone_intl || '';
  form.customer_contact_two = manual.customer_contact_two || order.customer?.phone_two || '';
  form.customer_address = order.customer?.address || '';
  form.courier_integration_id = manual.courier_integration_id || order.courier_integration_id || '';
  form.pickup_address_code = manual.pickup_address_code || '';
  form.origin_city = manual.origin_city || '';
  form.destination_city = manual.destination_city || order.customer?.city || '';
  form.packet_weight = manual.packet_weight ?? '0.2';
  form.shipment_type = manual.shipment_type || '';
  form.cod = manual.cod ?? order.total_price ?? '';
  form.special_instructions = manual.special_instructions || (order.shopify_order_id ? shopifyInstructions(order.line_items || []) : '');
  form.internal_notes = manual.internal_notes || '';

  await nextTick();
  hydratingOrder.value = false;

  items.value = order.shopify_order_id ? [] : (order.line_items || []).map((line) => ({
    product_id: line.product_id,
    name: line.title || line.name,
    picture_url: line.picture_url,
    sale_price: line.price,
    quantity: line.quantity || 1,
  }));

  if (isPostexSelected.value) {
    await loadPostexRuntimeData();
  }
};

const addItem = () => {
  const product = productStore.products.find((candidate) => candidate.id === item.product_id);
  if (!product) return;

  const existing = items.value.find((row) => row.product_id === product.id);
  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    items.value.push({
      product_id: product.id,
      name: product.name,
      picture_url: product.picture_url,
      sale_price: product.sale_price,
      quantity: item.quantity || 1,
    });
  }

  item.product_id = '';
  item.quantity = 0;
  delete errors.items;
};

const removeItem = (productId) => {
  items.value = items.value.filter((row) => row.product_id !== productId);
};

const copyItems = async () => {
  const text = items.value.map(row => `${row.quantity} x ${row.name}`).join('\n');
  if (navigator.clipboard && text) {
    await navigator.clipboard.writeText(text);
  }
};

const getPostexApiToken = () => selectedIntegration.value?.courier_options?.api_token;

const pickupAddressName = (address) => {
  return [
    address.contactPersonName || address.address || 'Pickup Address',
    address.cityName,
    address.phone1,
    address.addressCode,
  ].filter(Boolean).join(' - ');
};

const fetchPostexPickupAddresses = async () => {
  const token = getPostexApiToken();

  if (!token) {
    postexPickupError.value = 'PostEx API token is missing. Update the PostEx integration first.';
    errors.pickup_address_code = postexPickupError.value;
    return;
  }

  postexPickupLoading.value = true;
  postexPickupError.value = '';

  try {
    const res = await IntegrationService.fetchPostexPickupAddresses({ token });
    postexPickupAddresses.value = res.data.data.addresses;
    if (postexPickupAddresses.value.length === 0) {
      postexPickupError.value = 'No pickup addresses found for this PostEx account.';
      errors.pickup_address_code = postexPickupError.value;
    }
  } catch (error) {
    postexPickupError.value = apiErrorMessage(error, 'Unable to fetch PostEx pickup addresses.');
    errors.pickup_address_code = postexPickupError.value;
  } finally {
    postexPickupLoading.value = false;
  }
};

const ensurePostexPickupAddresses = () => {
  if (!isPostexSelected.value || postexPickupLoading.value || postexPickupAddresses.value.length > 0) return;
  fetchPostexPickupAddresses();
};

const fetchPostexDeliveryCities = async () => {
  const token = getPostexApiToken();

  if (!token) {
    postexCityError.value = 'PostEx API token is missing. Update the PostEx integration first.';
    errors.destination_city = postexCityError.value;
    return;
  }

  postexCityLoading.value = true;
  postexCityError.value = '';

  try {
    const res = await IntegrationService.fetchPostexOperationalCities({
      token,
      operationalCityType: 'delivery',
    });
    postexDeliveryCities.value = res.data.data.cities;
    if (postexDeliveryCities.value.length === 0) {
      postexCityError.value = 'No delivery cities found for this PostEx account.';
      errors.destination_city = postexCityError.value;
    }
  } catch (error) {
    postexCityError.value = apiErrorMessage(error, 'Unable to fetch PostEx delivery cities.');
    errors.destination_city = postexCityError.value;
  } finally {
    postexCityLoading.value = false;
  }
};

const shopifyInstructions = (lineItems = []) => {
  return lineItems.map((line) => {
    const quantity = Number(line.quantity || 1);
    const title = line.title || line.name || 'Product';
    const variant = line.variant_title || line.variant || '';

    return `${quantity} X ${title}${variant ? ` - ${variant}` : ''}`;
  }).join('\n');
};

const ensurePostexDeliveryCities = () => {
  if (!isPostexSelected.value || postexCityLoading.value || postexDeliveryCities.value.length > 0) return;
  fetchPostexDeliveryCities();
};

const apiErrorMessage = (error, fallback) => {
  const serverMessage = error.response?.data?.message || error.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (error.response?.status) return `${fallback} Server returned HTTP ${error.response.status}.`;
  if (error.request) return `${fallback} No response from API server.`;
  return fallback;
};

const buildPayload = () => ({
  ...form,
  line_items: items.value.map((row) => ({
    product_id: row.product_id,
    quantity: Number(row.quantity || 1),
  })),
});

const handleSave = async (mode) => {
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
    courier_integration_id: 'Courier is required.',
    destination_city: 'Destination city is required.',
    packet_weight: 'Packet weight is required.',
    shipment_type: 'Shipment type is required.',
    cod: 'Cash on delivery is required.',
    special_instructions: 'Special instructions are required.',
    internal_notes: 'Internal notes are required.',
  };

  Object.entries(requiredFields).forEach(([key, message]) => {
    if (form[key] === null || form[key] === undefined || String(form[key]).trim() === '') {
      errors[key] = message;
    }
  });

  if (isPostexSelected.value) {
    if (postexPickupLoading.value) {
      errors.pickup_address_code = 'Pickup addresses are still loading.';
    } else if (postexPickupError.value) {
      errors.pickup_address_code = postexPickupError.value;
    } else if (!form.pickup_address_code) {
      errors.pickup_address_code = 'Pickup address is required.';
    }

    if (postexCityLoading.value) {
      errors.destination_city = 'Destination cities are still loading.';
    } else if (postexCityError.value) {
      errors.destination_city = postexCityError.value;
    } else if (!form.destination_city) {
      errors.destination_city = 'Destination city is required.';
    }
  } else if (!form.origin_city) {
    errors.origin_city = 'Origin city is required.';
  }

  if (!hasOrderProducts.value) {
    errors.items = 'At least one order item is required.';
  }

  if (Object.keys(errors).length) return;

  saving.value = true;
  try {
    let order;
    if (isEditMode.value) {
      order = await orderStore.updateHold(route.params.id, buildPayload());
    } else {
      order = await orderStore.createHold(buildPayload());
    }

    if (mode === 'create') {
      saving.value = false;
      creatingShipment.value = true;
      const result = await orderStore.createPostexShipment(order.id);
      const tracking = result.tracking_number || 'created';
      window.alert(`Shipment created! Tracking: ${tracking}`);
    }

    router.push('/orders');
  } catch (error) {
    const responseErrors = error.response?.data?.errors;
    const message = error.response?.data?.message || 'Unable to save order.';
    if (responseErrors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(responseErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      ));
    }
    window.alert(message);
  } finally {
    saving.value = false;
    creatingShipment.value = false;
  }
};
</script>

<style scoped>
.create-order-page {
  min-height: 100vh;
  padding: 30px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.10), transparent 30%),
    #f1f5f9;
}

.order-card {
  max-width: 1280px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 30px;
  border-bottom: 1px solid #e2e8f0;
  background:
    linear-gradient(135deg, rgba(239, 246, 255, 0.95), rgba(255, 255, 255, 0.95));
}

.eyebrow {
  margin: 0 0 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.card-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 850;
  white-space: nowrap;
}

.order-form {
  display: grid;
  gap: 18px;
  padding: 28px 30px 30px;
}

.grid {
  display: grid;
  gap: 18px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(220px, 300px));
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid.compact {
  grid-template-columns: repeat(2, minmax(220px, 280px));
}

.grid.cod-row {
  grid-template-columns: minmax(220px, 280px);
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.no-gap {
  gap: 0;
}

.field label,
.items-header label {
  color: #334155;
  font-size: 12px;
  font-weight: 850;
}

.optional-label {
  color: #94a3b8;
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

input,
select {
  height: 42px;
  padding: 0 12px;
}

textarea {
  min-height: 88px;
  padding: 12px;
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
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
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
  font-weight: 750;
}

.helper-text {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.items-error {
  margin-top: -8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.section-title-spaced {
  margin-top: 12px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.section-title.inline {
  margin: 0;
  padding: 0;
  border: none;
}

.section-title span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

.section-title h2 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.copy-btn {
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #fff;
  color: #2563eb;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.item-row {
  display: grid;
  grid-template-columns: minmax(280px, 420px) 160px 78px;
  gap: 14px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 14px;
}

.add-item-btn,
.hold-btn,
.create-btn {
  border: none;
  border-radius: 8px;
  background: #5865e8;
  color: #fff;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, opacity 0.15s;
}

.add-item-btn {
  height: 42px;
  background: #2563eb;
}

.add-item-btn:hover,
.hold-btn:hover:not(:disabled),
.create-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.selected-items {
  display: grid;
  gap: 12px;
  max-width: 860px;
}

.selected-item {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 96px auto;
  align-items: center;
  gap: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  color: #334155;
  font-size: 13px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.item-image {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.item-main span {
  overflow: hidden;
  color: #0f172a;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-main strong {
  color: #64748b;
  font-weight: 750;
}

.item-qty {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-qty label {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.remove-item-btn {
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  color: #ef4444;
  padding: 9px 11px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.hold-btn,
.create-btn {
  padding: 10px 14px;
}

.hold-btn {
  background: #64748b;
}

.create-btn {
  background: #1e293b;
}

.hold-btn:disabled,
.create-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .create-order-page {
    padding: 18px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .order-form {
    padding: 22px;
  }

  .grid.two,
  .grid.three,
  .grid.compact,
  .grid.cod-row,
  .item-row,
  .selected-item {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: stretch;
    flex-direction: column;
  }
}
</style>
