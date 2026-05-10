<template>
  <div class="webhook-section">
    <label class="form-label">Shopify Webhook URL</label>
    <p class="form-sublabel">
      Paste this URL into your Shopify webhook settings to receive order events for this brand.
    </p>

    <div class="url-box">
      <span class="url-text">{{ webhookUrl }}</span>
      <button type="button" class="copy-btn" @click="copyUrl">
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>

    <button type="button" class="regen-link" @click="$emit('requestRegenerate')">
      Regenerate webhook URL
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  webhookUrl: { type: String, required: true },
});

defineEmits(['requestRegenerate']);

const copied = ref(false);

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.webhookUrl);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // fallback for older browsers
    const el = document.createElement('textarea');
    el.value = props.webhookUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
};
</script>

<style scoped>
.webhook-section {
  border-top: 1px solid #f3f4f6;
  padding-top: 24px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-sublabel {
  font-size: 12.5px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.url-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  gap: 12px;
}

.url-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: #374151;
  word-break: break-all;
  flex: 1;
  user-select: all;
}

.copy-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.copy-btn:hover {
  text-decoration: underline;
}

.regen-link {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  padding: 0;
  width: fit-content;
}

.regen-link:hover {
  text-decoration: underline;
}
</style>
