<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-backdrop" @click.self="$emit('cancel')">
      <div class="modal-card">
        <h3 class="modal-title">Regenerate Webhook URL?</h3>
        <p class="modal-body">
          This will create a new webhook URL for <strong>{{ brandName }}</strong>.
          Your existing Shopify webhook pointing to the old URL will stop working immediately.
          You will need to update it in Shopify manually.
        </p>
        <div class="modal-actions">
          <button
            type="button"
            class="btn-cancel"
            :disabled="loading"
            @click="$emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn-regen"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>Yes, Regenerate</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show:      { type: Boolean, required: true },
  brandName: { type: String,  default: '' },
  loading:   { type: Boolean, default: false },
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.18);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 10px;
}

.modal-body {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 9px 16px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-regen {
  padding: 9px 16px;
  background: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
}

.btn-regen:hover:not(:disabled) {
  background: #dc2626;
}

.btn-regen:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
