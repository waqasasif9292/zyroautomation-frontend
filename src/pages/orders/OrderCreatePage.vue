<template>
  <AppLayout>
    <main class="create-order-page">
      <section class="order-card">
        <header class="card-header">
          <div>
            <p v-if="!isEditMode" class="eyebrow">Orders</p>
            <h1>{{ pageTitle }}</h1>
            <p v-if="editOrderNumber" class="order-number-header">Order Number: {{ editOrderNumber }}</p>
          </div>
          <div class="header-actions">
            <button
              v-if="showHoldLogsButton"
              type="button"
              class="hold-logs-btn"
              @click="showHoldLogsModal = true"
            >
              Hold Logs
            </button>
            <span v-if="!isEditMode" class="status-pill">{{ pageStatus }}</span>
          </div>
        </header>

        <form ref="formRef" class="order-form" :class="{ 'readonly-form': isReadonlyMode }" @submit.prevent="handleFormSubmit">
          <fieldset class="form-fields" :disabled="readonlyLocksEntireForm">
            <div class="section-title">
              <span>01</span>
              <h2>Brand & Source</h2>
            </div>

          <div class="grid two">
            <div class="field">
              <label>Brand</label>
              <select v-model="form.brand_id" :class="{ invalid: errors.brand_id }" :disabled="isReadonlyFieldDisabled('brand_id')">
                <option value="">Select Brand</option>
                <option v-for="brand in brandStore.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
              </select>
              <span v-if="errors.brand_id" class="field-error">{{ errors.brand_id }}</span>
            </div>
            <div class="field">
              <label>Source</label>
              <select v-model="form.source" :class="{ invalid: errors.source }" :disabled="!selectedBrand || isReadonlyFieldDisabled('source')">
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
              <input v-model="form.customer_name" :class="{ invalid: errors.customer_name }" type="text" placeholder="Irfan Khan" :disabled="readonlyLocksPartialForm">
              <span v-if="errors.customer_name" class="field-error">{{ errors.customer_name }}</span>
            </div>
            <div class="field">
              <label>Customer Contact</label>
              <input
                v-model="form.customer_contact"
                :class="{ invalid: errors.customer_contact }"
                type="text"
                inputmode="numeric"
                maxlength="15"
                placeholder="03XXXXXXXXX"
                :disabled="readonlyLocksPartialForm"
                @blur="handlePhoneBlur('customer_contact', true)"
              >
              <span class="phone-helper">Format: 03XXXXXXXXX</span>
              <span v-if="customerContactPreview" class="phone-preview">Will save as {{ customerContactPreview }}</span>
              <span v-if="phoneWarnings.customer_contact" class="phone-warning">{{ phoneWarnings.customer_contact }}</span>
              <span v-if="errors.customer_contact" class="field-error">{{ errors.customer_contact }}</span>
            </div>
            <div class="field">
              <label>Customer Contact Two <span class="optional-label">Optional</span></label>
              <input
                v-model="form.customer_contact_two"
                type="text"
                inputmode="numeric"
                maxlength="15"
                placeholder="03XXXXXXXXX"
                :disabled="readonlyLocksPartialForm"
                @blur="handlePhoneBlur('customer_contact_two')"
              >
              <span class="phone-helper">Format: 03XXXXXXXXX</span>
              <span v-if="customerContactTwoPreview" class="phone-preview">Will save as {{ customerContactTwoPreview }}</span>
              <span v-if="phoneWarnings.customer_contact_two" class="phone-warning">{{ phoneWarnings.customer_contact_two }}</span>
            </div>
          </div>

          <div class="field">
            <div class="address-label-row">
              <label>Customer Address</label>
              <button
                v-if="canUseAiAddressSuggestions"
                type="button"
                class="ai-address-btn"
                :disabled="readonlyLocksPartialForm || addressAiLoading || !form.customer_address.trim()"
                @click="improveAddressWithAi"
              >
                <span v-if="addressAiLoading" class="ai-spinner"></span>
                {{ addressAiLoading ? 'Improving...' : '✨ Improve with AI' }}
              </button>
            </div>
            <input v-model="form.customer_address" :class="{ invalid: errors.customer_address }" type="text" placeholder="Billal colony, Pattoki" :disabled="readonlyLocksPartialForm">
            <span v-if="errors.customer_address" class="field-error">{{ errors.customer_address }}</span>
          </div>

          <div v-if="canUseAiAddressSuggestions && addressSuggestion.correctedAddress" class="ai-address-panel" :class="`confidence-${addressSuggestion.confidence || 'low'}`">
            <div class="ai-address-panel-header">
              <div>
                <strong>Suggested Address</strong>
                <span>{{ addressSuggestionMeta }}</span>
              </div>
              <div class="ai-address-actions">
                <button type="button" class="copy-btn small" @click="copyAddressSuggestion">Copy</button>
                <button type="button" class="copy-btn small primary" :disabled="readonlyLocksPartialForm" @click="replaceAddressWithSuggestion">
                  Replace Original
                </button>
              </div>
            </div>
            <textarea v-model="addressSuggestion.correctedAddress" rows="2" :disabled="readonlyLocksPartialForm"></textarea>
            <span v-if="addressSuggestionWarning" class="ai-address-warning">{{ addressSuggestionWarning }}</span>
          </div>

          <div v-if="showAddressConfirmationInForm" class="whatsapp-action-panel" :class="{ sent: addressConfirmationSent }">
            <div>
              <strong>Address confirmation</strong>
              <span>{{ addressConfirmationHelperText }}</span>
            </div>
            <button type="button" class="whatsapp-action-btn" :disabled="addressConfirmationSending" @click="sendAddressConfirmation">
              {{ addressConfirmationButtonText }}
            </button>
          </div>

          <div class="section-title section-title-spaced">
            <span>03</span>
            <h2>Shipping</h2>
          </div>

          <div class="grid three">
            <div class="field">
              <label>Ship Through</label>
              <select v-model="form.courier_integration_id" :class="{ invalid: errors.courier_integration_id }" :disabled="readonlyLocksPartialForm" @change="handleCourierChange">
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
                :disabled="postexPickupLoading || readonlyLocksPartialForm"
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
            <div v-else-if="isDastaqSelected" class="field">
              <label>Pickup Address</label>
              <select
                v-model="form.pickup_address_code"
                :class="{ invalid: errors.pickup_address_code }"
                :disabled="dastaqPickupLoading || readonlyLocksPartialForm"
                @focus="ensureDastaqPickupAddresses"
              >
                <option value="">
                  {{ dastaqPickupLoading ? 'Fetching pickup addresses...' : 'Select Pickup Address' }}
                </option>
                <option
                  v-for="address in dastaqPickupAddresses"
                  :key="address.id"
                  :value="address.id"
                >
                  {{ dastaqPickupAddressName(address) }}
                </option>
              </select>
              <span v-if="dastaqPickupLoading" class="helper-text">Fetching pickup addresses from Dastaq...</span>
              <span v-if="errors.pickup_address_code" class="field-error">{{ errors.pickup_address_code }}</span>
            </div>
            <div v-else-if="isLeopardSelected" class="field">
              <label>Pickup Address</label>
              <select v-model="form.leopard_pickup_address_id" :class="{ invalid: errors.leopard_pickup_address_id }" :disabled="readonlyLocksPartialForm">
                <option value="">Select Pickup Address</option>
                <option v-for="address in leopardPickupAddresses" :key="address.id" :value="address.id">
                  {{ leopardPickupAddressName(address) }}
                </option>
              </select>
              <span v-if="errors.leopard_pickup_address_id" class="field-error">{{ errors.leopard_pickup_address_id }}</span>
            </div>
            <div v-else-if="hasCourierSelected && !isArgoSelected" class="field">
              <label>Origin City</label>
              <select v-model="form.origin_city" :class="{ invalid: errors.origin_city }" :disabled="readonlyLocksPartialForm">
                <option value=""></option>
                <option>Lahore</option>
                <option>Karachi</option>
                <option>Islamabad</option>
              </select>
              <span v-if="errors.origin_city" class="field-error">{{ errors.origin_city }}</span>
            </div>
            <div v-if="hasCourierSelected" class="field">
              <label>Destination City</label>
              <div class="city-combobox" :class="{ invalid: errors.destination_city, disabled: citySelectDisabled }">
                <input
                  v-model="citySearch"
                  type="text"
                  autocomplete="off"
                  :disabled="citySelectDisabled || readonlyLocksPartialForm"
                  :placeholder="citySelectPlaceholder"
                  @focus="openCityCombobox"
                  @input="handleCitySearch"
                  @keydown.enter.prevent="selectFirstFilteredCity"
                  @keydown.esc="closeCityCombobox"
                  @blur="closeCityCombobox"
                >
                <div v-if="isCityComboboxOpen" class="city-options">
                  <button
                    v-for="city in filteredDestinationCityOptions"
                    :key="city.value"
                    type="button"
                    class="city-option"
                    :disabled="readonlyLocksPartialForm"
                    @mousedown.prevent="selectDestinationCity(city)"
                  >
                    {{ city.label }}
                  </button>
                  <div v-if="!filteredDestinationCityOptions.length" class="city-option-empty">No cities found</div>
                </div>
              </div>
              <span v-if="postexCityLoading" class="helper-text">Fetching delivery cities from PostEx...</span>
              <span v-if="leopardCityLoading" class="helper-text">Loading Leopard cities...</span>
              <span v-if="dastaqCityLoading" class="helper-text">Fetching allowed cities from Dastaq...</span>
              <span v-if="argoCityLoading" class="helper-text">Fetching cities from Argo...</span>
              <span v-if="errors.destination_city" class="field-error">{{ errors.destination_city }}</span>
            </div>
          </div>

          <div v-if="hasCourierSelected" class="grid two compact">
            <div class="field">
              <label>{{ isGramWeightSelected ? 'Weight (grams)' : 'Packet Weight (kg)' }}</label>
              <input v-model="form.packet_weight" :class="{ invalid: errors.packet_weight }" type="number" min="0" :step="isGramWeightSelected ? 1 : 0.1" :placeholder="isGramWeightSelected ? '500' : '0.2'" :disabled="readonlyLocksPartialForm">
              <span v-if="errors.packet_weight" class="field-error">{{ errors.packet_weight }}</span>
            </div>
            <div v-if="!isArgoSelected" class="field">
              <label>{{ isDastaqSelected ? 'Payment Type' : 'Shipment Type' }}</label>
              <select v-model="form.shipment_type" :class="{ invalid: errors.shipment_type }" :disabled="readonlyLocksPartialForm">
                <option value="">{{ isDastaqSelected ? 'Select Payment Type' : 'Select Shipment Type' }}</option>
                <option v-for="type in shipmentTypeOptions" :key="type" :value="type">{{ type }}</option>
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
              <label>Total Amount</label>
              <div class="amount-input" :class="{ invalid: errors.total_price }">
                <span>Rs.</span>
                <input v-model="form.total_price" type="number" min="0" placeholder="999" :disabled="isReadonlyFieldDisabled('total_price')">
              </div>
              <span v-if="errors.total_price" class="field-error">{{ errors.total_price }}</span>
            </div>
            <label class="checkbox-field advance-toggle">
              <input v-model="hasAdvancePayment" type="checkbox" :disabled="isReadonlyFieldDisabled('advance_payment')">
              <span>Advance received</span>
            </label>
            <div v-if="hasAdvancePayment" class="field">
              <label>Advance Amount</label>
              <div class="amount-input" :class="{ invalid: errors.advance_payment }">
                <span>Rs.</span>
                <input v-model="form.advance_payment" type="number" min="0" placeholder="0" :disabled="isReadonlyFieldDisabled('advance_payment')">
              </div>
              <span v-if="errors.advance_payment" class="field-error">{{ errors.advance_payment }}</span>
            </div>
          </div>
          <div class="cod-summary-row">
            <div class="cod-summary">
              <span>Courier COD</span>
              <strong>Rs. {{ Number(courierCodAmount || 0).toLocaleString() }}</strong>
              <small>This amount will be printed on the courier label.</small>
            </div>
          </div>

          <div class="field">
            <label>Special Instructions</label>
            <textarea v-model="form.special_instructions" :class="{ invalid: errors.special_instructions }" rows="3" placeholder="1 x Unbreakable Child Fridge Lock (Free Home Delivery)" :disabled="readonlyLocksPartialForm"></textarea>
            <span v-if="errors.special_instructions" class="field-error">{{ errors.special_instructions }}</span>
          </div>

          <div class="field">
            <label>Internal Notes</label>
            <textarea v-model="form.internal_notes" :class="{ invalid: errors.internal_notes }" rows="3" placeholder="Internal Notes..." :disabled="readonlyLocksPartialForm"></textarea>
            <span v-if="errors.internal_notes" class="field-error">{{ errors.internal_notes }}</span>
          </div>

          <div class="items-header section-title-spaced">
            <div class="section-title inline">
              <span>05</span>
              <h2>Order Items</h2>
            </div>
            <div v-if="items.length" class="copy-action">
              <button type="button" class="copy-btn" :disabled="!items.length || readonlyLocksPartialForm" @click="addItemsToSpecialInstructions">
                Add Product Details in Special Instruction
              </button>
            </div>
          </div>

          <div class="item-row">
            <div class="field no-gap">
              <div class="product-combobox" :class="{ invalid: errors.items }">
                <input
                  v-model="productSearch"
                  type="text"
                  placeholder="Search product"
                  autocomplete="off"
                  :disabled="readonlyLocksPartialForm"
                  @focus="openProductCombobox"
                  @input="handleProductSearch"
                  @keydown.enter.prevent="selectFirstFilteredProduct"
                  @keydown.esc="closeProductCombobox"
                  @blur="closeProductCombobox"
                >
                <div v-if="isProductComboboxOpen" class="product-options">
                  <button
                    v-for="product in filteredProducts"
                    :key="product.id"
                    type="button"
                    class="product-option"
                    @mousedown.prevent="selectProduct(product)"
                  >
                    <span>{{ product.name }}</span>
                    <small>Available: {{ Number(product.available_stock ?? product.total_inventory ?? 0).toLocaleString() }}</small>
                  </button>
                  <div v-if="!filteredProducts.length" class="product-option-empty">No products found</div>
                </div>
              </div>
            </div>
            <button type="button" class="add-item-btn" :disabled="readonlyLocksPartialForm" @click="addItem">Add</button>
          </div>
          <span v-if="!isReadonlyMode && (errors.items || !canSaveDraft)" class="field-error items-error">
            {{ errors.items || 'Select at least one product to continue.' }}
          </span>

          <div v-if="items.length" class="selected-items">
            <div v-for="row in items" :key="row.product_id" class="selected-item">
              <img class="item-image" :src="row.picture_url" :alt="row.name">
              <div class="item-main">
                <span>{{ row.quantity || 1 }} x {{ row.name }}</span>
                <strong>Rs. {{ Number(row.sale_price || 0).toLocaleString() }} Per Piece</strong>
              </div>
              <div class="item-qty">
                <label>Qty</label>
                <div class="qty-stepper">
                  <button type="button" :disabled="readonlyLocksPartialForm || Number(row.quantity || 1) <= 1" @click="decrementItemQuantity(row)">-</button>
                  <span>{{ Number(row.quantity || 1).toLocaleString() }}</span>
                  <button type="button" :disabled="readonlyLocksPartialForm" @click="incrementItemQuantity(row)">+</button>
                </div>
              </div>
              <button class="remove-item-btn" type="button" :disabled="readonlyLocksPartialForm" @click="removeItem(row.product_id)">Remove</button>
            </div>
          </div>

          </fieldset>

          <div class="actions">
            <div class="destructive-actions">
              <button v-if="canCancelCurrentOrder" type="button" class="order-cancel-action" :disabled="saving || creatingShipment || destructiveLoading" @click="openCancelOrderDialog">
                Cancel Order
              </button>
              <button v-if="canDeleteCurrentOrder" type="button" class="order-delete-action" :disabled="saving || creatingShipment || destructiveLoading" @click="openDeleteOrderDialog">
                Delete Order
              </button>
            </div>
            <div class="primary-actions">
              <button type="button" class="cancel-btn" @click="returnToOrders">{{ isReadonlyMode ? 'Back to Orders' : 'Cancel' }}</button>
              <button v-if="canEditReadonlyOrderFields" type="button" class="hold-btn" :disabled="saving" @click="handleReadonlyAdminSave">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button v-if="!isReadonlyMode" type="button" class="hold-btn" :disabled="saving || creatingShipment || !canSaveDraft" @click="handleSave('draft')">
                {{ saving ? 'Saving...' : 'Save Draft' }}
              </button>
              <button v-if="!isReadonlyMode" type="button" class="create-btn" :disabled="saving || creatingShipment || !hasOrderProducts" @click="handleSave('create')">
                {{ creatingShipment ? 'Creating...' : 'Create Order' }}
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="errorPopup" class="error-backdrop" @click.self="closeErrorPopup">
          <section class="error-modal" role="dialog" aria-modal="true" aria-labelledby="order-error-title">
            <h2 id="order-error-title">{{ errorPopup.title }}</h2>
            <pre v-if="errorPopup.details">{{ errorPopup.details }}</pre>
            <div class="error-actions">
              <button type="button" class="error-ok-btn" @click="closeErrorPopup">OK</button>
            </div>
          </section>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showHoldLogsModal" class="error-backdrop" @click.self="showHoldLogsModal = false">
          <section class="hold-logs-modal" role="dialog" aria-modal="true" aria-labelledby="hold-logs-title">
            <div class="hold-logs-header">
              <div>
                <span>Hold calling history</span>
                <h2 id="hold-logs-title">{{ currentOrderLabel }}</h2>
              </div>
              <button type="button" class="hold-logs-close" aria-label="Close hold logs" @click="showHoldLogsModal = false">×</button>
            </div>

            <div v-if="holdCallLogs.length" class="hold-logs-list">
              <article v-for="log in holdCallLogs" :key="log.id || `${log.action}-${log.created_at}`" class="hold-log-item">
                <div>
                  <strong>{{ log.label || holdLogActionLabel(log.action) }}</strong>
                  <span>{{ log.user_name || 'Unknown User' }} · {{ formatHoldLogTime(log.created_at) }}</span>
                </div>
                <p v-if="log.note">{{ log.note }}</p>
              </article>
            </div>
            <p v-else class="hold-logs-empty">No hold call logs yet.</p>
          </section>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="deleteOrderDialog" class="error-backdrop" @click.self="closeDeleteOrderDialog">
          <section class="error-modal" role="dialog" aria-modal="true" aria-labelledby="delete-order-title">
            <h2 id="delete-order-title">Delete Order?</h2>
            <p>This order will be removed from Zyro Automation. This action cannot be undone.</p>
            <pre>{{ currentOrderLabel }}</pre>
            <div class="error-actions">
              <button type="button" class="cancel-btn" :disabled="destructiveLoading" @click="closeDeleteOrderDialog">Keep Order</button>
              <button type="button" class="order-delete-action" :disabled="destructiveLoading" @click="confirmDeleteOrder">
                {{ destructiveLoading ? 'Deleting...' : 'Delete Order' }}
              </button>
            </div>
          </section>
        </div>
      </transition>
    </Teleport>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="cancelOrderDialog" class="error-backdrop" @click.self="closeCancelOrderDialog">
          <section class="error-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title">
            <h2 id="cancel-order-title">Cancel Order?</h2>
            <p>This will change the order status to cancel by shipper.</p>
            <pre>{{ currentOrderLabel }}</pre>
            <div class="error-actions">
              <button type="button" class="cancel-btn" :disabled="destructiveLoading" @click="closeCancelOrderDialog">Keep Order</button>
              <button type="button" class="order-cancel-action" :disabled="destructiveLoading" @click="confirmCancelOrder">
                {{ destructiveLoading ? 'Cancelling...' : 'Cancel Order' }}
              </button>
            </div>
          </section>
        </div>
      </transition>
    </Teleport>
  </AppLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import AbandonedOrderService from '../../services/AbandonedOrderService';
