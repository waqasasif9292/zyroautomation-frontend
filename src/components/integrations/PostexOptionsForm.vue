<template>
  <div class="postex-options">
    <div class="form-group">
      <label class="form-label">API Token</label>
      <p class="form-sublabel">Enter your PostEx API token. It will be validated by PostEx when you save.</p>
      <input
        :value="modelValue.api_token || ''"
        type="text"
        class="form-input"
        :class="{ 'input-error': errorMessage }"
        placeholder="Enter PostEx API token"
        @input="emitOptions({ api_token: $event.target.value })"
      />
      <p v-if="errorMessage" class="field-error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Object, required: true },
  errorMessage: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const emitOptions = (patch) => {
  emit('update:modelValue', {
    ...patch,
  });
};
</script>

<style scoped>
.postex-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.form-sublabel {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

.form-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  font-size: 15px;
  color: #111827;
}

.form-input:focus {
  outline: none;
  border-color: #1e293b;
}

.input-error {
  border-color: #ef4444 !important;
}

.field-error {
  font-size: 13px;
  color: #ef4444;
  margin: 0;
}
</style>
