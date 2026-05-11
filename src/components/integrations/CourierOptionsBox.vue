<template>
  <div class="options-box">
    <div class="options-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-.19 2.81 2 2 0 0 1-2.81-.19l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.81-.19 2 2 0 0 1 .19-2.81l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.81-2.81l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.81 2.81l-.06.06A1.65 1.65 0 0 0 19.4 8a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </div>
    <p class="options-text">{{ placeholderText }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getCourierBySlug } from '../../constants/couriers';

const props = defineProps({
  courierSlug: { type: String, default: null },
});

const placeholderText = computed(() => {
  if (!props.courierSlug) {
    return 'Select a courier above to see its configuration options.';
  }
  return getCourierBySlug(props.courierSlug)?.placeholder ?? 'Courier configuration options will appear here.';
});
</script>

<style scoped>
.options-box {
  width: 100%;
  min-height: 120px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  gap: 12px;
}

.options-icon svg {
  width: 32px;
  height: 32px;
}

.options-text {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.4;
}
</style>