import SettingsService from '../../services/SettingsService';
import { useAuthStore } from '../../stores/authStore';
import { useBrandStore } from '../../stores/brandStore';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useOrderStore } from '../../stores/orderStore';
import { useProductStore } from '../../stores/productStore';
import phoneNormalizer, { isNormalizedPakistaniMobile } from '../../utils/phoneNormalizer';

const router = useRouter();
const route = useRoute();
const brandStore = useBrandStore();
const authStore = useAuthStore();
const integrationStore = useIntegrationStore();
const notificationStore = useNotificationStore();
const orderStore = useOrderStore();
const productStore = useProductStore();
const formRef = ref(null);
const items = ref([]);
const productSearch = ref('');
const isProductComboboxOpen = ref(false);
const citySearch = ref('');
const isCityComboboxOpen = ref(false);
const errors = reactive({});
const phoneWarnings = reactive({});
const saving = ref(false);
const creatingShipment = ref(false);
const hydratingOrder = ref(false);
const submitError = ref(null);
const errorPopup = ref(null);
const hasAdvancePayment = ref(false);
const postexPickupAddresses = ref([]);
const postexPickupLoading = ref(false);
const postexPickupError = ref('');
const postexDeliveryCities = ref([]);
const postexCityLoading = ref(false);
const postexCityError = ref('');
const leopardPickupAddresses = ref([]);
const leopardCities = ref([]);
const leopardShipmentTypes = ref([]);
const leopardCityLoading = ref(false);
const leopardCityError = ref('');
const dastaqPickupAddresses = ref([]);
const dastaqPickupLoading = ref(false);
const dastaqPickupError = ref('');
const dastaqCities = ref([]);
const dastaqCityLoading = ref(false);
const dastaqCityError = ref('');
const argoCities = ref([]);
const argoCityLoading = ref(false);
const argoCityError = ref('');
const whatsappSettings = ref(null);
const whatsappConnection = ref(null);
const addressConfirmationSending = ref(false);
const addressConfirmationStatus = ref(null);
const failedSavedOrderId = ref(null);
const loadedOrder = ref(null);
const deleteOrderDialog = ref(false);
const cancelOrderDialog = ref(false);
const showHoldLogsModal = ref(false);
const destructiveLoading = ref(false);
const addressAiLoading = ref(false);
const addressSuggestion = reactive({
  correctedAddress: '',
  clean_address: '',
  nearest_place: '',
  final_address: '',
  confidence: '',
  needs_review: false,
  review_reason: '',
  missingFields: [],
  originalAddress: '',
  updated_at: '',
});

