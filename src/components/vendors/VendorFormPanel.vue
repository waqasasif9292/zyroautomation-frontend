<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="show" class="panel-backdrop" @click.self="$emit('close')">
        <aside class="slide-panel">
          <header class="panel-head">
            <div>
              <h2>{{ vendor?.id ? 'Edit Vendor' : 'Add Vendor' }}</h2>
              <p>Supplier profile and contact details.</p>
            </div>
            <button type="button" class="icon-close" @click="$emit('close')">×</button>
          </header>

          <form class="panel-body" @submit.prevent="submit">
            <label><span>Vendor Name</span><input v-model="form.name" required></label>
            <label><span>Contact Person</span><input v-model="form.contact_name"></label>
            <label><span>Phone</span><input v-model="form.phone" @blur="normalizePhone"></label>
            <label><span>City</span><input v-model="form.city"></label>
            <label><span>Address</span><textarea v-model="form.address" rows="2"></textarea></label>
            <label><span>Notes</span><textarea v-model="form.notes" rows="2"></textarea></label>

            <footer class="panel-actions">
              <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Vendor' }}</button>
            </footer>
          </form>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue';
import phoneNormalizer from '../../utils/phoneNormalizer';

const props = defineProps({
  show: { type: Boolean, default: false },
  vendor: { type: Object, default: null },
  saving: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'save']);
const blank = () => ({ name: '', contact_name: '', phone: '', city: '', address: '', notes: '' });
const form = reactive(blank());

watch(() => [props.show, props.vendor], () => {
  Object.assign(form, blank(), props.vendor || {});
}, { immediate: true });

const normalizePhone = () => {
  form.phone = phoneNormalizer(form.phone) || '';
};

const submit = () => emit('save', { ...form });
</script>

<style scoped>
.panel-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; justify-content: flex-end; background: rgba(15, 23, 42, 0.42); }
.slide-panel { width: min(420px, 100%); height: 100%; overflow-y: auto; background: #fff; box-shadow: -20px 0 50px rgba(15, 23, 42, 0.2); }
.panel-head { display: flex; justify-content: space-between; gap: 14px; padding: 22px 24px; border-bottom: 1px solid #e2e8f0; }
.panel-head h2 { margin: 0 0 4px; color: #0f172a; font-size: 20px; font-weight: 850; }
.panel-head p { margin: 0; color: #64748b; font-size: 13px; }
.icon-close { width: 34px; height: 34px; border: none; border-radius: 8px; background: #f1f5f9; color: #334155; cursor: pointer; font-size: 22px; }
.panel-body { display: flex; flex-direction: column; gap: 15px; padding: 22px 24px; }
label { display: flex; flex-direction: column; gap: 7px; color: #334155; font-size: 13px; font-weight: 800; }
input, textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; color: #1e293b; font: inherit; padding: 10px 11px; }
.panel-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; }
.btn-secondary, .btn-primary { border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 850; padding: 10px 14px; }
.btn-secondary { border: 1px solid #cbd5e1; background: #fff; color: #334155; }
.btn-primary { border: none; background: #1e293b; color: #fff; }
.btn-primary:disabled { cursor: not-allowed; opacity: 0.65; }
.panel-slide-enter-active, .panel-slide-leave-active { transition: opacity 0.2s; }
.panel-slide-enter-active .slide-panel, .panel-slide-leave-active .slide-panel { transition: transform 0.2s; }
.panel-slide-enter-from, .panel-slide-leave-to { opacity: 0; }
.panel-slide-enter-from .slide-panel, .panel-slide-leave-to .slide-panel { transform: translateX(100%); }
</style>
