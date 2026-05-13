<template>
  <div class="leopard-options">
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">API Key</label>
        <p class="form-sublabel">Enter the Leopard API key from API Management.</p>
        <input
          :value="modelValue.api_key || ''"
          type="text"
          class="form-input"
          :class="{ 'input-error': apiKeyError }"
          placeholder="Enter Leopard API key"
          @input="emitOptions({ api_key: $event.target.value })"
        />
        <p v-if="apiKeyError" class="field-error">{{ apiKeyError }}</p>
      </div>

      <div class="form-group">
        <label class="form-label">API Password</label>
        <p class="form-sublabel">Enter the password chosen in Leopard API settings.</p>
        <input
          :value="modelValue.api_password || ''"
          type="password"
          class="form-input"
          :class="{ 'input-error': apiPasswordError || generalError }"
          placeholder="Enter Leopard API password"
          autocomplete="new-password"
          @input="emitOptions({ api_password: $event.target.value })"
        />
        <p v-if="apiPasswordError" class="field-error">{{ apiPasswordError }}</p>
      </div>
    </div>

    <p v-if="generalError" class="field-error">{{ generalError }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true },
  apiKeyError: { type: String, default: '' },
  apiPasswordError: { type: String, default: '' },
  generalError: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const emitOptions = (patch) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...patch,
  });
};
</script>

<style scoped>
.leopard-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
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

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