const form = reactive({
  brand_id: '',
  source: '',
  customer_name: '',
  customer_contact: '',
  customer_contact_two: '',
  customer_address: '',
  courier_integration_id: '',
  pickup_address_code: '',
  leopard_pickup_address_id: '',
  origin_city: '',
  destination_city: '',
  destination_city_id: '',
  packet_weight: '0.2',
  shipment_type: '',
  total_price: '',
  advance_payment: '',
  cod: '',
  special_instructions: '',
  internal_notes: '',
  abandoned_order_id: '',
});

const phoneWarningMessage = "This doesn't look like a valid Pakistani mobile number (03XXXXXXXXX). It will be saved as entered.";
const phonePreview = value => {
  if (!value) return '';
  const normalized = phoneNormalizer(value);
  return isNormalizedPakistaniMobile(normalized) && normalized !== value ? normalized : '';
};
const customerContactPreview = computed(() => phonePreview(form.customer_contact));
const customerContactTwoPreview = computed(() => phonePreview(form.customer_contact_two));
const addressSuggestionMeta = computed(() => {
  const confidence = addressSuggestion.confidence ? `${addressSuggestion.confidence} confidence` : 'AI suggestion';
  if (!addressSuggestion.updated_at) return confidence;

  const date = new Date(addressSuggestion.updated_at);
  if (Number.isNaN(date.getTime())) return confidence;

  return `${confidence} - ${date.toLocaleString()}`;
});
const addressSuggestionWarning = computed(() => {
  if (addressSuggestion.needs_review && addressSuggestion.review_reason) {
    return addressSuggestion.review_reason;
  }

  const missing = Array.isArray(addressSuggestion.missingFields) ? addressSuggestion.missingFields.filter(Boolean) : [];
  if ((addressSuggestion.confidence || '').toLowerCase() !== 'low' && missing.length === 0) return '';

  return missing.length
    ? `Please double-check ${missing.join(' / ')}.`
    : 'Please double-check this address before using it.';
});
const setAddressSuggestion = (suggestion = null) => {
  addressSuggestion.correctedAddress = suggestion?.correctedAddress || '';
  addressSuggestion.clean_address = suggestion?.clean_address || '';
  addressSuggestion.nearest_place = suggestion?.nearest_place || '';
  addressSuggestion.final_address = suggestion?.final_address || suggestion?.correctedAddress || '';
  addressSuggestion.confidence = suggestion?.confidence || '';
  addressSuggestion.needs_review = Boolean(suggestion?.needs_review);
  addressSuggestion.review_reason = suggestion?.review_reason || '';
  addressSuggestion.missingFields = Array.isArray(suggestion?.missingFields) ? [...suggestion.missingFields] : [];
  addressSuggestion.originalAddress = suggestion?.originalAddress || '';
  addressSuggestion.updated_at = suggestion?.updated_at || '';
};
const handlePhoneBlur = (field, required = false) => {
  delete phoneWarnings[field];
  const raw = form[field];
  const normalized = phoneNormalizer(raw);

  if (isNormalizedPakistaniMobile(normalized)) {
    form[field] = normalized;
    delete errors[field];
    return;
  }

  if (!String(raw || '').trim()) {
    if (required) {
      errors[field] = 'Customer contact is required.';
    }
    return;
  }

  phoneWarnings[field] = phoneWarningMessage;
};

const item = reactive({
  product_id: '',
});

const showErrorPopup = (title, details = '') => {
  submitError.value = { title, details };
  errorPopup.value = { title, details };
};

const closeErrorPopup = () => {
  errorPopup.value = null;
};

