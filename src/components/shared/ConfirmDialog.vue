<template>
  <Teleport to="body">
    <transition name="dialog-fade">
      <div v-if="show" class="dialog-backdrop" @click.self="cancel">
        <section class="dialog-card" role="dialog" aria-modal="true" :aria-labelledby="titleId">
          <div :class="['dialog-icon', `dialog-icon-${variant}`]">
            <svg v-if="variant === 'danger'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>

          <p v-if="eyebrow" class="dialog-eyebrow">{{ eyebrow }}</p>
          <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
          <p class="dialog-message">{{ message }}</p>

          <div v-if="details" class="dialog-details">{{ details }}</div>

          <div class="dialog-actions">
            <button type="button" class="btn-cancel" :disabled="loading" @click="cancel">
              {{ cancelText }}
            </button>
            <button type="button" :class="['btn-confirm', `btn-${variant}`]" :disabled="loading" @click="$emit('confirm')">
              <span v-if="loading" class="spinner"></span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, required: true },
  details: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  variant: {
    type: String,
    default: 'danger',
    validator: value => ['danger', 'primary'].includes(value),
  },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['confirm', 'cancel']);
const titleId = `confirm-title-${Math.random().toString(36).slice(2)}`;

const cancel = () => {
  if (!props.loading) emit('cancel');
};
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.58);
}

.dialog-card {
  width: min(440px, 100%);
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
  padding: 24px;
}

.dialog-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  margin-bottom: 14px;
}

.dialog-icon-danger {
  background: #fee2e2;
  color: #dc2626;
}

.dialog-icon-primary {
  background: #dbeafe;
  color: #1d4ed8;
}

.dialog-eyebrow {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.dialog-title {
  margin: 0;
  color: #111827;
  font-size: 19px;
  font-weight: 800;
}

.dialog-message {
  margin: 10px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
}

.dialog-details {
  margin-top: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #1e293b;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.btn-cancel,
.btn-confirm {
  min-width: 96px;
  border-radius: 9px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.btn-confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  color: #fff;
}

.btn-danger {
  background: #dc2626;
}

.btn-primary {
  background: #1e293b;
}

.btn-cancel:disabled,
.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
