<template>
  <div class="modal-overlay">
    <div class="modal-card">
      <h3 class="modal-title">Delete Integration</h3>
      <p class="modal-body">
        Are you sure you want to remove the <span>{{ courierName }}</span> integration? This cannot be undone.
      </p>
      <div class="modal-actions">
        <button class="btn-secondary" :disabled="loading" @click="$emit('cancel')">Cancel</button>
        <button class="btn-danger" :disabled="loading" @click="$emit('confirm')">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  courierName: { type: String, required: true },
  loading: { type: Boolean, default: false },
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.modal-body {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.modal-body span {
  color: #1e293b;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-secondary,
.btn-danger {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-secondary {
  background: #fff;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