const currentOrderId = computed(() => route.params.id || failedSavedOrderId.value);
const isEditMode = computed(() => Boolean(currentOrderId.value));
const isReadonlyMode = computed(() => Boolean(route.meta.readonlyOrder));
const orderListQuery = () => {
  const { abandoned_order_id, ...query } = route.query;
  return query;
};
const returnToOrders = () => router.push({ path: '/orders', query: orderListQuery() });
const canEditReadonlyOrderFields = computed(() => Boolean(isReadonlyMode.value && authStore.user?.team_role === 'owner'));
const canManageDestructiveActions = computed(() => ['admin', 'owner'].includes(authStore.user?.team_role || 'admin'));
const canUseAiAddressSuggestions = computed(() => authStore.user?.ai_address_suggestions_enabled === true);
const currentOrderLabel = computed(() => loadedOrder.value?.order_name || loadedOrder.value?.customer?.name || currentOrderId.value || 'Order');
const loadedOrderStatusText = computed(() => {
  const status = loadedOrder.value?.status;
  if (typeof status === 'string') return status;
  if (typeof status === 'number') return String(status);
  if (status && typeof status === 'object') {
    return status.name || status.label || status.title || status.status || status.message || status.text || '';
  }
  return '';
});
const showHoldLogsButton = computed(() => Boolean(
  isEditMode.value
    && loadedOrder.value
    && (loadedOrder.value.status_category === 'hold' || ['hold', 'on hold'].includes(loadedOrderStatusText.value.toLowerCase()))
));
const holdCallLogs = computed(() => Array.isArray(loadedOrder.value?.hold_call_logs) ? loadedOrder.value.hold_call_logs : []);
const holdLogActionLabel = (action) => {
  const labels = {
    call_na: 'Call Not Answered',
    number_off: 'Number Switched Off',
    fake: 'Fake Order',
    mind_change_price_issue: 'Price Issue',
    cancel_mind_change: 'Customer Changed Mind',
    non_serious: 'Non-Serious Customer',
    custom_note: 'Custom note',
  };

  return labels[action] || String(action || 'Log').replace(/_/g, ' ');
};
const formatHoldLogTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};
const canDeleteCurrentOrder = computed(() => Boolean(isEditMode.value && loadedOrder.value && canManageDestructiveActions.value));
const canCancelCurrentOrder = computed(() => {
  if (!isEditMode.value || !loadedOrder.value || !canManageDestructiveActions.value) return false;
  if (loadedOrderStatusText.value.toLowerCase() === 'cancel by shipper') return false;

  const hasTrackingNumber = String(loadedOrder.value?.tracking_number || '').trim() !== '';
  return !hasTrackingNumber || loadedOrder.value?.status_category === 'merchant_warehouse';
});
const readonlyEditableFields = ['brand_id', 'source', 'total_price', 'advance_payment'];
const readonlyLocksEntireForm = computed(() => isReadonlyMode.value && !canEditReadonlyOrderFields.value);
const readonlyLocksPartialForm = computed(() => isReadonlyMode.value && canEditReadonlyOrderFields.value);
const isReadonlyFieldDisabled = (field) => (
  isReadonlyMode.value && (!canEditReadonlyOrderFields.value || !readonlyEditableFields.includes(field))
);
const isWhatsAppConnected = computed(() => whatsappConnection.value?.connected === true);
const showAddressConfirmationInForm = computed(() => {
  const settings = whatsappSettings.value?.address_confirmation;
  return Boolean(isWhatsAppConnected.value && isEditMode.value && !isReadonlyMode.value && settings?.enabled && settings?.show_in_order_form);
});
const addressConfirmationSent = computed(() => addressConfirmationStatus.value?.status === 'sent');
const formatAddressConfirmationTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};
const addressConfirmationHelperText = computed(() => {
  if (!addressConfirmationSent.value) {
    return 'Send this address to the customer on WhatsApp for confirmation.';
  }

  const sentAt = formatAddressConfirmationTime(
    addressConfirmationStatus.value?.sent_at || addressConfirmationStatus.value?.updated_at
  );

  return sentAt ? `Message sent on ${sentAt}.` : 'Message sent.';
});
const addressConfirmationButtonText = computed(() => {
  if (addressConfirmationSending.value) return 'Sending...';
  return addressConfirmationSent.value ? 'Resend confirmation' : 'Send confirmation';
});
const pageTitle = computed(() => {
  if (isReadonlyMode.value) return 'View Order';
  return isEditMode.value ? 'Edit Order' : 'Create Order';
});
const editOrderNumber = computed(() => {
  if (!isEditMode.value || !loadedOrder.value) return '';
  return loadedOrder.value.order_name || loadedOrder.value.order_number || '';
});
const pageStatus = computed(() => {
  if (canEditReadonlyOrderFields.value) return 'Admin editable';
  if (isReadonlyMode.value) return 'Read only';
  return isEditMode.value ? 'Draft update' : 'Manual entry';
});
const isShopifyEditOrder = ref(false);
const hasOrderProducts = computed(() => items.value.length > 0);
const canSaveDraft = computed(() => hasOrderProducts.value || isShopifyEditOrder.value);
const filteredProducts = computed(() => {
  const search = productSearch.value.trim().toLowerCase();
  if (!search) return productStore.products;

  return productStore.products.filter((product) => {
    const haystack = [
      product.name,
      product.sku,
      product.id,
    ].filter(Boolean).join(' ').toLowerCase();

    return haystack.includes(search);
  });
});
const selectedBrand = computed(() => brandStore.brands.find(brand => brand.id === form.brand_id));
const brandSources = computed(() => selectedBrand.value?.sources || []);
const selectedIntegration = computed(() => integrationStore.integrations.find((integration) => String(integration.id) === String(form.courier_integration_id)));
const hasCourierSelected = computed(() => Boolean(form.courier_integration_id));
const isPostexSelected = computed(() => selectedIntegration.value?.courier_slug === 'postex');
const isLeopardSelected = computed(() => selectedIntegration.value?.courier_slug === 'leopard');
const isDastaqSelected = computed(() => selectedIntegration.value?.courier_slug === 'dastaq');
const isArgoSelected = computed(() => selectedIntegration.value?.courier_slug === 'argo');
const isGramWeightSelected = computed(() => isLeopardSelected.value || isDastaqSelected.value);
const courierCodAmount = computed(() => {
  const total = Number(form.total_price || 0);
  const advance = hasAdvancePayment.value ? Number(form.advance_payment || 0) : 0;
  return Math.max(total - advance, 0);
});
const destinationCitySelection = computed({
  get() {
    return isLeopardSelected.value ? form.destination_city_id : form.destination_city;
  },
  set(value) {
    if (isLeopardSelected.value) {
      const city = leopardCities.value.find((item) => String(item.id) === String(value));
      form.destination_city_id = value ? Number(value) : '';
      form.destination_city = city?.name || '';
      if (city?.shipment_type?.length && !city.shipment_type.includes(form.shipment_type)) {
        form.shipment_type = city.shipment_type[0];
      }
    } else {
      form.destination_city = value;
      form.destination_city_id = '';
    }
  },
});
const destinationCityOptions = computed(() => {
  if (isPostexSelected.value) {
    return postexDeliveryCities.value.map((city) => ({
      value: city.operationalCityName,
      label: city.countryName ? `${city.operationalCityName} - ${city.countryName}` : city.operationalCityName,
    }));
  }

  if (isLeopardSelected.value) {
    return leopardCities.value.map((city) => ({
      value: city.id,
      label: city.name,
    }));
  }

  if (isDastaqSelected.value) {
    return dastaqCities.value.map((city) => ({
      value: city,
      label: city,
    }));
  }

  if (isArgoSelected.value) {
    return argoCities.value.map((city) => ({
      value: city.code || city.name || city,
      label: city.code ? `${city.name} - ${city.code}` : city.name || city,
    }));
  }

  return ['Lahore', 'Karachi', 'Islamabad'].map((city) => ({
    value: city,
    label: city,
  }));
});
const selectedDestinationCityLabel = computed(() => {
  const selectedValue = String(destinationCitySelection.value || '');
  if (!selectedValue) return '';

  const selectedOption = destinationCityOptions.value.find((city) => String(city.value) === selectedValue);
  return selectedOption?.label || form.destination_city || selectedValue;
});
const normalizeCityForAddress = (city) => String(city || '')
  .replace(/\s+-\s*Pakistan$/i, '')
  .trim();
const mergeAddressWithCity = (address, city) => {
  const cleanAddress = String(address || '').trim();
  const cleanCity = normalizeCityForAddress(city);
  if (!cleanAddress || !cleanCity) return cleanAddress;

  const escapedCity = cleanCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cityPattern = new RegExp(`(^|[\\s,.-])${escapedCity}([\\s,.-]|$)`, 'i');
  return cityPattern.test(cleanAddress) ? cleanAddress : `${cleanAddress}, ${cleanCity}`;
};
const filteredDestinationCityOptions = computed(() => {
  const search = citySearch.value.trim().toLowerCase();
  if (!search) return destinationCityOptions.value;

  return destinationCityOptions.value.filter((city) => {
    return [city.label, city.value].filter(Boolean).join(' ').toLowerCase().includes(search);
  });
});
const citySelectDisabled = computed(() => (
  (isPostexSelected.value && postexCityLoading.value)
    || (isLeopardSelected.value && leopardCityLoading.value)
    || (isDastaqSelected.value && dastaqCityLoading.value)
    || (isArgoSelected.value && argoCityLoading.value)
));
const citySelectPlaceholder = computed(() => {
  if (postexCityLoading.value || leopardCityLoading.value || dastaqCityLoading.value || argoCityLoading.value) return 'Fetching cities...';
  return 'Search Destination City';
});
const shipmentTypeOptions = computed(() => {
  if (isLeopardSelected.value) {
    const city = leopardCities.value.find((item) => String(item.id) === String(form.destination_city_id));
    return city?.shipment_type?.length ? city.shipment_type : leopardShipmentTypes.value;
  }

  if (isDastaqSelected.value) {
    return ['cod', 'non-cod'];
  }

  return ['Overnight', 'Same Day', 'Detain'];
});

const defaultShipmentTypeForSelectedCourier = () => {
  if (isPostexSelected.value) return 'Overnight';
  if (isLeopardSelected.value) return 'Overnight';
  if (isDastaqSelected.value) return 'cod';
  return '';
};

const selectedBrandDefaultShipper = () => {
  if (!selectedBrand.value || !form.courier_integration_id) return null;
  const defaultShippers = selectedBrand.value.default_shippers || {};
  const integrationDefault = defaultShippers[String(form.courier_integration_id)];
  if (integrationDefault) return integrationDefault;

  return Object.values(defaultShippers)
    .find(defaultShipper => defaultShipper?.courier_slug === selectedIntegration.value?.courier_slug) || null;
};

const applyBrandDefaultShipper = () => {
  const defaultShipper = selectedBrandDefaultShipper();
  if (!defaultShipper || defaultShipper.courier_slug !== selectedIntegration.value?.courier_slug) return;

  if (isLeopardSelected.value && defaultShipper.leopard_pickup_address_id) {
    form.leopard_pickup_address_id = defaultShipper.leopard_pickup_address_id;
    delete errors.leopard_pickup_address_id;
    return;
  }

  if ((isPostexSelected.value || isDastaqSelected.value) && defaultShipper.pickup_address_code) {
    form.pickup_address_code = defaultShipper.pickup_address_code;
    delete errors.pickup_address_code;
  }
};

watch(selectedDestinationCityLabel, (label) => {
  if (!isCityComboboxOpen.value) {
    citySearch.value = label;
  }
});

watch(() => form.brand_id, () => {
  if (hydratingOrder.value) return;

  form.source = '';
  form.courier_integration_id = '';
  form.pickup_address_code = '';
  form.leopard_pickup_address_id = '';
  form.origin_city = '';
  form.destination_city = '';
  form.destination_city_id = '';
  citySearch.value = '';
  isCityComboboxOpen.value = false;
  delete errors.brand_id;
  delete errors.source;
  delete errors.courier_integration_id;
  delete errors.pickup_address_code;
  delete errors.leopard_pickup_address_id;
  delete errors.origin_city;
  delete errors.destination_city;
});

watch(() => form.source, () => {
  delete errors.source;
});

const resetCourierDependentFields = () => {
  form.pickup_address_code = '';
  form.leopard_pickup_address_id = '';
  form.origin_city = '';
  form.destination_city = '';
  form.destination_city_id = '';
  citySearch.value = '';
  isCityComboboxOpen.value = false;
  postexPickupAddresses.value = [];
  postexPickupError.value = '';
  postexDeliveryCities.value = [];
  postexCityError.value = '';
  leopardCityError.value = '';
  dastaqPickupAddresses.value = [];
  dastaqPickupError.value = '';
  dastaqCities.value = [];
  dastaqCityError.value = '';
  argoCities.value = [];
  argoCityError.value = '';
  delete errors.courier_integration_id;
  delete errors.pickup_address_code;
  delete errors.leopard_pickup_address_id;
  delete errors.origin_city;
  delete errors.destination_city;
};

