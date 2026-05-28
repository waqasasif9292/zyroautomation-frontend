<template>
  <AppLayout>
  <div class="settings-wrapper">

    <!-- Body -->
    <div class="settings-body">
      <!-- Sidebar -->
      <SettingsSubNav :activeKey="activeTab" @change="handleNavClick" />

      <!-- Content -->
      <main class="settings-content">

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Profile</h2>
            <p class="panel-subtitle">Update your personal information and account details.</p>
          </div>

          <div class="panel-body">
            <!-- Alert -->
            <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
            <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

            <!-- Name Row -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">First name</label>
                <input
                  class="form-input"
                  type="text"
                  v-model="form.first_name"
                  placeholder="First name"
                  :class="{ 'input-error': errors.first_name }"
                />
                <span v-if="errors.first_name" class="field-error">{{ errors.first_name }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">Last name</label>
                <input
                  class="form-input"
                  type="text"
                  v-model="form.last_name"
                  placeholder="Last name"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <input
                class="form-input"
                type="email"
                v-model="form.email"
                placeholder="Email address"
                :class="{ 'input-error': errors.email }"
              />
              <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
            </div>

            <!-- Bio -->
            <div class="form-group">
              <label class="form-label">Bio</label>
              <textarea
                class="form-textarea"
                v-model="form.bio"
                placeholder="Tell us about yourself"
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="panel-actions">
              <button class="btn-cancel" type="button" @click="resetForm">Cancel</button>
              <button class="btn-save" type="button" @click="saveProfile" :disabled="saving">
                <span v-if="saving">Saving...</span>
                <span v-else>Save changes</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Brands Tab -->
        <div v-else-if="activeTab === 'brands'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Brands</h2>
            <p class="panel-subtitle">Manage your brand identities and assets.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Brand settings coming soon.</p>
          </div>
        </div>

        <!-- Integrations Tab -->
        <div v-else-if="activeTab === 'integrations'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Integrations</h2>
            <p class="panel-subtitle">Connect your favourite tools and services.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Integration settings coming soon.</p>
          </div>
        </div>

        <!-- Leopard Pickup Tab -->
        <div v-else-if="activeTab === 'leopard'" class="content-panel">
          <div class="panel-header panel-header-row">
            <div>
              <h2 class="panel-title">Leopard Pickup Addresses</h2>
              <p class="panel-subtitle">Save shipper addresses that can be selected while booking Leopard orders.</p>
            </div>
            <button
              v-if="!leopardFormOpen"
              class="btn-save"
              type="button"
              @click="startNewLeopardAddress"
            >
              Add address
            </button>
            <button v-else class="btn-cancel" type="button" @click="cancelLeopardForm">Close form</button>
          </div>

          <div class="panel-body">
            <div v-if="leopardSuccessMsg" class="alert alert-success">{{ leopardSuccessMsg }}</div>
            <div v-if="leopardErrorMsg" class="alert alert-error">{{ leopardErrorMsg }}</div>

            <form v-if="leopardFormOpen" class="pickup-form" @submit.prevent="saveLeopardAddress">
              <div class="pickup-form-head">
                <div>
                  <h3>{{ leopardEditingId ? 'Edit pickup address' : 'Add pickup address' }}</h3>
                  <p>{{ leopardEditingId ? 'Update this saved Leopard pickup address.' : 'Add a shipper address for future Leopard bookings.' }}</p>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Shipment Name</label>
                  <input class="form-input" v-model="leopardForm.shipment_name_eng" :class="{ 'input-error': leopardErrors.shipment_name_eng }" type="text">
                  <span v-if="leopardErrors.shipment_name_eng" class="field-error">{{ leopardErrors.shipment_name_eng }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Origin City</label>
                  <select class="form-input" v-model.number="leopardForm.origin_city" :class="{ 'input-error': leopardErrors.origin_city }">
                    <option value="">Select city</option>
                    <option v-for="city in leopardCities" :key="city.id" :value="city.id">{{ city.name }}</option>
                  </select>
                  <span v-if="leopardErrors.origin_city" class="field-error">{{ leopardErrors.origin_city }}</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Return City</label>
                  <select class="form-input" v-model.number="leopardForm.return_city" :class="{ 'input-error': leopardErrors.return_city }">
                    <option value="">Select city</option>
                    <option v-for="city in leopardCities" :key="city.id" :value="city.id">{{ city.name }}</option>
                  </select>
                  <span v-if="leopardErrors.return_city" class="field-error">{{ leopardErrors.return_city }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Shipment Email</label>
                  <input class="form-input" v-model="leopardForm.shipment_email" :class="{ 'input-error': leopardErrors.shipment_email }" type="email">
                  <span v-if="leopardErrors.shipment_email" class="field-error">{{ leopardErrors.shipment_email }}</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Shipment Phone</label>
                  <input class="form-input" v-model="leopardForm.shipment_phone" :class="{ 'input-error': leopardErrors.shipment_phone }" type="text">
                  <span v-if="leopardErrors.shipment_phone" class="field-error">{{ leopardErrors.shipment_phone }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Shipment Address</label>
                  <input class="form-input" v-model="leopardForm.shipment_address" :class="{ 'input-error': leopardErrors.shipment_address }" type="text">
                  <span v-if="leopardErrors.shipment_address" class="field-error">{{ leopardErrors.shipment_address }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Return Address</label>
                <textarea class="form-textarea" v-model="leopardForm.return_address" :class="{ 'input-error': leopardErrors.return_address }"></textarea>
                <span v-if="leopardErrors.return_address" class="field-error">{{ leopardErrors.return_address }}</span>
              </div>

              <div class="panel-actions">
                <button class="btn-cancel" type="button" @click="cancelLeopardForm">Cancel</button>
                <button class="btn-save" type="submit" :disabled="leopardSaving">
                  {{ leopardSaving ? 'Saving...' : (leopardEditingId ? 'Update address' : 'Save address') }}
                </button>
              </div>
            </form>

            <div v-if="leopardLoading" class="empty-state">Loading pickup addresses...</div>
            <div v-else-if="!visibleLeopardAddresses.length" class="empty-state">
              {{ leopardEditingId ? 'No other Leopard pickup addresses saved yet.' : 'No Leopard pickup addresses saved yet.' }}
            </div>
            <div v-else class="pickup-list">
              <article v-for="address in visibleLeopardAddresses" :key="address.id" class="pickup-row">
                <div>
                  <h3>{{ address.shipment_name_eng }}</h3>
                  <p>{{ address.shipment_address }}</p>
                  <span>{{ address.origin_city_name }} | Return: {{ address.return_city_name }} | {{ address.shipment_phone }}</span>
                </div>
                <div class="row-actions">
                  <button class="btn-cancel" type="button" @click="editLeopardAddress(address)">Edit</button>
                  <button class="btn-danger" type="button" @click="deleteLeopardAddress(address)">Delete</button>
                </div>
              </article>
            </div>
          </div>
        </div>

        <!-- Notifications Tab -->
        <div v-else-if="activeTab === 'notifications'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Notifications</h2>
            <p class="panel-subtitle">Control how and when you get notified.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Notification settings coming soon.</p>
          </div>
        </div>

        <!-- Courier Statuses Tab -->
        <div v-else-if="activeTab === 'statuses'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Courier Statuses</h2>
            <p class="panel-subtitle">Map each courier raw status into the fixed system categories used across operations.</p>
          </div>

          <div class="panel-body">
            <div v-if="statusSuccessMsg" class="alert alert-success">{{ statusSuccessMsg }}</div>
            <div v-if="statusErrorMsg" class="alert alert-error">{{ statusErrorMsg }}</div>

            <div v-if="statusesLoading" class="empty-state">Loading statuses...</div>
            <template v-else>
              <div class="status-tabs" role="tablist" aria-label="Courier status filters">
                <button
                  v-for="tab in statusTabs"
                  :key="tab.key"
                  :class="['status-tab', { active: activeStatusTab === tab.key }]"
                  type="button"
                  @click="activeStatusTab = tab.key"
                >
                  {{ tab.label }}
                </button>
              </div>

              <div v-if="activeStatusTab === 'all'" class="status-groups">
                <section v-for="group in groupedStatusOverview" :key="group.key" class="status-group">
                  <div class="status-group-head">
                    <div>
                      <h3>{{ group.label }}</h3>
                      <span>{{ group.mappings.length }} {{ group.mappings.length === 1 ? 'status' : 'statuses' }}</span>
                    </div>
                  </div>

                  <div class="status-tags">
                    <span
                      v-for="mapping in group.mappings"
                      :key="mappingKey(mapping)"
                      :class="['status-tag', { unmapped: !mapping.main_category }]"
                    >
                      <strong>{{ courierLabel(mapping.courier) }}:</strong> {{ mapping.raw_status }}
                    </span>
                    <span v-if="!group.mappings.length" class="status-empty-chip">No statuses mapped</span>
                  </div>
                </section>
              </div>

              <div v-else class="courier-mapping-panel">
                <form class="mapping-add-row" @submit.prevent="addCourierStatus">
                  <input
                    v-model="newStatusForm.raw_status"
                    class="form-input"
                    type="text"
                    placeholder="Courier raw status"
                  />
                  <select v-model="newStatusForm.main_category" class="form-input">
                    <option value="">Select main category</option>
                    <option v-for="category in statusCategories" :key="category.key" :value="category.key">
                      {{ category.label }}
                    </option>
                  </select>
                  <button class="btn-save" type="submit">Add</button>
                </form>

                <div class="mapping-table">
                  <div class="mapping-table-head">
                    <span>Courier Status</span>
                    <span>Main Category</span>
                    <span></span>
                  </div>

                  <div
                    v-for="mapping in currentCourierMappings"
                    :key="mappingKey(mapping)"
                    :class="['mapping-row', { unmapped: !mapping.main_category }]"
                  >
                    <div>
                      <strong>{{ mapping.raw_status }}</strong>
                      <span v-if="mapping.is_predefined">Predefined</span>
                      <span v-else>Custom</span>
                    </div>
                    <select v-model="mapping.main_category" class="form-input">
                      <option value="">Unmapped</option>
                      <option v-for="category in statusCategories" :key="category.key" :value="category.key">
                        {{ category.label }}
                      </option>
                    </select>
                    <button
                      v-if="!mapping.is_predefined"
                      class="icon-danger"
                      type="button"
                      :aria-label="`Remove ${mapping.raw_status}`"
                      @click="openStatusDelete(mapping)"
                    >
                      &times;
                    </button>
                    <span v-else></span>
                  </div>

                  <div v-if="!currentCourierMappings.length" class="empty-state compact">
                    No statuses added for {{ activeCourierLabel }} yet.
                  </div>
                </div>
              </div>
            </template>

            <div class="panel-actions">
              <button class="btn-cancel" type="button" @click="resetStatuses" :disabled="statusesSaving || statusesLoading">
                Reset
              </button>
              <button class="btn-save" type="button" @click="saveStatuses" :disabled="statusesSaving || statusesLoading">
                {{ statusesSaving ? 'Saving...' : 'Save statuses' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Billing Tab -->
        <div v-else-if="activeTab === 'billing'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Billing</h2>
            <p class="panel-subtitle">Manage your subscription and payment methods.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Billing settings coming soon.</p>
          </div>
        </div>

        <!-- Team Tab -->
        <div v-else-if="activeTab === 'team'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Team</h2>
            <p class="panel-subtitle">Invite and manage your team members.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Team settings coming soon.</p>
          </div>
        </div>

        <!-- Security Tab -->
        <div v-else-if="activeTab === 'security'" class="content-panel">
          <div class="panel-header">
            <h2 class="panel-title">Security</h2>
            <p class="panel-subtitle">Keep your account secure.</p>
          </div>
          <div class="panel-body empty-state">
            <p>Security settings coming soon.</p>
          </div>
        </div>

      </main>
    </div>
  </div>

  <ConfirmDialog
    :show="leopardDeleteDialogOpen"
    title="Delete Leopard pickup address?"
    message="This pickup address will no longer be available while creating Leopard orders."
    :details="leopardDeleteTarget?.shipment_name_eng || ''"
    eyebrow="Leopard pickup"
    confirmText="Delete address"
    cancelText="Keep address"
    variant="danger"
    :loading="leopardDeleteLoading"
    @cancel="closeLeopardDeleteDialog"
    @confirm="confirmLeopardDelete"
  />

  <ConfirmDialog
    :show="statusDeleteDialogOpen"
    title="Remove status mapping?"
    message="This courier status will no longer resolve into a main category until it is added again."
    :details="statusDeleteTarget ? `${courierLabel(statusDeleteTarget.courier)}: ${statusDeleteTarget.raw_status}` : ''"
    eyebrow="Status mapping"
    confirmText="Remove status"
    cancelText="Keep status"
    variant="danger"
    @cancel="closeStatusDelete"
    @confirm="confirmStatusDelete"
  />
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import AppLayout from '../../layouts/AppLayout.vue';
import SettingsSubNav from '../../components/SettingsSubNav.vue';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';
import LeopardService from '../../services/LeopardService';
import SettingsService from '../../services/SettingsService';

const router    = useRouter();
const route     = useRoute();
const authStore = useAuthStore();
const activeTab = ref(route.query.tab || 'profile');

const handleNavClick = (key) => {
  activeTab.value = key;
  router.replace({ query: key === 'profile' ? {} : { tab: key } });
};
const saving = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const errors = reactive({});
const leopardLoading = ref(false);
const leopardSaving = ref(false);
const leopardFormOpen = ref(false);
const leopardEditingId = ref(null);
const leopardSuccessMsg = ref('');
const leopardErrorMsg = ref('');
const leopardAddresses = ref([]);
const leopardCities = ref([]);
const leopardErrors = reactive({});
const leopardDeleteDialogOpen = ref(false);
const leopardDeleteLoading = ref(false);
const leopardDeleteTarget = ref(null);
const statusesLoading = ref(false);
const statusesSaving = ref(false);
const statusSuccessMsg = ref('');
const statusErrorMsg = ref('');
const activeStatusTab = ref('all');
const statusCategories = ref([]);
const statusCouriers = ref([]);
const statusMappings = ref([]);
const savedStatusMappings = ref([]);
const statusDeleteDialogOpen = ref(false);
const statusDeleteTarget = ref(null);
const newStatusForm = reactive({
  raw_status: '',
  main_category: '',
});
const visibleLeopardAddresses = computed(() => {
  if (!leopardEditingId.value) return leopardAddresses.value;

  return leopardAddresses.value.filter(address => address.id !== leopardEditingId.value);
});

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  bio: '',
});

const emptyLeopardForm = () => ({
  shipment_name_eng: '',
  shipment_email: '',
  shipment_phone: '',
  shipment_address: '',
  return_address: '',
  origin_city: '',
  return_city: '',
});

const leopardForm = reactive(emptyLeopardForm());

const fallbackStatusCategories = [
  { key: 'hold', label: 'On Hold' },
  { key: 'pending_confirmation', label: 'Pending Confirmation' },
  { key: 'duplicate', label: 'Duplicate' },
  { key: 'error', label: 'Error' },
  { key: 'merchant_warehouse', label: 'Merchant Warehouse' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'out_for_delivery', label: 'Out For Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'ready_for_return', label: 'Ready For Return' },
  { key: 'returned_to_shipper', label: 'Returned to Shipper' },
];

const fallbackCouriers = [
  { key: 'postex', label: 'PostEx' },
  { key: 'leopard', label: 'Leopard Courier' },
  { key: 'dastaq', label: 'Dastaq' },
  { key: 'argo', label: 'Argo Courier' },
];

const statusTabs = computed(() => [
  { key: 'all', label: 'All' },
  ...statusCouriers.value,
]);

const activeCourierLabel = computed(() => courierLabel(activeStatusTab.value));

const currentCourierMappings = computed(() => statusMappings.value
  .filter(mapping => mapping.courier === activeStatusTab.value && mapping.is_active !== false)
  .sort((a, b) => a.raw_status.localeCompare(b.raw_status)));

const groupedStatusOverview = computed(() => statusCategories.value.map(category => ({
  ...category,
  mappings: statusMappings.value
    .filter(mapping => mapping.main_category === category.key && mapping.is_active !== false)
    .sort((a, b) => courierLabel(a.courier).localeCompare(courierLabel(b.courier)) || a.raw_status.localeCompare(b.raw_status)),
})));

const loadFromStore = () => {
  const u = authStore.user;
  if (!u) return;
  form.first_name = u.first_name ?? u.name?.split(' ')[0] ?? '';
  form.last_name  = u.last_name  ?? u.name?.split(' ').slice(1).join(' ') ?? '';
  form.email      = u.email ?? '';
  form.bio        = u.bio ?? '';
};

loadFromStore();

watch(() => authStore.user, loadFromStore);

onMounted(async () => {
  await Promise.all([loadLeopardData(), loadParcelStatuses()]);
  hydrateLeopardEditorFromQuery();
});

const resetForm = () => {
  loadFromStore();
  Object.keys(errors).forEach(k => delete errors[k]);
  successMsg.value = '';
  errorMsg.value = '';
};

const saveProfile = async () => {
  Object.keys(errors).forEach(k => delete errors[k]);
  successMsg.value = '';
  errorMsg.value = '';
  saving.value = true;

  try {
    await authStore.updateProfile({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      bio: form.bio,
    });
    successMsg.value = 'Profile updated successfully.';
    setTimeout(() => { successMsg.value = ''; }, 3000);
  } catch (err) {
    const data = err.response?.data;
    if (data?.errors) {
      Object.assign(errors, Object.fromEntries(
        Object.entries(data.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      ));
    } else {
      errorMsg.value = data?.message ?? 'Failed to update profile.';
    }
  } finally {
    saving.value = false;
  }
};

const loadLeopardData = async () => {
  leopardLoading.value = true;
  leopardErrorMsg.value = '';
  try {
    const [citiesRes, addressesRes] = await Promise.all([
      LeopardService.fetchCities(),
      LeopardService.fetchPickupAddresses(),
    ]);
    leopardCities.value = citiesRes.data.data.cities;
    leopardAddresses.value = addressesRes.data.data.addresses;
  } catch (error) {
    leopardErrorMsg.value = error.response?.data?.message || 'Unable to load Leopard pickup settings.';
  } finally {
    leopardLoading.value = false;
  }
};

const resetLeopardForm = () => {
  Object.assign(leopardForm, emptyLeopardForm());
  leopardEditingId.value = null;
  Object.keys(leopardErrors).forEach(k => delete leopardErrors[k]);
};

const startNewLeopardAddress = () => {
  resetLeopardForm();
  leopardFormOpen.value = true;
  setLeopardQuery();
};

const cancelLeopardForm = () => {
  resetLeopardForm();
  leopardFormOpen.value = false;
  setLeopardQuery();
};

const editLeopardAddress = (address) => {
  Object.assign(leopardForm, {
    shipment_name_eng: address.shipment_name_eng || '',
    shipment_email: address.shipment_email || '',
    shipment_phone: address.shipment_phone || '',
    shipment_address: address.shipment_address || '',
    return_address: address.return_address || '',
    origin_city: address.origin_city || '',
    return_city: address.return_city || '',
  });
  leopardEditingId.value = address.id;
  Object.keys(leopardErrors).forEach(k => delete leopardErrors[k]);
  leopardFormOpen.value = true;
  setLeopardQuery(address.id);
};

const hydrateLeopardEditorFromQuery = () => {
  if (route.query.tab !== 'leopard' || !route.query.edit) return;

  const address = leopardAddresses.value.find(item => item.id === route.query.edit);
  if (address) {
    editLeopardAddress(address);
  } else {
    leopardErrorMsg.value = 'The pickup address in the edit link was not found.';
    setLeopardQuery();
  }
};

const setLeopardQuery = (editId = null) => {
  router.replace({
    query: {
      tab: 'leopard',
      ...(editId ? { edit: editId } : {}),
    },
  });
};

const saveLeopardAddress = async () => {
  Object.keys(leopardErrors).forEach(k => delete leopardErrors[k]);
  leopardSuccessMsg.value = '';
  leopardErrorMsg.value = '';
  leopardSaving.value = true;

  try {
    const payload = {
      ...leopardForm,
      origin_city: Number(leopardForm.origin_city),
      return_city: Number(leopardForm.return_city),
    };
    const res = leopardEditingId.value
      ? await LeopardService.updatePickupAddress(leopardEditingId.value, payload)
      : await LeopardService.createPickupAddress(payload);
    const saved = res.data.data.address;
    const index = leopardAddresses.value.findIndex(item => item.id === saved.id);
    if (index === -1) {
      leopardAddresses.value.unshift(saved);
    } else {
      leopardAddresses.value[index] = saved;
    }
    leopardSuccessMsg.value = 'Leopard pickup address saved.';
    cancelLeopardForm();
  } catch (error) {
    const responseErrors = error.response?.data?.errors;
    if (responseErrors) {
      Object.assign(leopardErrors, Object.fromEntries(
        Object.entries(responseErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      ));
    } else {
      leopardErrorMsg.value = error.response?.data?.message || 'Unable to save Leopard pickup address.';
    }
  } finally {
    leopardSaving.value = false;
  }
};

const deleteLeopardAddress = async (address) => {
  leopardDeleteTarget.value = address;
  leopardDeleteDialogOpen.value = true;
};

const closeLeopardDeleteDialog = () => {
  if (leopardDeleteLoading.value) return;

  leopardDeleteDialogOpen.value = false;
  leopardDeleteTarget.value = null;
};

const confirmLeopardDelete = async () => {
  if (!leopardDeleteTarget.value) return;

  leopardDeleteLoading.value = true;
  leopardErrorMsg.value = '';
  try {
    await LeopardService.deletePickupAddress(leopardDeleteTarget.value.id);
    leopardAddresses.value = leopardAddresses.value.filter(item => item.id !== leopardDeleteTarget.value.id);
    leopardSuccessMsg.value = 'Leopard pickup address deleted.';
    leopardDeleteDialogOpen.value = false;
    leopardDeleteTarget.value = null;
  } catch (error) {
    leopardErrorMsg.value = error.response?.data?.message || 'Unable to delete Leopard pickup address.';
  } finally {
    leopardDeleteLoading.value = false;
  }
};

const cloneStatusMappings = (mappings) => mappings.map(mapping => ({ ...mapping }));

const normalizeStatusMappings = (mappings = []) => mappings
  .map(mapping => ({
    courier: mapping.courier || '',
    raw_status: String(mapping.raw_status || '').trim(),
    main_category: mapping.main_category || '',
    is_predefined: Boolean(mapping.is_predefined),
    is_active: mapping.is_active !== false,
  }))
  .filter(mapping => mapping.courier && mapping.raw_status);

const mappingKey = (mapping) => `${mapping.courier}:${mapping.raw_status.toLowerCase()}`;

const courierLabel = (key) => statusCouriers.value.find(courier => courier.key === key)?.label || key;

const loadParcelStatuses = async () => {
  statusesLoading.value = true;
  statusErrorMsg.value = '';
  try {
    const res = await SettingsService.fetchParcelStatuses();
    statusCategories.value = res.data.data.categories?.length ? res.data.data.categories : fallbackStatusCategories;
    statusCouriers.value = res.data.data.couriers?.length ? res.data.data.couriers : fallbackCouriers;
    statusMappings.value = normalizeStatusMappings(res.data.data.mappings);
    savedStatusMappings.value = cloneStatusMappings(statusMappings.value);
  } catch (error) {
    statusCategories.value = fallbackStatusCategories;
    statusCouriers.value = fallbackCouriers;
    statusMappings.value = [];
    savedStatusMappings.value = [];
    statusErrorMsg.value = error.response?.data?.message || 'Unable to load parcel statuses.';
  } finally {
    statusesLoading.value = false;
  }
};

const addCourierStatus = () => {
  const rawStatus = newStatusForm.raw_status.trim();
  const courier = activeStatusTab.value;
  statusErrorMsg.value = '';
  statusSuccessMsg.value = '';

  if (!rawStatus || !courier || courier === 'all') return;

  const exists = statusMappings.value.some(mapping =>
    mapping.courier === courier && mapping.raw_status.toLowerCase() === rawStatus.toLowerCase()
  );
  if (exists) {
    statusErrorMsg.value = `"${rawStatus}" already exists for ${courierLabel(courier)}.`;
    return;
  }

  statusMappings.value.push({
    courier,
    raw_status: rawStatus,
    main_category: newStatusForm.main_category,
    is_predefined: false,
    is_active: true,
  });
  newStatusForm.raw_status = '';
  newStatusForm.main_category = '';
};

const openStatusDelete = (mapping) => {
  statusDeleteTarget.value = mapping;
  statusDeleteDialogOpen.value = true;
};

const closeStatusDelete = () => {
  statusDeleteDialogOpen.value = false;
  statusDeleteTarget.value = null;
};

const confirmStatusDelete = () => {
  if (!statusDeleteTarget.value) return;

  const targetKey = mappingKey(statusDeleteTarget.value);
  statusMappings.value = statusMappings.value.filter(mapping => mappingKey(mapping) !== targetKey);
  closeStatusDelete();
};

const resetStatuses = () => {
  statusMappings.value = cloneStatusMappings(savedStatusMappings.value);
  statusErrorMsg.value = '';
  statusSuccessMsg.value = '';
  newStatusForm.raw_status = '';
  newStatusForm.main_category = '';
};

const saveStatuses = async () => {
  statusesSaving.value = true;
  statusErrorMsg.value = '';
  statusSuccessMsg.value = '';

  try {
    const unmapped = statusMappings.value.find(mapping => !mapping.main_category);
    if (unmapped) {
      statusErrorMsg.value = `${courierLabel(unmapped.courier)}: ${unmapped.raw_status} is unmapped. Select a main category before saving.`;
      return;
    }

    const duplicates = new Set();
    const hasDuplicate = statusMappings.value.some(mapping => {
      const key = mappingKey(mapping);
      if (duplicates.has(key)) return true;
      duplicates.add(key);
      return false;
    });
    if (hasDuplicate) {
      statusErrorMsg.value = 'Duplicate statuses are not allowed within the same courier.';
      return;
    }

    const payload = statusMappings.value.map(mapping => ({
      courier: mapping.courier,
      raw_status: mapping.raw_status,
      main_category: mapping.main_category,
      is_predefined: mapping.is_predefined,
      is_active: mapping.is_active,
    }));
    const res = await SettingsService.updateParcelStatuses(payload);
    statusCategories.value = res.data.data.categories?.length ? res.data.data.categories : statusCategories.value;
    statusCouriers.value = res.data.data.couriers?.length ? res.data.data.couriers : statusCouriers.value;
    statusMappings.value = normalizeStatusMappings(res.data.data.mappings);
    savedStatusMappings.value = cloneStatusMappings(statusMappings.value);
    statusSuccessMsg.value = 'Parcel status mappings saved successfully.';
    setTimeout(() => { statusSuccessMsg.value = ''; }, 3000);
  } catch (error) {
    const responseErrors = error.response?.data?.errors;
    if (responseErrors) {
      statusErrorMsg.value = Object.values(responseErrors).flat()[0] || 'Unable to save parcel statuses.';
    } else {
      statusErrorMsg.value = error.response?.data?.message || 'Unable to save parcel statuses.';
    }
  } finally {
    statusesSaving.value = false;
  }
};

</script>

<style scoped>
.settings-wrapper {
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Body */
.settings-body {
  display: flex;
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 40px auto;
  padding: 0 28px;
  gap: 32px;
  align-items: flex-start;
}

/* Sidebar */
.settings-sidebar {
  width: 200px;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13.5px;
  color: #374151;
  font-weight: 500;
  text-align: left;
  width: 100%;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.active {
  background: #eff6ff;
  color: #1d4ed8;
}

.nav-item.active .nav-icon {
  color: #1d4ed8;
}

.nav-icon {
  display: flex;
  align-items: center;
  color: #9ca3af;
  flex-shrink: 0;
}

/* Content */
.settings-content {
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
  padding: 24px 28px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.panel-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.panel-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Form */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #fff;
}

.form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 14px;
  color: #111827;
  outline: none;
  resize: vertical;
  min-height: 96px;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #fff;
}

.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea::placeholder,
.form-input::placeholder {
  color: #9ca3af;
}

/* Actions */
.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.btn-cancel {
  padding: 9px 18px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-save {
  padding: 9px 18px;
  background: #111827;
  border: 1px solid #111827;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-save:hover {
  background: #1f2937;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  padding: 9px 18px;
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #dc2626;
  cursor: pointer;
}

.pickup-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  padding: 18px;
}

.pickup-form-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 4px;
}

.pickup-form-head h3 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
}

.pickup-form-head p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.pickup-list {
  display: grid;
  gap: 12px;
}

.pickup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
}

.pickup-row h3 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 14px;
}

.pickup-row p {
  margin: 0 0 4px;
  color: #4b5563;
  font-size: 13px;
}

.pickup-row span {
  color: #6b7280;
  font-size: 12px;
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
}

.status-tab {
  min-height: 34px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
  color: #475569;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.status-tab:hover {
  background: #f8fafc;
}

.status-tab.active {
  border-color: #1d4ed8;
  background: #eff6ff;
  color: #1d4ed8;
}

.status-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.status-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 16px;
}

.status-group-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.status-group-head h3 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.status-group-head span {
  color: #6b7280;
  font-size: 12px;
}

.status-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  min-height: 28px;
  padding: 5px 7px 5px 10px;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.2;
}

.status-tag.unmapped {
  background: #fef2f2;
  color: #b91c1c;
}

.status-empty-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 5px 10px;
  border-radius: 6px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.courier-mapping-panel {
  display: grid;
  gap: 14px;
}

.mapping-add-row {
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(190px, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  padding: 14px;
}

.mapping-table {
  display: grid;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.mapping-table-head,
.mapping-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) 44px;
  gap: 12px;
  align-items: center;
}

.mapping-table-head {
  background: #f8fafc;
  color: #64748b;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.mapping-row {
  min-height: 58px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 14px;
}

.mapping-row.unmapped {
  background: #fff7ed;
}

.mapping-row strong {
  display: block;
  color: #111827;
  font-size: 13.5px;
  margin-bottom: 3px;
}

.mapping-row span {
  color: #64748b;
  font-size: 11.5px;
  font-weight: 700;
}

.icon-danger {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fecaca;
  border-radius: 7px;
  background: #fff;
  color: #dc2626;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.icon-danger:hover {
  background: #fef2f2;
}

.empty-state.compact {
  min-height: 86px;
  border-top: 1px solid #e5e7eb;
}

.alert {
  padding: 10px 14px;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
}

.alert-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.input-error {
  border-color: #dc2626 !important;
}

.field-error {
  font-size: 11.5px;
  color: #dc2626;
  margin-top: 2px;
}

@media (max-width: 860px) {
  .settings-body,
  .form-row,
  .status-groups {
    grid-template-columns: 1fr;
  }

  .settings-body {
    display: grid;
  }

  .settings-sidebar {
    width: 100%;
  }

  .mapping-add-row,
  .mapping-table-head,
  .mapping-row {
    grid-template-columns: 1fr;
  }

  .mapping-table-head span:last-child {
    display: none;
  }
}
</style>
