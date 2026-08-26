<template>
  <div class="tcs-options">
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Username</label>
        <p class="form-sublabel">Enter the TCS e-com username.</p>
        <input
          :value="modelValue.username || ''"
          type="text"
          class="form-input"
          :class="{ 'input-error': usernameError || generalError }"
          placeholder="Enter TCS username"
          autocomplete="username"
          @input="emitOptions({ username: $event.target.value })"
        />
        <p v-if="usernameError" class="field-error">{{ usernameError }}</p>
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <p class="form-sublabel">Enter the TCS e-com password.</p>
        <input
          :value="modelValue.password || ''"
          type="password"
          class="form-input"
          :class="{ 'input-error': passwordError || generalError }"
          placeholder="Enter TCS password"
          autocomplete="new-password"
          @input="emitOptions({ password: $event.target.value })"
        />
        <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
      </div>

      <div class="form-group span-2">
        <label class="form-label">Account / Customer No</label>
        <p class="form-sublabel">Use this if TCS provided a separate customer number.</p>
        <input
          :value="modelValue.customer_no || ''"
          type="text"
          class="form-input"
          placeholder="Auto-detected from bearer token if empty"
          autocomplete="off"
          @input="emitOptions({ customer_no: $event.target.value })"
        />
      </div>

      <div class="form-group span-2">
        <label class="form-label">Bearer Token</label>
        <p class="form-sublabel">Enter the TCS authorization bearer token.</p>
        <textarea
          :value="modelValue.bearer_token || ''"
          class="form-textarea"
          :class="{ 'input-error': bearerTokenError || generalError }"
          placeholder="Enter TCS bearer token"
          autocomplete="off"
          rows="4"
          @input="emitOptions({ bearer_token: $event.target.value })"
        ></textarea>
        <p v-if="bearerTokenError" class="field-error">{{ bearerTokenError }}</p>
      </div>

      <div v-if="modelValue.access_token_expiry" class="form-group span-2">
        <label class="form-label">Access Token Expiry</label>
        <input
          :value="modelValue.access_token_expiry"
          type="text"
          class="form-input"
          readonly
        />
      </div>
    </div>

    <p v-if="generalError" class="field-error">{{ generalError }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true },
  usernameError: { type: String, default: '' },
  passwordError: { type: String, default: '' },
  bearerTokenError: { type: String, default: '' },
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
.tcs-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.span-2 {
  grid-column: 1 / -1;
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

.form-input,
.form-textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  font-size: 15px;
  color: #111827;
}

.form-textarea {
  min-height: 112px;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
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