const loadPostexRuntimeData = async () => {
  if (isPostexSelected.value) {
    await Promise.all([
      fetchPostexPickupAddresses(),
      fetchPostexDeliveryCities(),
    ]);
  } else if (isLeopardSelected.value) {
    await loadLeopardRuntimeData();
  } else if (isDastaqSelected.value) {
    await loadDastaqRuntimeData();
  } else if (isArgoSelected.value) {
    await loadArgoRuntimeData();
  }
};

const handleCourierChange = async () => {
  resetCourierDependentFields();
  form.packet_weight = isGramWeightSelected.value ? '500' : '0.2';
  form.shipment_type = defaultShipmentTypeForSelectedCourier();
  applyBrandDefaultShipper();
  await loadPostexRuntimeData();
  applyBrandDefaultShipper();
};

watch(() => form.pickup_address_code, () => {
  delete errors.pickup_address_code;
});

watch(() => form.leopard_pickup_address_id, () => {
  delete errors.leopard_pickup_address_id;
});

[
  'customer_name',
  'customer_contact',
  'customer_address',
  'courier_integration_id',
  'destination_city',
  'packet_weight',
  'shipment_type',
  'total_price',
  'advance_payment',
  'cod',
  'special_instructions',
  'internal_notes',
].forEach((key) => {
  watch(() => form[key], () => {
    delete errors[key];
  });
});

watch([() => form.total_price, () => form.advance_payment, hasAdvancePayment], () => {
  form.cod = String(courierCodAmount.value);
  delete errors.cod;
  delete errors.total_price;
  delete errors.advance_payment;
});

watch(hasAdvancePayment, (enabled) => {
  if (!enabled) {
    form.advance_payment = '';
  }
});

onMounted(async () => {
  await Promise.all([
    brandStore.fetchBrands(),
    integrationStore.fetchIntegrations(),
    productStore.fetchProducts(),
    loadWhatsAppSettings(),
  ]);

  if (isEditMode.value) {
    try {
      await loadOrderForEdit(currentOrderId.value);
    } catch (error) {
      const message = error.response?.status === 404
        ? 'This order no longer exists or you do not have access to it.'
        : apiErrorMessage(error, 'Unable to load order for editing.');
      showErrorPopup(message);
      returnToOrders();
    }
  } else if (route.query.abandoned_order_id) {
    try {
      await loadAbandonedOrderForCreate(route.query.abandoned_order_id);
    } catch (error) {
      showErrorPopup(apiErrorMessage(error, 'Unable to load abandoned order for manual entry.'));
    }
  }
});

const loadAbandonedOrderForCreate = async (id) => {
  const res = await AbandonedOrderService.getOrder(id);
  const order = res.data.data.order;
  const customer = order.customer || {};
  const address = order.addresses?.primary || order.addresses?.shipping || order.addresses?.customer_default || order.addresses?.billing || {};
  const productLines = (order.line_items || [])
    .map(line => `${line.title || line.name || 'Item'} x${line.quantity || 1}`)
    .join('\n');

  hydratingOrder.value = true;
  form.abandoned_order_id = order.id || String(id);
  form.brand_id = order.brand_id || '';
  form.source = sourceForAbandonedOrder();
  form.customer_name = customer.name || '';
  form.customer_contact = customer.phone_normalized || customer.phone || '';
  form.customer_contact_two = '';
  form.customer_address = address.formatted || primaryAddressFromAbandoned(order) || '';
  setAddressSuggestion(null);
  form.destination_city = address.city || '';
  form.destination_city_id = '';
  form.total_price = String(order.total_price || '');
  form.advance_payment = '';
  form.cod = String(order.total_price || '');
  hasAdvancePayment.value = false;
  form.special_instructions = '';
  form.internal_notes = productLines;
  items.value = [];
  productSearch.value = '';

  await nextTick();
  hydratingOrder.value = false;
};

const sourceForAbandonedOrder = () => {
  const sources = brandSources.value || [];
  return sources.includes('Abandoned') ? 'Abandoned' : (sources[0] || '');
};

const primaryAddressFromAbandoned = (order) => order.addresses?.primary?.formatted
  || order.addresses?.shipping?.formatted
  || order.addresses?.customer_default?.formatted
  || order.addresses?.billing?.formatted
  || '';

const loadOrderForEdit = async (id) => {
  const order = await orderStore.fetchOrder(id);
  orderStore.closePanel();
  loadedOrder.value = order;
  const manual = order.manual_order || {};
  isShopifyEditOrder.value = Boolean(order.shopify_order_id);

  hydratingOrder.value = true;
  form.brand_id = order.brand_id || '';
  form.source = order.source || '';
  form.customer_name = order.customer?.name || '';
  form.customer_contact = order.customer?.phone_local || order.customer?.phone_intl || '';
  form.customer_contact_two = manual.customer_contact_two || order.customer?.phone_two || '';
  const savedDestinationCity = manual.destination_city || order.customer?.city || '';
  form.customer_address = mergeAddressWithCity(order.customer?.address || '', savedDestinationCity);
  setAddressSuggestion(order.ai_address_correction || null);
  form.courier_integration_id = manual.courier_integration_id || order.courier_integration_id || '';
  form.pickup_address_code = manual.pickup_address_code || '';
  form.leopard_pickup_address_id = manual.leopard_pickup_address_id || '';
  form.origin_city = manual.origin_city || '';
  form.destination_city = savedDestinationCity;
  form.destination_city_id = manual.destination_city_id || '';
  form.packet_weight = manual.packet_weight ?? '0.2';
  form.shipment_type = manual.shipment_type || '';
  form.total_price = order.total_price ?? manual.cod ?? '';
  form.cod = order.cod ?? manual.cod ?? order.total_outstanding ?? order.total_price ?? '';
  form.advance_payment = order.advance_payment ?? manual.advance_payment ?? (Math.max(Number(form.total_price || 0) - Number(form.cod || 0), 0) || '');
  hasAdvancePayment.value = Number(form.advance_payment || 0) > 0;
  form.special_instructions = manual.special_instructions || (order.shopify_order_id ? shopifyInstructions(order.line_items || []) : '');
  form.internal_notes = manual.internal_notes || '';
  addressConfirmationStatus.value = order.whatsapp_address_confirmation || null;

  await nextTick();
  hydratingOrder.value = false;

  const productIds = new Set(productStore.products.map(product => String(product.id)));
  items.value = (order.line_items || [])
    .filter(line => productIds.has(String(line.product_id || line.id || '')))
    .map(line => ({
      product_id: line.product_id || line.id,
      name: line.title || line.name,
      picture_url: line.picture_url,
      sale_price: line.price,
      quantity: line.quantity || 1,
    }));

  const savedCourierSlug = manual.courier_slug || selectedIntegration.value?.courier_slug;
  if (savedCourierSlug === 'postex') {
    if (!form.shipment_type) {
      form.shipment_type = 'Overnight';
    }
    await loadPostexRuntimeData();
  } else if (savedCourierSlug === 'leopard') {
    if (!form.shipment_type) {
      form.shipment_type = 'Overnight';
    }
    await loadLeopardRuntimeData();
  } else if (savedCourierSlug === 'dastaq') {
    await loadDastaqRuntimeData();
    if (!['cod', 'non-cod'].includes(form.shipment_type)) {
      form.shipment_type = Number(form.cod || 0) > 0 ? 'cod' : 'non-cod';
    }
  } else if (savedCourierSlug === 'argo') {
    await loadArgoRuntimeData();
    form.packet_weight = manual.packet_weight ?? '0.2';
  }
};

const openDeleteOrderDialog = () => {
  deleteOrderDialog.value = true;
};

const closeDeleteOrderDialog = () => {
  if (destructiveLoading.value) return;
  deleteOrderDialog.value = false;
};

const openCancelOrderDialog = () => {
  cancelOrderDialog.value = true;
};

const closeCancelOrderDialog = () => {
  if (destructiveLoading.value) return;
  cancelOrderDialog.value = false;
};

const confirmDeleteOrder = async () => {
  if (!currentOrderId.value) return;

  destructiveLoading.value = true;
  try {
    await orderStore.deleteOrder(currentOrderId.value);
    notificationStore.show('Order deleted.');
    deleteOrderDialog.value = false;
    returnToOrders();
  } catch (error) {
    notificationStore.show(error.response?.data?.message || 'Failed to delete order.', { type: 'error' });
  } finally {
    destructiveLoading.value = false;
  }
};

const confirmCancelOrder = async () => {
  if (!currentOrderId.value) return;

  destructiveLoading.value = true;
  try {
    await orderStore.cancelByShipper(currentOrderId.value);
    notificationStore.show('Order cancelled by shipper.');
    cancelOrderDialog.value = false;
    returnToOrders();
  } catch (error) {
    notificationStore.show(error.response?.data?.message || 'Failed to cancel order.', { type: 'error' });
  } finally {
    destructiveLoading.value = false;
  }
};

const addItem = () => {
  const product = productStore.products.find((candidate) => candidate.id === item.product_id);
  if (!product) return;

  const existing = items.value.find((row) => row.product_id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.value.push({
      product_id: product.id,
      name: product.name,
      picture_url: product.picture_url,
      sale_price: product.sale_price,
      quantity: 1,
    });
  }

  item.product_id = '';
  productSearch.value = '';
  isProductComboboxOpen.value = false;
  delete errors.items;
};

const removeItem = (productId) => {
  items.value = items.value.filter((row) => row.product_id !== productId);
};

const openProductCombobox = () => {
  isProductComboboxOpen.value = true;
};

const closeProductCombobox = () => {
  setTimeout(() => {
    isProductComboboxOpen.value = false;
  }, 120);
};

const handleProductSearch = () => {
  item.product_id = '';
  isProductComboboxOpen.value = true;
  delete errors.items;
};

const selectProduct = (product) => {
  item.product_id = product.id;
  productSearch.value = product.name;
  isProductComboboxOpen.value = false;
  delete errors.items;
};

const selectFirstFilteredProduct = () => {
  if (filteredProducts.value.length) {
    selectProduct(filteredProducts.value[0]);
  }
};

const openCityCombobox = () => {
  if (citySelectDisabled.value) return;
  citySearch.value = selectedDestinationCityLabel.value;
  isCityComboboxOpen.value = true;
  ensureDestinationCities();
};

const closeCityCombobox = () => {
  setTimeout(() => {
    isCityComboboxOpen.value = false;
    citySearch.value = selectedDestinationCityLabel.value;
  }, 120);
};

const handleCitySearch = () => {
  isCityComboboxOpen.value = true;
  ensureDestinationCities();
  delete errors.destination_city;

  if (citySearch.value !== selectedDestinationCityLabel.value) {
    destinationCitySelection.value = '';
  }
};

const selectDestinationCity = (city) => {
  destinationCitySelection.value = city.value;
  citySearch.value = city.label;
  isCityComboboxOpen.value = false;
  delete errors.destination_city;
};

const selectFirstFilteredCity = () => {
  if (filteredDestinationCityOptions.value.length) {
    selectDestinationCity(filteredDestinationCityOptions.value[0]);
  }
};

const incrementItemQuantity = (row) => {
  row.quantity = Number(row.quantity || 1) + 1;
};

const decrementItemQuantity = (row) => {
  row.quantity = Math.max(Number(row.quantity || 1) - 1, 1);
};

const productInstructionText = () => items.value.map(row => `${row.quantity || 1} X ${row.name}`).join(' , ');

const addItemsToSpecialInstructions = () => {
  const text = productInstructionText();
  if (!text) return;

  form.special_instructions = text;
  delete errors.special_instructions;
  notificationStore.show('Product details added to special instructions.');
};

const loadWhatsAppSettings = async () => {
  try {
    const res = await SettingsService.fetchWhatsAppAutomation();
    whatsappSettings.value = res.data.data.settings || null;
    whatsappConnection.value = res.data.data.connection || null;
  } catch (error) {
    whatsappSettings.value = null;
    whatsappConnection.value = null;
  }
};

const sendAddressConfirmation = async () => {
  if (!currentOrderId.value) return;

  addressConfirmationSending.value = true;
  const wasSent = addressConfirmationSent.value;
  try {
    const response = await orderStore.sendAddressConfirmation(currentOrderId.value);
    addressConfirmationStatus.value = response?.data?.address_confirmation || {
      status: 'sent',
      sent_at: new Date().toISOString(),
    };
    notificationStore.show(wasSent ? 'Address confirmation resent.' : 'Address confirmation sent.');
  } catch (error) {
    notificationStore.show(error.response?.data?.message || 'Unable to send address confirmation.', { type: 'error' });
  } finally {
    addressConfirmationSending.value = false;
  }
};

const improveAddressWithAi = async () => {
  const rawAddress = mergeAddressWithCity(form.customer_address, form.destination_city);
  if (!rawAddress) {
    errors.customer_address = 'Customer address is required.';
    return;
  }

  form.customer_address = rawAddress;
  addressAiLoading.value = true;
  try {
    const suggestion = await orderStore.correctAddress(rawAddress);

    setAddressSuggestion({
      ...suggestion,
      updated_at: new Date().toISOString(),
    });
    notificationStore.show('AI address suggestion is ready.');
  } catch (error) {
    notificationStore.show(error.response?.data?.message || 'Unable to improve address. Please retry.', { type: 'error' });
  } finally {
    addressAiLoading.value = false;
  }
};

const copyAddressSuggestion = async () => {
  if (!addressSuggestion.correctedAddress) return;

  try {
    await navigator.clipboard.writeText(addressSuggestion.correctedAddress);
    notificationStore.show('Suggested address copied.');
  } catch (error) {
    notificationStore.show('Unable to copy address from this browser.', { type: 'error' });
  }
};

const replaceAddressWithSuggestion = () => {
  if (!addressSuggestion.correctedAddress) return;

  form.customer_address = addressSuggestion.correctedAddress;
  delete errors.customer_address;
  notificationStore.show('Original address replaced with suggestion.');
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

const leopardPickupAddressName = (address) => {
  return [
    address.shipment_name_eng || 'Pickup Address',
    address.origin_city_name,
    address.shipment_phone,
  ].filter(Boolean).join(' - ');
};

const dastaqPickupAddressName = (address) => {
  return [
    address.name || address.address || 'Pickup Address',
    address.city,
    address.phone,
    address.id,
  ].filter(Boolean).join(' - ');
};

const loadLeopardRuntimeData = async () => {
  await Promise.all([
    fetchLeopardCities(),
    fetchLeopardPickupAddresses(),
  ]);
};

const fetchLeopardCities = async () => {
  if (leopardCities.value.length) return;

  leopardCityLoading.value = true;
  leopardCityError.value = '';

  try {
    const data = await integrationStore.fetchLeopardCities();
    leopardCities.value = data.cities;
    leopardShipmentTypes.value = data.shipment_types;
  } catch (error) {
    leopardCityError.value = apiErrorMessage(error, 'Unable to load Leopard cities.');
    errors.destination_city = leopardCityError.value;
  } finally {
    leopardCityLoading.value = false;
  }
};

const fetchLeopardPickupAddresses = async () => {
  try {
    leopardPickupAddresses.value = await integrationStore.fetchLeopardPickupAddresses();
    if (leopardPickupAddresses.value.length === 0) {
      errors.leopard_pickup_address_id = 'Add a Leopard pickup address in Settings first.';
    }
  } catch (error) {
    errors.leopard_pickup_address_id = apiErrorMessage(error, 'Unable to load Leopard pickup addresses.');
  }
};

const getDastaqCredentials = () => ({
  api_key: selectedIntegration.value?.courier_options?.api_key,
  api_secret: selectedIntegration.value?.courier_options?.api_secret,
});

const getArgoCredentials = () => ({
  api_key: selectedIntegration.value?.courier_options?.api_key,
  api_secret: selectedIntegration.value?.courier_options?.api_secret,
});

const loadDastaqRuntimeData = async () => {
  await Promise.all([
    fetchDastaqPickupAddresses(),
    fetchDastaqCities(),
  ]);
};

const fetchDastaqPickupAddresses = async () => {
  const credentials = getDastaqCredentials();

  if (!credentials.api_key || !credentials.api_secret) {
    dastaqPickupError.value = 'Dastaq credentials are missing. Update the Dastaq integration first.';
    errors.pickup_address_code = dastaqPickupError.value;
    return;
  }

  dastaqPickupLoading.value = true;
  dastaqPickupError.value = '';

  try {
    dastaqPickupAddresses.value = await integrationStore.fetchDastaqPickupAddresses(credentials);
    if (dastaqPickupAddresses.value.length === 0) {
      dastaqPickupError.value = 'No pickup addresses found for this Dastaq account.';
      errors.pickup_address_code = dastaqPickupError.value;
    }
  } catch (error) {
    dastaqPickupError.value = apiErrorMessage(error, 'Unable to fetch Dastaq pickup addresses.');
    errors.pickup_address_code = dastaqPickupError.value;
  } finally {
    dastaqPickupLoading.value = false;
  }
};

const fetchDastaqCities = async () => {
  const credentials = getDastaqCredentials();

  if (!credentials.api_key || !credentials.api_secret) {
    dastaqCityError.value = 'Dastaq credentials are missing. Update the Dastaq integration first.';
    errors.destination_city = dastaqCityError.value;
    return;
  }

  dastaqCityLoading.value = true;
  dastaqCityError.value = '';

  try {
    dastaqCities.value = await integrationStore.fetchDastaqAllowedCities(credentials);
    if (dastaqCities.value.length === 0) {
      dastaqCityError.value = 'No destination cities found for this Dastaq account.';
      errors.destination_city = dastaqCityError.value;
    }
  } catch (error) {
    dastaqCityError.value = apiErrorMessage(error, 'Unable to fetch Dastaq allowed cities.');
    errors.destination_city = dastaqCityError.value;
  } finally {
    dastaqCityLoading.value = false;
  }
};

const ensureDastaqPickupAddresses = () => {
  if (!isDastaqSelected.value || dastaqPickupLoading.value || dastaqPickupAddresses.value.length > 0) return;
  fetchDastaqPickupAddresses();
};

const loadArgoRuntimeData = async () => {
  await fetchArgoCities();
};

const fetchArgoCities = async () => {
  const credentials = getArgoCredentials();

  if (!credentials.api_key || !credentials.api_secret) {
    argoCityError.value = 'Argo credentials are missing. Update the Argo integration first.';
    errors.destination_city = argoCityError.value;
    return;
  }

  argoCityLoading.value = true;
  argoCityError.value = '';

  try {
    argoCities.value = await integrationStore.fetchArgoCities(credentials);
    if (argoCities.value.length === 0) {
      argoCityError.value = 'No destination cities found for this Argo account.';
      errors.destination_city = argoCityError.value;
    }
  } catch (error) {
    argoCityError.value = apiErrorMessage(error, 'Unable to fetch Argo cities.');
    errors.destination_city = argoCityError.value;
  } finally {
    argoCityLoading.value = false;
  }
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
    postexPickupAddresses.value = await integrationStore.fetchPostexPickupAddresses(token);
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
    postexDeliveryCities.value = await integrationStore.fetchPostexOperationalCities(token, 'delivery');
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

const ensureDestinationCities = () => {
  if (isPostexSelected.value) {
    ensurePostexDeliveryCities();
  } else if (isDastaqSelected.value && !dastaqCityLoading.value && dastaqCities.value.length === 0) {
    fetchDastaqCities();
  } else if (isArgoSelected.value && !argoCityLoading.value && argoCities.value.length === 0) {
    fetchArgoCities();
  }
};

const apiErrorMessage = (error, fallback) => {
  const serverMessage = error.response?.data?.message || error.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (error.response?.status) return `${fallback} Server returned HTTP ${error.response.status}.`;
  if (error.request) return `${fallback} No response from API server.`;
  return fallback;
};

const formatApiErrorDetails = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.map(formatApiErrorDetails).filter(Boolean).join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, detail]) => {
        const formatted = formatApiErrorDetails(detail);
        return formatted ? `${key}: ${formatted}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return String(value);
};

const scrollToFirstValidationError = async () => {
  await nextTick();
  const firstInvalid = formRef.value?.querySelector('.invalid, .items-error');

  if (!firstInvalid) {
    return;
  }

  firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const focusTarget = firstInvalid.matches('input, select, textarea, button')
    ? firstInvalid
    : firstInvalid.querySelector('input, select, textarea, button');

  focusTarget?.focus?.({ preventScroll: true });
};

const buildPayload = () => {
  const customerAddress = mergeAddressWithCity(form.customer_address, form.destination_city);

  return {
    ...form,
    customer_address: customerAddress,
    customer_contact: phoneNormalizer(form.customer_contact),
    customer_contact_two: phoneNormalizer(form.customer_contact_two),
    total_price: Number(form.total_price || 0),
    advance_payment: hasAdvancePayment.value ? Number(form.advance_payment || 0) : 0,
    cod: courierCodAmount.value,
    line_items: items.value.map((row) => ({
      product_id: row.product_id,
      quantity: Number(row.quantity || 1),
    })),
    ai_address_correction: canUseAiAddressSuggestions.value && addressSuggestion.correctedAddress
      ? {
          correctedAddress: addressSuggestion.correctedAddress,
          clean_address: addressSuggestion.clean_address,
          nearest_place: addressSuggestion.nearest_place || null,
          final_address: addressSuggestion.final_address || addressSuggestion.correctedAddress,
          confidence: addressSuggestion.confidence || 'low',
          needs_review: addressSuggestion.needs_review,
          review_reason: addressSuggestion.review_reason || '',
          missingFields: addressSuggestion.missingFields || [],
          originalAddress: addressSuggestion.originalAddress || customerAddress,
          updated_at: addressSuggestion.updated_at || new Date().toISOString(),
        }
      : null,
  };
};

const validateReadonlyAdminFields = async () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  submitError.value = null;
  errorPopup.value = null;

  if (!form.brand_id) {
    errors.brand_id = 'Brand is required.';
  }

  if (!form.source) {
    errors.source = 'Source is required.';
  }

  const totalAmount = Number(form.total_price || 0);
  const advanceAmount = hasAdvancePayment.value ? Number(form.advance_payment || 0) : 0;

  if (Number.isNaN(totalAmount) || totalAmount < 0) {
    errors.total_price = 'Total amount must be zero or greater.';
  }

  if (hasAdvancePayment.value && (Number.isNaN(advanceAmount) || advanceAmount < 0)) {
    errors.advance_payment = 'Advance payment must be zero or greater.';
  } else if (hasAdvancePayment.value && advanceAmount > totalAmount) {
    errors.advance_payment = 'Advance payment cannot be greater than total amount.';
  }

  if (Object.keys(errors).length) {
    await scrollToFirstValidationError();
    return false;
  }

  return true;
};

const handleReadonlyAdminSave = async () => {
  if (!canEditReadonlyOrderFields.value || !currentOrderId.value) return;

  const isValid = await validateReadonlyAdminFields();
  if (!isValid) return;

  saving.value = true;
  try {
    const result = await orderStore.updateDraft(currentOrderId.value, buildPayload());
    const updatedOrder = result.order || result;
    notificationStore.show('Order values updated.');

    if (updatedOrder?.id) {
      await loadOrderForEdit(updatedOrder.id);
    }
  } catch (error) {
    const message = error.response?.data?.message || apiErrorMessage(error, 'Unable to update order values.');
    const errorDetails = formatApiErrorDetails(error.response?.data?.errors);
    showErrorPopup(message, errorDetails);
  } finally {
    saving.value = false;
  }
};

const handleFormSubmit = () => {
  if (canEditReadonlyOrderFields.value) {
    handleReadonlyAdminSave();
    return;
  }

  handleSave();
};

const handleSave = async (mode) => {
  if (isReadonlyMode.value) return;
  const isCreateMode = mode === 'create';

  Object.keys(errors).forEach(key => delete errors[key]);
  Object.keys(phoneWarnings).forEach(key => delete phoneWarnings[key]);
  submitError.value = null;
  errorPopup.value = null;
  handlePhoneBlur('customer_contact', true);
  handlePhoneBlur('customer_contact_two');

  if (!form.brand_id) {
    errors.brand_id = 'Brand is required.';
  }

  if (!form.source) {
    errors.source = 'Source is required.';
  }

  const requiredFields = {
    customer_contact: 'Customer contact is required.',
    customer_address: 'Customer address is required.',
    total_price: 'Total amount is required.',
  };

  if (isCreateMode) {
    requiredFields.customer_name = 'Customer name is required for label generation.';
    requiredFields.courier_integration_id = 'Courier is required.';
    requiredFields.special_instructions = 'Special instructions are required.';
  }

  if (isCreateMode || hasCourierSelected.value) {
    requiredFields.destination_city = 'Destination city is required.';
    requiredFields.packet_weight = 'Packet weight is required.';
  }

  if ((isCreateMode || hasCourierSelected.value) && !isArgoSelected.value) {
    requiredFields.shipment_type = 'Shipment type is required.';
  }

  Object.entries(requiredFields).forEach(([key, message]) => {
    if (form[key] === null || form[key] === undefined || String(form[key]).trim() === '') {
      errors[key] = message;
    }
  });

  const totalAmount = Number(form.total_price || 0);
  const advanceAmount = hasAdvancePayment.value ? Number(form.advance_payment || 0) : 0;
  if (Number.isNaN(totalAmount) || totalAmount < 0) {
    errors.total_price = 'Total amount must be zero or greater.';
  }
  if (hasAdvancePayment.value && (Number.isNaN(advanceAmount) || advanceAmount < 0)) {
    errors.advance_payment = 'Advance payment must be zero or greater.';
  } else if (hasAdvancePayment.value && advanceAmount > totalAmount) {
    errors.advance_payment = 'Advance payment cannot be greater than total amount.';
  }

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
  } else if (isLeopardSelected.value) {
    if (!form.leopard_pickup_address_id) {
      errors.leopard_pickup_address_id = 'Pickup address is required.';
    }

    const leopardWeight = Number(form.packet_weight);
    if (!Number.isInteger(leopardWeight) || leopardWeight <= 0) {
      errors.packet_weight = 'Weight must be a whole number of grams.';
    }

    if (leopardCityLoading.value) {
      errors.destination_city = 'Leopard cities are still loading.';
    } else if (leopardCityError.value) {
      errors.destination_city = leopardCityError.value;
    } else if (!form.destination_city_id) {
      errors.destination_city = 'Destination city is required.';
    }
  } else if (isDastaqSelected.value) {
    if (dastaqPickupLoading.value) {
      errors.pickup_address_code = 'Pickup addresses are still loading.';
    } else if (dastaqPickupError.value) {
      errors.pickup_address_code = dastaqPickupError.value;
    } else if (!form.pickup_address_code) {
      errors.pickup_address_code = 'Pickup address is required.';
    }

    const dastaqWeight = Number(form.packet_weight);
    if (!Number.isInteger(dastaqWeight) || dastaqWeight <= 0) {
      errors.packet_weight = 'Weight must be a whole number of grams.';
    }

    if (!['cod', 'non-cod'].includes(form.shipment_type)) {
      errors.shipment_type = 'Shipment type must be cod or non-cod.';
    }

    if (dastaqCityLoading.value) {
      errors.destination_city = 'Dastaq cities are still loading.';
    } else if (dastaqCityError.value) {
      errors.destination_city = dastaqCityError.value;
    } else if (!form.destination_city) {
      errors.destination_city = 'Destination city is required.';
    }
  } else if (isArgoSelected.value) {
    const argoWeight = Number(form.packet_weight);
    if (Number.isNaN(argoWeight) || argoWeight <= 0) {
      errors.packet_weight = 'Weight must be greater than zero.';
    }

    if (argoCityLoading.value) {
      errors.destination_city = 'Argo cities are still loading.';
    } else if (argoCityError.value) {
      errors.destination_city = argoCityError.value;
    } else if (!form.destination_city) {
      errors.destination_city = 'Destination city is required.';
    }
  } else if (hasCourierSelected.value && !form.origin_city) {
    errors.origin_city = 'Origin city is required.';
  }

  if (isCreateMode && !hasOrderProducts.value) {
    errors.items = 'At least one order item is required for booking.';
  } else if (!isCreateMode && !canSaveDraft.value) {
    errors.items = 'At least one order item is required.';
  }

  if (Object.keys(errors).length) {
    await scrollToFirstValidationError();
    return;
  }

  saving.value = true;
  try {
    const supportsShipmentBooking = isPostexSelected.value || isLeopardSelected.value || isDastaqSelected.value || isArgoSelected.value;
    const shouldBookShipment = mode === 'create' && supportsShipmentBooking;
    const payload = buildPayload();

    if (shouldBookShipment) {
      creatingShipment.value = true;
    }

    let result;
    if (isEditMode.value && shouldBookShipment) {
      result = await orderStore.updateBooking(currentOrderId.value, payload);
    } else if (isEditMode.value) {
      result = await orderStore.updateDraft(currentOrderId.value, payload);
    } else if (shouldBookShipment) {
      result = await orderStore.createBooking(payload);
    } else {
      result = await orderStore.saveDraft(payload);
    }

    if (mode === 'create') {
      if (!supportsShipmentBooking) {
        showErrorPopup('Shipment booking is only available for PostEx, Leopard, Dastaq, and Argo right now.');
        return;
      }

      const order = result.order || result;
      const tracking = result.tracking_number || order.tracking_number || 'created';
      notificationStore.show(`Order has been created. Tracking: ${tracking}`);
      returnToOrders();
      return;
    }

    notificationStore.show(isEditMode.value ? 'Order draft has been updated.' : 'Order has been saved as draft.');
    returnToOrders();
  } catch (error) {
    const responseErrors = error.response?.data?.errors;
    const fallback = mode === 'create' && creatingShipment.value
      ? 'Order was saved, but shipment booking failed.'
      : 'Unable to save order.';
    const networkMessage = !error.response && error.message
      ? `${fallback} (${error.message})`
      : fallback;
    const message = error.response?.data?.message || networkMessage;
    const courierDetails = formatApiErrorDetails(
      error.response?.data?.postex_response ||
      error.response?.data?.leopard_response ||
      error.response?.data?.argo_response ||
      error.response?.data?.dastaq_response
    );
    const errorDetails = formatApiErrorDetails(error.response?.data?.errors);

    if (responseErrors && typeof responseErrors === 'object' && !Array.isArray(responseErrors)) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(responseErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      ));
      await scrollToFirstValidationError();
    }

    const savedOrderId = error.response?.data?.order_saved
      ? error.response?.data?.data?.order?.id
      : null;

    if (savedOrderId) {
      failedSavedOrderId.value = savedOrderId;
      if (!route.params.id) {
        await router.replace(`/orders/${savedOrderId}/edit`);
      }
    }

    submitError.value = {
      title: message,
      details: courierDetails || errorDetails,
    };
    showErrorPopup(message, submitError.value.details);
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

.order-number-header {
  margin: 6px 0 0;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hold-logs-btn {
  min-height: 38px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 8px 13px;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
}

.hold-logs-btn:hover {
  border-color: #93c5fd;
  background: #dbeafe;
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

.form-fields {
  display: grid;
  gap: 18px;
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 0;
}

.readonly-form input,
.readonly-form select,
.readonly-form textarea,
.readonly-form .amount-input {
  background: #f8fafc;
}

.readonly-form input,
.readonly-form select,
.readonly-form textarea,
.readonly-form button {
  cursor: default;
}

.readonly-form .copy-btn,
.readonly-form .add-item-btn,
.readonly-form .qty-stepper button,
.readonly-form .remove-item-btn {
  opacity: 0.62;
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
  grid-template-columns: minmax(220px, 280px) max-content minmax(220px, 280px);
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

.address-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-address-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 32px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
  white-space: nowrap;
}

.ai-address-btn:hover:not(:disabled) {
  border-color: #2563eb;
  background: #dbeafe;
}

.ai-address-btn:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.ai-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(37, 99, 235, 0.25);
  border-top-color: #2563eb;
  border-radius: 999px;
  animation: ai-spin 0.8s linear infinite;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-address-panel {
  display: grid;
  gap: 10px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #f8fbff;
  padding: 12px;
}

.ai-address-panel.confidence-low {
  border-color: #fde68a;
  background: #fffbeb;
}

.ai-address-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.ai-address-panel-header > div:first-child {
  display: grid;
  gap: 3px;
}

.ai-address-panel strong {
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 900;
}

.ai-address-panel span {
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
}

.ai-address-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.copy-btn.small {
  max-width: none;
  padding: 6px 10px;
}

.copy-btn.primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.copy-btn.primary:hover:not(:disabled) {
  background: #1d4ed8;
  color: #fff;
}

.ai-address-warning {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e !important;
  padding: 5px 8px;
}

.whatsapp-action-panel {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
}

.whatsapp-action-panel.sent {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.whatsapp-action-panel div {
  display: grid;
  gap: 3px;
}

.whatsapp-action-panel strong {
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 850;
}

.whatsapp-action-panel.sent strong {
  color: #166534;
}

.whatsapp-action-panel span {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.whatsapp-action-btn {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
  background: #1d4ed8;
  color: #fff;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.whatsapp-action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.checkbox-field {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  color: #334155;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
  user-select: none;
}

.checkbox-field input {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
}

.advance-toggle {
  padding-bottom: 1px;
}

.cod-summary-row {
  margin-top: 2px;
}

.cod-summary {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: min(100%, 270px);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  padding: 12px 14px;
}

.cod-summary span {
  display: block;
  color: #475569;
  font-size: 11px;
  font-weight: 850;
}

.cod-summary strong {
  color: #1d4ed8;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.25;
}

.cod-summary small {
  color: #64748b;
  font-size: 10px;
  font-weight: 750;
  line-height: 1.35;
}

.amount-input {
  display: flex;
  align-items: center;
  height: 42px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}

.amount-input span {
  display: inline-flex;
  align-items: center;
  height: 100%;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 850;
}

.amount-input input {
  height: 100%;
  border: 0;
  border-radius: 0;
  min-width: 0;
}

.amount-input input:focus {
  box-shadow: none;
}

.amount-input:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
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

.amount-input.invalid {
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

.phone-helper {
  color: var(--color-text-secondary, #64748b);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
}

.phone-preview {
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
}

.phone-warning {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  padding: 5px 8px;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.35;
}

.items-error {
  display: inline-flex;
  width: fit-content;
  margin-top: -6px;
  border-radius: 7px;
  background: #fef2f2;
  padding: 5px 8px;
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

.copy-action {
  display: flex;
  align-items: center;
  min-height: 34px;
}

.copy-btn {
  max-width: min(100%, 270px);
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #fff;
  color: #2563eb;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.25;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, color 0.15s, transform 0.15s;
}

.copy-btn:hover:not(:disabled) {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.14);
  transform: translateY(-1px);
}

.copy-btn:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.2);
  outline-offset: 2px;
}

.copy-btn:active:not(:disabled) {
  background: #dbeafe;
  box-shadow: none;
  transform: translateY(0);
}

.copy-btn:disabled {
  border-color: #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.item-row {
  display: grid;
  grid-template-columns: minmax(280px, 520px) 78px;
  gap: 14px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 14px;
}

.product-combobox,
.city-combobox {
  position: relative;
}

.product-combobox input,
.city-combobox input {
  background: #fff;
}

.product-combobox.invalid input,
.city-combobox.invalid input {
  border-color: #ef4444;
}

.city-combobox.disabled input {
  background: #f8fafc;
  cursor: not-allowed;
}

.product-options,
.city-options {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 260px;
  overflow: auto;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
}

.product-option,
.city-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  color: #0f172a;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}

.product-option:hover,
.product-option:focus-visible,
.city-option:hover,
.city-option:focus-visible {
  background: #eff6ff;
}

.product-option span {
  overflow: hidden;
  font-size: 13px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-option small {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
}

.city-option {
  justify-content: flex-start;
  font-size: 13px;
  font-weight: 850;
}

.product-option-empty,
.city-option-empty {
  padding: 12px;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
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
  grid-template-columns: 56px minmax(0, 1fr) 116px auto;
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

.qty-stepper {
  display: grid;
  grid-template-columns: 32px minmax(34px, 1fr) 32px;
  align-items: center;
  width: 116px;
  height: 38px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
}

.qty-stepper button {
  width: 32px;
  height: 38px;
  border: 0;
  background: #f8fafc;
  color: #1e293b;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.qty-stepper button:hover:not(:disabled),
.qty-stepper button:focus-visible:not(:disabled) {
  background: #eff6ff;
  color: #2563eb;
}

.qty-stepper button:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.qty-stepper span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 38px;
  border-right: 1px solid #e2e8f0;
  border-left: 1px solid #e2e8f0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 850;
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
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.destructive-actions,
.primary-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.destructive-actions {
  justify-content: flex-start;
}

.primary-actions {
  justify-content: flex-end;
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

.order-cancel-action,
.order-delete-action {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
}

.order-cancel-action {
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}

.order-delete-action {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.order-cancel-action:hover:not(:disabled) {
  border-color: #fb923c;
  background: #ffedd5;
}

.order-delete-action:hover:not(:disabled) {
  border-color: #f87171;
  background: #fee2e2;
}

.order-cancel-action:disabled,
.order-delete-action:disabled,
.cancel-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.error-backdrop {
  position: fixed;
  z-index: 90;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: rgba(15, 23, 42, 0.48);
  padding: 44px 18px 18px;
}

.error-modal {
  width: min(450px, 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
  padding: 22px;
}

.hold-logs-modal {
  width: min(560px, 100%);
  max-height: min(680px, calc(100vh - 70px));
  display: flex;
  flex-direction: column;
  border: 1px solid #dbe3ee;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
  overflow: hidden;
}

.hold-logs-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.hold-logs-header span {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hold-logs-header h2 {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
}

.hold-logs-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.hold-logs-list {
  display: grid;
  gap: 10px;
  overflow-y: auto;
  padding: 16px 20px 20px;
}

.hold-log-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
}

.hold-log-item strong {
  display: block;
  color: #0f172a;
  font-size: 13.5px;
  font-weight: 850;
}

.hold-log-item span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.hold-log-item p {
  margin: 9px 0 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.hold-logs-empty {
  margin: 0;
  padding: 18px 20px 22px;
  color: #64748b;
  font-size: 13.5px;
  font-weight: 700;
}

.error-modal h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
  line-height: 1.35;
}

.error-modal pre {
  max-height: 240px;
  overflow: auto;
  margin: 12px 0 0;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  background: #fef2f2;
  color: #991b1b;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.45;
}

.error-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.error-ok-btn {
  min-width: 74px;
  border: 1px solid #991b1b;
  border-radius: 999px;
  background: #991b1b;
  color: #fff;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .error-modal,
.modal-fade-leave-to .error-modal {
  transform: translateY(-8px);
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

  .destructive-actions,
  .primary-actions {
    width: 100%;
    justify-content: stretch;
    flex-direction: column;
  }

  .destructive-actions button,
  .primary-actions button {
    width: 100%;
  }
}
</style>
